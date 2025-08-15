import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  settings: {
    email_monitoring_enabled: boolean;
    browser_extension_enabled: boolean;
    mobile_app_enabled: boolean;
  };
}

export interface DatabaseProduct {
  id: string;
  user_id: string;
  product_name: string;
  brand: string;
  model: string;
  category: string;
  purchase_date: string;
  purchase_price: number;
  currency: string;
  purchase_location: string;
  serial_number: string;
  condition: string;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  warranty_length_months: number;
  payment_method: string;
  retailer_url: string;
  affiliate_id: string;
  name: string;
  description: string;
  retailer: string;
  order_number: string;
  warranty_info: any;
  market_value: number;
  source: 'email' | 'browser' | 'mobile' | 'bank' | 'retailer_api' | 'manual' | 'unknown'; // NEW: Track capture source
}

export async function getActiveUsers(): Promise<DatabaseUser[]> {
  // First, get all users from auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return [];
  }

  // Filter for confirmed users and map to our format
  const activeUsers = authUsers.users
    .filter(user => user.email_confirmed_at) // Only confirmed users
    .map(user => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
      settings: {
        email_monitoring_enabled: true, // Default to enabled
        browser_extension_enabled: true,
        mobile_app_enabled: true
      }
    }));

  console.log(`Found ${activeUsers.length} active users`);
  return activeUsers;
}

export async function createProduct(product: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select('id')
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }

  return data.id;
}

export async function updateProduct(id: string, updates: Partial<DatabaseProduct>): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    return false;
  }

  return true;
}

export async function getProductsByUserId(userId: string): Promise<DatabaseProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products by user ID:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products by user ID:', error);
    return [];
  }
}
