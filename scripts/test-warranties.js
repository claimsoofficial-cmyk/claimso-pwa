const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fryifnzncbfeodmuziut.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyeWlmbnpuY2JmZW9kbXV6aXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcyMDAzNCwiZXhwIjoyMDcwMjk2MDM0fQ.NRbzUfpPUSwfgY_QmSUoS93bTzSLXUBhzebDLz7AIoQ'
);

async function testWarrantiesFetch() {
  const userId = '5cbd0756-963e-4777-96d7-629edf66e0ca';
  
  console.log('🔍 Testing warranties fetch for user:', userId);
  
  try {
    // Test 1: Fetch products
    console.log('\n📦 Fetching products...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('❌ Products error:', productsError);
      return;
    }

    console.log('✅ Products found:', productsData.length);
    productsData.forEach(p => console.log(`  - ${p.product_name} (ID: ${p.id})`));

    // Test 2: Fetch warranties
    console.log('\n🛡️ Fetching warranties...');
    const { data: warrantiesData, error: warrantiesError } = await supabase
      .from('warranties')
      .select('*')
      .eq('user_id', userId);

    if (warrantiesError) {
      console.error('❌ Warranties error:', warrantiesError);
      return;
    }

    console.log('✅ Warranties found:', warrantiesData.length);
    warrantiesData.forEach(w => console.log(`  - Product ID: ${w.product_id}, Type: ${w.warranty_type}, End: ${w.warranty_end_date}`));

    // Test 3: Merge and verify
    console.log('\n🔗 Merging products with warranties...');
    const productsWithWarranties = (productsData || []).map(product => {
      const productWarranties = (warrantiesData || []).filter(w => w.product_id === product.id);
      return {
        ...product,
        warranties: productWarranties
      };
    });

    console.log('📊 Final result:');
    productsWithWarranties.forEach(p => {
      console.log(`  - ${p.product_name}: ${p.warranties.length} warranties`);
      if (p.warranties.length > 0) {
        p.warranties.forEach(w => {
          console.log(`    * ${w.warranty_type} warranty (ends: ${w.warranty_end_date})`);
        });
      }
    });

    // Test 4: Check active warranties
    const activeWarranties = productsWithWarranties.filter(p => {
      if (!p.warranties || !Array.isArray(p.warranties)) return false;
      return p.warranties.some(w => {
        if (!w.warranty_end_date) return true;
        return new Date(w.warranty_end_date) > new Date();
      });
    });

    console.log(`\n✅ Active warranties: ${activeWarranties.length}`);
    activeWarranties.forEach(p => console.log(`  - ${p.product_name}`));

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testWarrantiesFetch();
