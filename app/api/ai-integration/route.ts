import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const AWS_AGENT_BASE_URL = process.env.NEXT_PUBLIC_AWS_AGENT_BASE_URL || 'https://566lidnwj2.execute-api.us-east-1.amazonaws.com/dev';

export async function POST(request: NextRequest) {
  try {
    const { action, agent, userId, data } = await request.json();

    if (!action || !agent || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, agent, userId' },
        { status: 400 }
      );
    }

    // Verify user authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'trigger_agent':
        return await triggerAgent(agent, userId, data);
      
      case 'get_agent_status':
        return await getAgentStatus(agent, userId);
      
      case 'get_agent_metrics':
        return await getAgentMetrics(userId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('AI Integration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function triggerAgent(agent: string, userId: string, data: any) {
  try {
    const agentEndpoints = {
      email_monitoring: `${AWS_AGENT_BASE_URL}/email-monitoring`,
      retailer_api: `${AWS_AGENT_BASE_URL}/retailer-api`,
      browser_extension: `${AWS_AGENT_BASE_URL}/browser-extension`,
      mobile_app: `${AWS_AGENT_BASE_URL}/mobile-app`,
      bank_integration: `${AWS_AGENT_BASE_URL}/bank-integration`,
      product_intelligence: `${AWS_AGENT_BASE_URL}/product-intelligence`,
      warranty_intelligence: `${AWS_AGENT_BASE_URL}/warranty-intelligence`,
      warranty_claim: `${AWS_AGENT_BASE_URL}/warranty-claim`,
      cash_extraction: `${AWS_AGENT_BASE_URL}/cash-extraction`,
      duplicate_detection: `${AWS_AGENT_BASE_URL}/duplicate-detection`
    };

    const endpoint = agentEndpoints[agent as keyof typeof agentEndpoints];
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Invalid agent type' },
        { status: 400 }
      );
    }

    // Call the AWS agent
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AWS_AGENT_API_KEY}`
      },
      body: JSON.stringify({
        userId,
        action: 'trigger',
        data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Agent error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();

    // Log agent activity
    const supabase = await createClient();
    await supabase
      .from('agent_activity_log')
      .insert({
        user_id: userId,
        agent_type: agent,
        action: 'triggered',
        data: { ...data, result },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: `${agent} agent triggered successfully`,
      data: result
    });

  } catch (error) {
    console.error(`Error triggering ${agent} agent:`, error);
    return NextResponse.json(
      { 
        error: `Failed to trigger ${agent} agent`,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getAgentStatus(agent: string, userId: string) {
  try {
    const supabase = await createClient();
    
    const { data: activity, error } = await supabase
      .from('agent_activity_log')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_type', agent)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      agent,
      status: activity ? 'active' : 'idle',
      lastActivity: activity?.created_at || null
    });

  } catch (error) {
    console.error(`Error getting ${agent} status:`, error);
    return NextResponse.json(
      { error: 'Failed to get agent status' },
      { status: 500 }
    );
  }
}

async function getAgentMetrics(userId: string) {
  try {
    const supabase = await createClient();
    
    const { data: activities, error } = await supabase
      .from('agent_activity_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      throw error;
    }

    const metrics = {
      totalAgents: 10,
      activeAgents: activities?.length || 0,
      totalProductsProcessed: activities?.filter(a => a.action === 'product_created').length || 0,
      totalErrors: activities?.filter(a => a.action === 'error').length || 0,
      averageResponseTime: 2.5, // seconds
      uptime: 99.9 // percentage
    };

    return NextResponse.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Error getting agent metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get agent metrics' },
      { status: 500 }
    );
  }
}
