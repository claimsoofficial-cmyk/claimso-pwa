import { createClient } from '@supabase/supabase-js';
import { 
  createAgentIdentity, 
  generateAgentToken, 
  verifyAgentToken, 
  hasPermission,
  AGENT_PERMISSIONS,
  type AgentIdentity 
} from '@/lib/supabase/agent-auth';

// Secure agent database service
export class SecureAgentDatabase {
  private agentIdentity: AgentIdentity;
  private agentToken: string | null = null;
  private supabaseClient: ReturnType<typeof createClient> | null = null;

  constructor(agentType: AgentIdentity['agentType'], userId?: string) {
    this.agentIdentity = createAgentIdentity(agentType, userId);
  }

  // Initialize the secure connection
  async initialize(): Promise<void> {
    try {
      // Generate JWT token for this agent
      this.agentToken = await generateAgentToken(this.agentIdentity);
      
      // Create Supabase client with agent token
      this.supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${this.agentToken}`,
            },
          },
        }
      );
      
      console.log(`✅ Agent ${this.agentIdentity.agentType} initialized with token`);
    } catch (error) {
      console.error('❌ Failed to initialize agent database:', error);
      throw error;
    }
  }

  // Verify the agent has required permission
  private checkPermission(permission: string): void {
    if (!hasPermission(this.agentIdentity, permission)) {
      throw new Error(`Agent ${this.agentIdentity.agentType} lacks permission: ${permission}`);
    }
  }

  // Get Supabase client (throws if not initialized)
  private getClient() {
    if (!this.supabaseClient) {
      throw new Error('Agent database not initialized. Call initialize() first.');
    }
    return this.supabaseClient;
  }

  // ==============================================================================
  // PRODUCT OPERATIONS
  // ==============================================================================

  async getProducts(userId?: string) {
    this.checkPermission(AGENT_PERMISSIONS.READ_PRODUCTS);
    
    const client = this.getClient();
    let query = client.from('products').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    return data;
  }

  async createProduct(productData: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_PRODUCTS);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }
    
    return data;
  }

  async updateProduct(productId: string, updates: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_PRODUCTS);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
    
    return data;
  }

  // ==============================================================================
  // WARRANTY OPERATIONS
  // ==============================================================================

  async getWarranties(productId?: string) {
    this.checkPermission(AGENT_PERMISSIONS.READ_WARRANTIES);
    
    const client = this.getClient();
    let query = client.from('warranties').select('*');
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching warranties:', error);
      throw error;
    }
    
    return data;
  }

  async createWarranty(warrantyData: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_WARRANTIES);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('warranties')
      .insert(warrantyData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating warranty:', error);
      throw error;
    }
    
    return data;
  }

  async updateWarranty(warrantyId: string, updates: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_WARRANTIES);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('warranties')
      .update(updates)
      .eq('id', warrantyId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating warranty:', error);
      throw error;
    }
    
    return data;
  }

  // ==============================================================================
  // USER CONNECTION OPERATIONS
  // ==============================================================================

  async getUserConnections(userId?: string) {
    this.checkPermission(AGENT_PERMISSIONS.READ_USER_CONNECTIONS);
    
    const client = this.getClient();
    let query = client.from('user_connections').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching user connections:', error);
      throw error;
    }
    
    return data;
  }

  async createUserConnection(connectionData: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_USER_CONNECTIONS);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('user_connections')
      .insert(connectionData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user connection:', error);
      throw error;
    }
    
    return data;
  }

  async updateUserConnection(connectionId: string, updates: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_USER_CONNECTIONS);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('user_connections')
      .update(updates)
      .eq('id', connectionId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user connection:', error);
      throw error;
    }
    
    return data;
  }

  // ==============================================================================
  // DOCUMENT OPERATIONS
  // ==============================================================================

  async getDocuments(productId?: string) {
    this.checkPermission(AGENT_PERMISSIONS.READ_DOCUMENTS);
    
    const client = this.getClient();
    let query = client.from('documents').select('*');
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
    
    return data;
  }

  async createDocument(documentData: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_DOCUMENTS);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('documents')
      .insert(documentData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating document:', error);
      throw error;
    }
    
    return data;
  }

  async updateDocument(documentId: string, updates: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_DOCUMENTS);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document:', error);
      throw error;
    }
    
    return data;
  }

  // ==============================================================================
  // MAINTENANCE OPERATIONS
  // ==============================================================================

  async getMaintenanceRecords(productId?: string) {
    this.checkPermission(AGENT_PERMISSIONS.READ_MAINTENANCE);
    
    const client = this.getClient();
    let query = client.from('maintenance_records').select('*');
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching maintenance records:', error);
      throw error;
    }
    
    return data;
  }

  async createMaintenanceRecord(recordData: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_MAINTENANCE);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('maintenance_records')
      .insert(recordData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
    
    return data;
  }

  async updateMaintenanceRecord(recordId: string, updates: any) {
    this.checkPermission(AGENT_PERMISSIONS.WRITE_MAINTENANCE);
    
    const client = this.getClient();
    const { data, error } = await client
      .from('maintenance_records')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
    
    return data;
  }

  // ==============================================================================
  // UTILITY METHODS
  // ==============================================================================

  // Get agent identity for logging/debugging
  getAgentInfo() {
    return {
      agentId: this.agentIdentity.agentId,
      agentType: this.agentIdentity.agentType,
      permissions: this.agentIdentity.permissions,
      userId: this.agentIdentity.userId,
    };
  }

  // Check if agent has specific permission
  hasPermission(permission: string): boolean {
    return hasPermission(this.agentIdentity, permission);
  }

  // Refresh token if needed
  async refreshToken(): Promise<void> {
    if (this.agentToken) {
      // Verify current token
      const isValid = await verifyAgentToken(this.agentToken);
      if (!isValid) {
        // Token expired, generate new one
        await this.initialize();
      }
    }
  }
}

// Factory function to create agent database instances
export function createAgentDatabase(
  agentType: AgentIdentity['agentType'], 
  userId?: string
): SecureAgentDatabase {
  return new SecureAgentDatabase(agentType, userId);
}
