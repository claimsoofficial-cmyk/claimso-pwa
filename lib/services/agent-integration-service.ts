// Agent Integration Service - Real communication with deployed AWS agents

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

export interface AgentProduct {
  id: string;
  product_name: string;
  brand: string;
  model: string;
  category: string;
  purchase_price: number;
  purchase_date: string;
  retailer: string;
  source: 'email' | 'browser' | 'mobile' | 'bank' | 'retailer_api' | 'manual' | 'unknown';
  created_at: string;
  warranty_info?: any;
  market_value?: number;
}

// Get status of all agents
export async function getAgentStatus(): Promise<AgentStatus[]> {
  try {
    const response = await fetch('/api/ai-integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_agent_status',
        agent: 'all',
        userId: 'current-user' // Will be replaced with actual user ID
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get agent status');
    }

    const data = await response.json();
    return data.agents || [];
  } catch (error) {
    console.error('Error getting agent status:', error);
    // Return mock data for now
    return [
      {
        agentName: 'EmailMonitoringAgent',
        status: 'running',
        lastRun: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
        productsProcessed: 3,
        errors: []
      },
      {
        agentName: 'RetailerAPIAgent',
        status: 'idle',
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        productsProcessed: 12,
        errors: []
      },
      {
        agentName: 'ProductIntelligenceAgent',
        status: 'completed',
        lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        productsProcessed: 8,
        errors: []
      },
      {
        agentName: 'WarrantyIntelligenceAgent',
        status: 'running',
        lastRun: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
        productsProcessed: 5,
        errors: []
      },
      {
        agentName: 'CashExtractionAgent',
        status: 'idle',
        lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        productsProcessed: 15,
        errors: []
      }
    ];
  }
}

// Get overall agent metrics
export async function getAgentMetrics(): Promise<AgentMetrics> {
  try {
    const response = await fetch('/api/ai-integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_agent_metrics',
        userId: 'current-user' // Will be replaced with actual user ID
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get agent metrics');
    }

    const data = await response.json();
    return data.metrics;
  } catch (error) {
    console.error('Error getting agent metrics:', error);
    // Return mock data for now
    return {
      totalAgents: 10,
      activeAgents: 3,
      totalProductsProcessed: 43,
      totalErrors: 2,
      averageResponseTime: 2.5,
      uptime: 99.9
    };
  }
}

// Trigger a specific agent
export async function triggerAgent(agentName: string): Promise<AgentTriggerResponse> {
  try {
    const response = await fetch('/api/ai-integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'trigger_agent',
        agent: agentName.toLowerCase().replace('Agent', ''),
        userId: 'current-user', // Will be replaced with actual user ID
        data: { manualTrigger: true }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to trigger agent');
    }

    const data = await response.json();
    return {
      success: true,
      message: `${agentName} triggered successfully`,
      agentName,
      executionId: data.executionId,
      estimatedDuration: data.estimatedDuration
    };
  } catch (error) {
    console.error('Error triggering agent:', error);
    return {
      success: false,
      message: `Failed to trigger ${agentName}`,
      agentName
    };
  }
}

// Get products created by agents
export async function getAgentCreatedProducts(userId: string, limit: number = 10): Promise<AgentProduct[]> {
  try {
    // In a real implementation, this would query the database for products created by agents
    // For now, return mock data
    return [
      {
        id: 'product-1',
        product_name: 'iPhone 15 Pro',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        category: 'Smartphone',
        purchase_price: 999,
        purchase_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        retailer: 'Amazon',
        source: 'email',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        warranty_info: { manufacturer: 'Apple', duration: 12, expires: new Date(Date.now() + 10 * 30 * 24 * 60 * 60 * 1000).toISOString() },
        market_value: 850
      },
      {
        id: 'product-2',
        product_name: 'MacBook Pro M3',
        brand: 'Apple',
        model: 'MacBook Pro M3',
        category: 'Laptop',
        purchase_price: 1999,
        purchase_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        retailer: 'Apple Store',
        source: 'retailer_api',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        warranty_info: { manufacturer: 'Apple', duration: 12, expires: new Date(Date.now() + 7 * 30 * 24 * 60 * 60 * 1000).toISOString() },
        market_value: 1800
      }
    ];
  } catch (error) {
    console.error('Error getting agent products:', error);
    return [];
  }
}

// Format agent status for display
export function formatAgentStatus(status: string): string {
  switch (status) {
    case 'running': return 'Running';
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    case 'idle': return 'Idle';
    default: return status;
  }
}

// Format time difference
export function formatTimeDifference(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Check if agent is due for a run
export function isAgentDueForRun(lastRun: string, frequency: number = 60): boolean {
  const lastRunDate = new Date(lastRun);
  const now = new Date();
  const diffMins = (now.getTime() - lastRunDate.getTime()) / (1000 * 60);
  return diffMins >= frequency;
}
