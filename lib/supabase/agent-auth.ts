import { createClient } from '@supabase/supabase-js';
import { jwtVerify, SignJWT } from 'jose';

// Agent authentication configuration
const AGENT_JWT_SECRET = process.env.AGENT_JWT_SECRET || 'your-agent-jwt-secret-change-this';
const AGENT_JWT_ISSUER = 'claimso-agent-system';
const AGENT_JWT_AUDIENCE = 'claimso-agents';

// Agent types and their permissions
export interface AgentIdentity {
  agentId: string;
  agentType: 'email-monitoring' | 'retailer-api' | 'bank-integration' | 'duplicate-detection' | 
             'product-intelligence' | 'warranty-intelligence' | 'warranty-claim' | 'cash-extraction' |
             'browser-extension' | 'mobile-app';
  permissions: string[];
  userId?: string; // For user-specific operations
}

// Create a secure Supabase client for agents
export function createAgentClient(agentToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${agentToken}`,
        },
      },
    }
  );
}

// Generate JWT token for agent authentication
export async function generateAgentToken(agentIdentity: AgentIdentity): Promise<string> {
  const secret = new TextEncoder().encode(AGENT_JWT_SECRET);
  
  const token = await new SignJWT({
    agentId: agentIdentity.agentId,
    agentType: agentIdentity.agentType,
    permissions: agentIdentity.permissions,
    userId: agentIdentity.userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(AGENT_JWT_ISSUER)
    .setAudience(AGENT_JWT_AUDIENCE)
    .setExpirationTime('1h') // Short-lived tokens for security
    .sign(secret);
    
  return token;
}

// Verify agent JWT token
export async function verifyAgentToken(token: string): Promise<AgentIdentity | null> {
  try {
    const secret = new TextEncoder().encode(AGENT_JWT_SECRET);
    
    const { payload } = await jwtVerify(token, secret, {
      issuer: AGENT_JWT_ISSUER,
      audience: AGENT_JWT_AUDIENCE,
    });
    
    return {
      agentId: payload.agentId as string,
      agentType: payload.agentType as AgentIdentity['agentType'],
      permissions: payload.permissions as string[],
      userId: payload.userId as string | undefined,
    };
  } catch (error) {
    console.error('Agent token verification failed:', error);
    return null;
  }
}

// Agent permission constants
export const AGENT_PERMISSIONS = {
  READ_PRODUCTS: 'read:products',
  WRITE_PRODUCTS: 'write:products',
  READ_WARRANTIES: 'read:warranties',
  WRITE_WARRANTIES: 'write:warranties',
  READ_USER_CONNECTIONS: 'read:user_connections',
  WRITE_USER_CONNECTIONS: 'write:user_connections',
  READ_DOCUMENTS: 'read:documents',
  WRITE_DOCUMENTS: 'write:documents',
  READ_MAINTENANCE: 'read:maintenance',
  WRITE_MAINTENANCE: 'write:maintenance',
} as const;

// Agent type configurations
export const AGENT_CONFIGS: Record<AgentIdentity['agentType'], { permissions: string[] }> = {
  'email-monitoring': {
    permissions: [AGENT_PERMISSIONS.READ_USER_CONNECTIONS, AGENT_PERMISSIONS.WRITE_PRODUCTS],
  },
  'retailer-api': {
    permissions: [AGENT_PERMISSIONS.READ_USER_CONNECTIONS, AGENT_PERMISSIONS.WRITE_PRODUCTS],
  },
  'bank-integration': {
    permissions: [AGENT_PERMISSIONS.READ_USER_CONNECTIONS, AGENT_PERMISSIONS.WRITE_PRODUCTS],
  },
  'duplicate-detection': {
    permissions: [AGENT_PERMISSIONS.READ_PRODUCTS, AGENT_PERMISSIONS.WRITE_PRODUCTS],
  },
  'product-intelligence': {
    permissions: [AGENT_PERMISSIONS.READ_PRODUCTS, AGENT_PERMISSIONS.WRITE_PRODUCTS],
  },
  'warranty-intelligence': {
    permissions: [AGENT_PERMISSIONS.READ_PRODUCTS, AGENT_PERMISSIONS.WRITE_WARRANTIES],
  },
  'warranty-claim': {
    permissions: [AGENT_PERMISSIONS.READ_PRODUCTS, AGENT_PERMISSIONS.READ_WARRANTIES, AGENT_PERMISSIONS.WRITE_DOCUMENTS],
  },
  'cash-extraction': {
    permissions: [AGENT_PERMISSIONS.READ_PRODUCTS, AGENT_PERMISSIONS.READ_WARRANTIES],
  },
  'browser-extension': {
    permissions: [AGENT_PERMISSIONS.WRITE_PRODUCTS],
  },
  'mobile-app': {
    permissions: [AGENT_PERMISSIONS.WRITE_PRODUCTS, AGENT_PERMISSIONS.WRITE_DOCUMENTS],
  },
};

// Check if agent has required permission
export function hasPermission(agentIdentity: AgentIdentity, permission: string): boolean {
  return agentIdentity.permissions.includes(permission);
}

// Create agent identity for a specific agent type
export function createAgentIdentity(
  agentType: AgentIdentity['agentType'], 
  userId?: string
): AgentIdentity {
  const config = AGENT_CONFIGS[agentType];
  
  return {
    agentId: `${agentType}-${Date.now()}`,
    agentType,
    permissions: config.permissions,
    userId,
  };
}
