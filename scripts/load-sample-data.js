const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sampleData = [
  // iPhone 15 Pro (Active warranty, expiring soon)
  {
    product: {
      id: uuidv4(),
      user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca',
      product_name: 'iPhone 15 Pro',
      brand: 'Apple',
      category: 'Electronics',
      purchase_date: '2024-01-15',
      purchase_price: 999.00,
      currency: 'USD',
      serial_number: 'IP15P123456789',
      condition: 'new',
      notes: '256GB, Natural Titanium',
      payment_method: 'credit_card',
      purchase_location: 'Apple Store'
    },
    warranty: {
      warranty_type: 'manufacturer',
      warranty_start_date: '2024-01-15',
      warranty_end_date: '2025-01-15',
      warranty_duration_months: 12,
      coverage_details: 'Hardware defects, manufacturing issues',
      claim_process: 'Contact Apple Support or visit Apple Store',
      contact_info: '1-800-APL-CARE',
      snapshot_data: {
        covers: ['Hardware defects', 'Manufacturing issues'],
        does_not_cover: ['Water damage', 'Physical damage'],
        key_terms: ['1 year limited warranty', '90 days phone support']
      },
      ai_confidence_score: 0.95
    }
  },
  
  // MacBook Air M2 (Active warranty, long duration)
  {
    product: {
      id: uuidv4(),
      user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca',
      product_name: 'MacBook Air M2',
      brand: 'Apple',
      category: 'Electronics',
      purchase_date: '2023-06-10',
      purchase_price: 1199.00,
      currency: 'USD',
      serial_number: 'MBA-M2-987654321',
      condition: 'new',
      notes: '13-inch, 8GB RAM, 256GB SSD',
      payment_method: 'apple_pay',
      purchase_location: 'Apple Store'
    },
    warranty: {
      warranty_type: 'manufacturer',
      warranty_start_date: '2023-06-10',
      warranty_end_date: '2025-06-10',
      warranty_duration_months: 24,
      coverage_details: 'Hardware defects, battery issues',
      claim_process: 'Contact Apple Support or visit Apple Store',
      contact_info: '1-800-APL-CARE',
      snapshot_data: {
        covers: ['Hardware defects', 'Battery issues'],
        does_not_cover: ['Accidental damage', 'Software issues'],
        key_terms: ['2 year limited warranty']
      },
      ai_confidence_score: 0.95
    }
  },

  // Samsung TV (Expired warranty)
  {
    product: {
      id: uuidv4(),
      user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca',
      product_name: 'Samsung 65" QLED 4K TV',
      brand: 'Samsung',
      category: 'Electronics',
      purchase_date: '2022-03-20',
      purchase_price: 1299.00,
      currency: 'USD',
      serial_number: 'SAM-TV-65-456789',
      condition: 'new',
      notes: '65-inch, QLED, 4K resolution',
      payment_method: 'credit_card',
      purchase_location: 'Best Buy'
    },
    warranty: {
      warranty_type: 'manufacturer',
      warranty_start_date: '2022-03-20',
      warranty_end_date: '2023-03-20',
      warranty_duration_months: 12,
      coverage_details: 'Hardware defects, panel issues',
      claim_process: 'Contact Samsung Support',
      contact_info: '1-800-SAMSUNG',
      snapshot_data: {
        covers: ['Hardware defects', 'Panel issues'],
        does_not_cover: ['Physical damage', 'Burn-in'],
        key_terms: ['1 year limited warranty']
      },
      ai_confidence_score: 0.90
    }
  },

  // Sony Headphones (No warranty)
  {
    product: {
      id: uuidv4(),
      user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca',
      product_name: 'Sony WH-1000XM5 Headphones',
      brand: 'Sony',
      category: 'Electronics',
      purchase_date: '2024-02-28',
      purchase_price: 349.99,
      currency: 'USD',
      serial_number: 'SONY-WH-1000XM5-123',
      condition: 'new',
      notes: 'Wireless noise-canceling headphones',
      payment_method: 'debit_card',
      purchase_location: 'Amazon'
    }
  },

  // Dyson Vacuum (Extended warranty, expiring soon)
  {
    product: {
      id: uuidv4(),
      user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca',
      product_name: 'Dyson V15 Detect',
      brand: 'Dyson',
      category: 'Home & Garden',
      purchase_date: '2023-08-15',
      purchase_price: 699.99,
      currency: 'USD',
      serial_number: 'DYSON-V15-789456',
      condition: 'new',
      notes: 'Cordless vacuum with laser detection',
      payment_method: 'credit_card',
      purchase_location: 'Target'
    },
    warranty: {
      warranty_type: 'extended',
      warranty_start_date: '2023-08-15',
      warranty_end_date: '2024-11-15',
      warranty_duration_months: 15,
      coverage_details: 'Parts and labor, motor coverage',
      claim_process: 'Contact Dyson Support',
      contact_info: '1-866-DYSON-US',
      snapshot_data: {
        covers: ['Parts and labor', 'Motor coverage'],
        does_not_cover: ['Normal wear and tear', 'Battery'],
        key_terms: ['Extended warranty', '15 months coverage']
      },
      ai_confidence_score: 0.88
    }
  },

  // Tide Laundry Detergent (No warranty - consumable)
  {
    product: {
      id: uuidv4(),
      user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca',
      product_name: 'Tide Original Laundry Detergent',
      brand: 'Tide',
      category: 'Home & Garden',
      purchase_date: '2024-01-10',
      purchase_price: 12.99,
      currency: 'USD',
      serial_number: null,
      condition: 'new',
      notes: '150 oz bottle, original scent',
      payment_method: 'cash',
      purchase_location: 'Walmart'
    }
  },

  // Gold Chain (High value, no warranty)
  {
    product: {
      id: uuidv4(),
      user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca',
      product_name: '18K Gold Chain Necklace',
      brand: 'Generic',
      category: 'Clothing & Accessories',
      purchase_date: '2023-11-20',
      purchase_price: 2500.00,
      currency: 'USD',
      serial_number: 'GC-18K-789123',
      condition: 'new',
      notes: '24-inch chain, 18K gold, 5mm width',
      payment_method: 'bank_transfer',
      purchase_location: 'Local Jewelry Store'
    }
  },

  // Peloton Bike (Extended warranty, active)
  {
    product: {
      id: uuidv4(),
      user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca',
      product_name: 'Peloton Bike+',
      brand: 'Peloton',
      category: 'Sports & Outdoors',
      purchase_date: '2023-10-12',
      purchase_price: 2495.00,
      currency: 'USD',
      serial_number: 'PEL-BIKE-123456',
      condition: 'new',
      notes: 'Premium bike with rotating HD touchscreen',
      payment_method: 'credit_card',
      purchase_location: 'Peloton'
    },
    warranty: {
      warranty_type: 'extended',
      warranty_start_date: '2023-10-12',
      warranty_end_date: '2026-10-12',
      warranty_duration_months: 36,
      coverage_details: 'Frame, electronics, and labor',
      claim_process: 'Contact Peloton Support',
      contact_info: '1-866-679-9129',
      snapshot_data: {
        covers: ['Frame', 'Electronics', 'Labor'],
        does_not_cover: ['Normal wear and tear', 'Software issues'],
        key_terms: ['3 year extended warranty']
      },
      ai_confidence_score: 0.94
    }
  }
];

