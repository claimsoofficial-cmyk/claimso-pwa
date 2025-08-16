import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

// Agent authentication configuration
const AGENT_JWT_SECRET = process.env.AGENT_JWT_SECRET || 'your-agent-jwt-secret-change-this';
const AGENT_JWT_ISSUER = 'claimso-agent-system';
const AGENT_JWT_AUDIENCE = 'claimso-agents';

// Agent types for AWS Lambda functions
export type AgentType = 'email-monitoring' | 'retailer-api' | 'bank-integration' | 'duplicate-detection' | 
                       'product-intelligence' | 'warranty-intelligence' | 'warranty-claim' | 'cash-extraction' |
                       'browser-extension' | 'mobile-app';

// Generate JWT token for agent authentication
async function generateAgentToken(agentType: AgentType, userId?: string): Promise<string> {
  const secret = new TextEncoder().encode(AGENT_JWT_SECRET);
  
  const token = await new SignJWT({
    agentId: `${agentType}-${Date.now()}`,
    agentType: agentType,
    permissions: getAgentPermissions(agentType),
    userId: userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(AGENT_JWT_ISSUER)
    .setAudience(AGENT_JWT_AUDIENCE)
    .setExpirationTime('1h') // Short-lived tokens for security
    .sign(secret);
    
  return token;
}

// Get permissions for each agent type
function getAgentPermissions(agentType: AgentType): string[] {
  const permissions = {
    'email-monitoring': ['read:emails', 'create:products', 'read:users'],
    'retailer-api': ['read:retailer_data', 'create:products', 'update:products'],
    'bank-integration': ['read:transactions', 'create:products', 'read:users'],
    'duplicate-detection': ['read:products', 'update:products', 'delete:products'],
    'product-intelligence': ['read:products', 'update:products', 'read:market_data'],
    'warranty-intelligence': ['read:products', 'update:warranties', 'read:warranty_data'],
    'warranty-claim': ['read:products', 'create:claims', 'update:claims'],
    'cash-extraction': ['read:products', 'read:market_data', 'create:offers'],
    'browser-extension': ['create:products', 'read:users'],
    'mobile-app': ['create:products', 'read:users']
  };
  
  return permissions[agentType] || [];
}

// Create secure Supabase client for agents
async function createSecureAgentClient(agentType: AgentType, userId?: string) {
  const token = await generateAgentToken(agentType, userId);
  
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

// Export interface definitions
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
  source: 'email' | 'browser' | 'mobile' | 'bank' | 'retailer_api' | 'manual' | 'unknown';
}

// Secure database functions
export async function getActiveUsers(agentType: AgentType): Promise<DatabaseUser[]> {
  const supabase = await createSecureAgentClient(agentType);
  
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

export async function createProduct(
  agentType: AgentType, 
  product: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
): Promise<string | null> {
  const supabase = await createSecureAgentClient(agentType, userId);
  
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

export async function updateProduct(
  agentType: AgentType, 
  id: string, 
  updates: Partial<DatabaseProduct>,
  userId?: string
): Promise<boolean> {
  const supabase = await createSecureAgentClient(agentType, userId);
  
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

export async function getProductsByUserId(
  agentType: AgentType, 
  userId: string
): Promise<DatabaseProduct[]> {
  const supabase = await createSecureAgentClient(agentType, userId);
  
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

// Legacy function for backward compatibility (deprecated)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
