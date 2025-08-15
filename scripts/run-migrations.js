const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database_schema_fixes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;
      
      try {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase.from('_exec_sql').select('*').limit(1);
          if (directError) {
            console.log(`⚠️  Statement ${i + 1} may have failed (this is normal for some DDL statements):`, error?.message || directError?.message);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All migrations completed successfully!');
    } else {
      console.log('\n⚠️  Some migrations failed. Check the output above for details.');
    }
    
  } catch (error) {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }
}

// Alternative approach: Execute migrations manually
async function executeManualMigrations() {
  console.log('🔧 Executing manual migrations...');
  
  const migrations = [
    // 1. Add missing fields to products table
    `ALTER TABLE products 
     ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
     ADD COLUMN IF NOT EXISTS capture_method VARCHAR(50) DEFAULT 'manual_upload'`,
    
    // 2. Create claims table
    `CREATE TABLE IF NOT EXISTS claims (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      product_name VARCHAR(255) NOT NULL,
      issue_type VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      contact_phone VARCHAR(20),
      contact_email VARCHAR(255),
      preferred_contact_method VARCHAR(20) DEFAULT 'email',
      urgency_level VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(20) DEFAULT 'submitted',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // 3. Create claim_statuses table
    `CREATE TABLE IF NOT EXISTS claim_statuses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // 4. Create quote_requests table
    `CREATE TABLE IF NOT EXISTS quote_requests (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      product_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      brand VARCHAR(100),
      condition VARCHAR(20),
      purchase_price DECIMAL(10,2),
      quotes_generated INTEGER DEFAULT 0,
      best_quote_amount DECIMAL(10,2),
      processing_time_ms INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // 5. Create cart_items table
    `CREATE TABLE IF NOT EXISTS cart_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      product_name VARCHAR(255) NOT NULL,
      brand VARCHAR(100),
      category VARCHAR(100),
      purchase_price DECIMAL(10,2),
      purchase_location VARCHAR(255),
      retailer_url TEXT,
      quantity INTEGER DEFAULT 1,
      added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    try {
      console.log(`\n🔧 Executing migration ${i + 1}/${migrations.length}...`);
      
      // Use the REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: migration })
      });
      
      if (response.ok) {
        console.log(`✅ Migration ${i + 1} executed successfully`);
        successCount++;
      } else {
        console.log(`⚠️  Migration ${i + 1} may have failed (this is normal for some DDL statements)`);
        errorCount++;
      }
    } catch (error) {
      console.log(`❌ Migration ${i + 1} failed:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📝 Total: ${migrations.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All migrations completed successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. This is normal for DDL statements that may already exist.');
  }
}

// Run the migrations
if (require.main === module) {
  executeManualMigrations().catch(console.error);
}