async function loadSampleData() {
  try {
    console.log('🚀 Loading sample data...');
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await supabase
      .from('warranties')
      .delete()
      .eq('user_id', '5cbd0756-963e-4777-96d7-629edf66e0ca');
    
    await supabase
      .from('products')
      .delete()
      .eq('user_id', '5cbd0756-963e-4777-96d7-629edf66e0ca');

    // Insert products and warranties
    for (const item of sampleData) {
      console.log(`📦 Inserting ${item.product.product_name}...`);
      
      // Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(item.product)
        .select()
        .single();

      if (productError) {
        console.error(`❌ Error inserting product ${item.product.product_name}:`, productError);
        continue;
      }

      // Insert warranty if exists
      if (item.warranty) {
        const warrantyData = {
          ...item.warranty,
          product_id: product.id,
          user_id: '5cbd0756-963e-4777-96d7-629edf66e0ca'
        };

        const { error: warrantyError } = await supabase
          .from('warranties')
          .insert(warrantyData);

        if (warrantyError) {
          console.error(`❌ Error inserting warranty for ${item.product.product_name}:`, warrantyError);
        } else {
          console.log(`✅ Warranty added for ${item.product.product_name}`);
        }
      }

      console.log(`✅ ${item.product.product_name} added successfully`);
    }

    console.log('🎉 Sample data loaded successfully!');
    console.log(`📊 Total products: ${sampleData.length}`);
    console.log(`🛡️ Products with warranties: ${sampleData.filter(item => item.warranty).length}`);

  } catch (error) {
    console.error('💥 Error loading sample data:', error);
  }
}

// Load environment variables
require('dotenv').config();

// Run the script
loadSampleData();
