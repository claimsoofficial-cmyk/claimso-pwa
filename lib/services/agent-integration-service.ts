// Agent Integration Service - Monitors deployed AWS agents (fully automated)

const AWS_AGENT_BASE_URL = process.env.NEXT_PUBLIC_AWS_AGENT_BASE_URL || 'https://fvcq8w581i.execute-api.us-east-1.amazonaws.com/test';

export interface AgentStatus {
  agentName: string;
  status: 'running' | 'completed' | 'failed' | 'idle';
  lastRun: string;
  nextRun: string;
  productsProcessed: number;
  errors: string[];
}

export interface AgentTriggerResponse {
  success: boolean;
  message: string;
  agentName: string;
  executionId?: string;
  estimatedDuration?: number;
}

export interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  totalProductsProcessed: number;
  totalErrors: number;
  averageResponseTime: number;
  uptime: number;
}

// ==============================================================================
// AGENT MONITORING FUNCTIONS (FULLY AUTOMATED)
// ==============================================================================

/**
 * Get real-time agent activity status
 * Note: Agents run automatically on schedules - no manual triggering needed
 */
export async function getAgentActivityStatus(): Promise<{
  lastActivity: string;
  activeAgents: number;
  totalExecutions: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}> {
  try {
    // This would typically call a monitoring endpoint
    // For now, return mock data showing automated operation
    return {
      lastActivity: new Date().toISOString(),
      activeAgents: 3, // Email, Retailer API, Bank agents running
      totalExecutions: 156, // Total agent executions today
      systemHealth: 'excellent'
    };
  } catch (error) {
    console.error('Error fetching agent activity:', error);
    return {
      lastActivity: new Date().toISOString(),
      activeAgents: 0,
      totalExecutions: 0,
      systemHealth: 'critical'
    };
  }
}

// ==============================================================================
// AGENT STATUS FUNCTIONS
// ==============================================================================

/**
 * Get the status of all deployed agents
 */
export async function getAgentStatus(): Promise<AgentStatus[]> {
  try {
    // This would typically call a status endpoint
    // For now, return mock data based on our deployed agents
    const agents: AgentStatus[] = [
      {
        agentName: 'EmailMonitoringAgent',
        status: 'completed',
        lastRun: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        nextRun: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        productsProcessed: 2,
        errors: []
      },
      {
        agentName: 'RetailerAPIAgent',
        status: 'completed',
        lastRun: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        nextRun: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        productsProcessed: 1,
        errors: []
      },
      {
        agentName: 'BankIntegrationAgent',
        status: 'completed',
        lastRun: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
        nextRun: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        productsProcessed: 3,
        errors: []
      },
      {
        agentName: 'DuplicateDetectionAgent',
        status: 'completed',
        lastRun: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
        nextRun: new Date(Date.now() + 21600000).toISOString(), // 6 hours from now
        productsProcessed: 7,
        errors: []
      },
      {
        agentName: 'ProductIntelligenceAgent',
        status: 'idle',
        lastRun: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        nextRun: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        productsProcessed: 0,
        errors: []
      },
      {
        agentName: 'WarrantyIntelligenceAgent',
        status: 'idle',
        lastRun: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        nextRun: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        productsProcessed: 0,
        errors: []
      },
      {
        agentName: 'WarrantyClaimAgent',
        status: 'idle',
        lastRun: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        nextRun: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        productsProcessed: 0,
        errors: []
      },
      {
        agentName: 'CashExtractionAgent',
        status: 'idle',
        lastRun: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        nextRun: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        productsProcessed: 0,
        errors: []
      }
    ];

    return agents;
  } catch (error) {
    console.error('Error fetching agent status:', error);
    return [];
  }
}

/**
 * Get overall agent metrics
 */
export async function getAgentMetrics(): Promise<AgentMetrics> {
  try {
    const agents = await getAgentStatus();
    
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'running' || a.status === 'completed').length;
    const totalProductsProcessed = agents.reduce((sum, a) => sum + a.productsProcessed, 0);
    const totalErrors = agents.reduce((sum, a) => sum + a.errors.length, 0);
    
    return {
      totalAgents,
      activeAgents,
      totalProductsProcessed,
      totalErrors,
      averageResponseTime: 5, // 5 seconds average
      uptime: 99.9 // 99.9% uptime
    };
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    return {
      totalAgents: 0,
      activeAgents: 0,
      totalProductsProcessed: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      uptime: 0
    };
  }
}

// ==============================================================================
// AGENT CONFIGURATION FUNCTIONS
// ==============================================================================

/**
 * Get available retailer integrations
 */
export function getAvailableRetailers() {
  return [
    { id: 'amazon', name: 'Amazon', regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'IN', 'CA', 'AU'] },
    { id: 'apple', name: 'Apple', regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'IN', 'CA', 'AU'] },
    { id: 'bestbuy', name: 'Best Buy', regions: ['US', 'CA'] },
    { id: 'target', name: 'Target', regions: ['US'] },
    { id: 'walmart', name: 'Walmart', regions: ['US', 'CA', 'MX'] },
    { id: 'flipkart', name: 'Flipkart', regions: ['IN'] },
    { id: 'aliexpress', name: 'AliExpress', regions: ['Global'] },
    { id: 'shopee', name: 'Shopee', regions: ['SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'TW', 'BR'] }
  ];
}

/**
 * Get available bank integration providers
 */
export function getAvailableBankProviders() {
  return [
    { id: 'plaid', name: 'Plaid', regions: ['US', 'CA'], supportedBanks: 11000 },
    { id: 'tink', name: 'Tink', regions: ['EU', 'UK', 'SE', 'NO', 'DK', 'FI'], supportedBanks: 3400 },
    { id: 'saltedge', name: 'Salt Edge', regions: ['EU', 'UK', 'CA', 'AU'], supportedBanks: 5000 },
    { id: 'yodlee', name: 'Yodlee', regions: ['US', 'IN', 'AU', 'SG'], supportedBanks: 15000 },
    { id: 'belvo', name: 'Belvo', regions: ['MX', 'BR', 'CO', 'AR', 'PE'], supportedBanks: 100 },
    { id: 'xendit', name: 'Xendit', regions: ['ID', 'PH', 'MY', 'SG', 'TH', 'VN'], supportedBanks: 200 }
  ];
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Format agent status for display
 */
export function formatAgentStatus(status: string): string {
  switch (status) {
    case 'running': return '🟢 Running';
    case 'completed': return '✅ Completed';
    case 'failed': return '❌ Failed';
    case 'idle': return '⏸️ Idle';
    default: return '❓ Unknown';
  }
}

/**
 * Format time difference for display
 */
export function formatTimeDifference(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Check if agent is due for next run
 */
export function isAgentDueForRun(nextRun: string): boolean {
  const now = new Date();
  const next = new Date(nextRun);
  return now >= next;
}
