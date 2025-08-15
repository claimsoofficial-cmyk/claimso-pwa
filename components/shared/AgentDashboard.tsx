'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  TrendingUp,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import {
  getAgentStatus,
  getAgentMetrics,
  formatAgentStatus,
  formatTimeDifference,
  isAgentDueForRun,
  type AgentStatus,
  type AgentMetrics
} from '@/lib/services/agent-integration-service';

export default function AgentDashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  // ==============================================================================
  // DATA FETCHING
  // ==============================================================================

  const fetchAgentData = async () => {
    try {
      setIsRefreshing(true);
      const [agentsData, metricsData] = await Promise.all([
        getAgentStatus(),
        getAgentMetrics()
      ]);
      setAgents(agentsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
    // Refresh every 30 seconds to show real-time agent activity
    const interval = setInterval(fetchAgentData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    fetchAgentData();
  };

  const toggleErrorExpansion = (agentName: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(agentName)) {
      newExpanded.delete(agentName);
    } else {
      newExpanded.add(agentName);
    }
    setExpandedErrors(newExpanded);
  };

  // ==============================================================================
  // RENDER FUNCTIONS
  // ==============================================================================

  const renderAgentCard = (agent: AgentStatus) => {
    const isDue = isAgentDueForRun(agent.nextRun);
    const isRunning = agent.status === 'running';
    const isCompleted = agent.status === 'completed';
    const isFailed = agent.status === 'failed';
    const hasErrors = agent.errors.length > 0;
    const isExpanded = expandedErrors.has(agent.agentName);
    
    return (
      <Card key={agent.agentName} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className={`h-5 w-5 ${
                isRunning ? 'text-blue-600 animate-pulse' : 
                isCompleted ? 'text-green-600' : 
                isFailed ? 'text-red-600' : 'text-gray-600'
              }`} />
              <CardTitle className="text-lg font-semibold">
                {agent.agentName.replace('Agent', '')}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={isCompleted ? 'default' : 
                        isRunning ? 'secondary' : 
                        isFailed ? 'destructive' : 'outline'}
                className="text-xs"
              >
                {formatAgentStatus(agent.status)}
              </Badge>
              {isDue && !isRunning && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                  Due Soon
                </Badge>
              )}
              {isRunning && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-600">Working</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Status Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Last Run</p>
                <p className="font-medium">{formatTimeDifference(agent.lastRun)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Next Run</p>
                <p className="font-medium">{formatTimeDifference(agent.nextRun)}</p>
              </div>
            </div>
            
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Products Processed</p>
                <p className="font-medium">{agent.productsProcessed}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Errors</p>
                <p className="font-medium text-red-600">{agent.errors.length}</p>
              </div>
            </div>
            
            {/* Error Details */}
            {hasErrors && (
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleErrorExpansion(agent.agentName)}
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {agent.errors.length} Error{agent.errors.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                {isExpanded && (
                  <div className="mt-2 space-y-1">
                    {agent.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-700 bg-red-100 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Agent Description */}
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
              {getAgentDescription(agent.agentName)}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Settings className="h-3 w-3" />
                </Button>
                {isRunning ? (
                  <Button size="sm" variant="ghost" className="h-7 px-2">
                    <Pause className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="h-7 px-2">
                    <Play className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Auto-scheduled
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getAgentDescription = (agentName: string): string => {
    const descriptions: { [key: string]: string } = {
      'EmailMonitoringAgent': 'Automatically scans your emails for purchase confirmations and receipts',
      'RetailerAPIAgent': 'Directly connects to your retailer accounts to capture purchase data',
      'BankIntegrationAgent': 'Analyzes your bank transactions to detect product purchases',
      'DuplicateDetectionAgent': 'Prevents duplicate products using AI-powered similarity analysis',
      'ProductIntelligenceAgent': 'Enriches product data with specifications and market information',
      'WarrantyIntelligenceAgent': 'Researches warranty coverage and extended warranty options',
      'WarrantyClaimAgent': 'Automatically files warranty claims when issues are detected',
      'CashExtractionAgent': 'Monitors market prices and identifies optimal selling opportunities'
    };
    return descriptions[agentName] || 'AI agent working in the background to maximize your product value';
  };

  const renderMetricsCard = () => {
    if (!metrics) return null;
    
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Automated Agent System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.totalAgents}</p>
              <p className="text-sm text-muted-foreground">AI Agents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.activeAgents}</p>
              <p className="text-sm text-muted-foreground">Active Now</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{metrics.totalProductsProcessed}</p>
              <p className="text-sm text-muted-foreground">Products Captured</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{metrics.uptime}%</p>
              <p className="text-sm text-muted-foreground">System Uptime</p>
            </div>
          </div>
          
          {/* Additional Metrics */}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">{metrics.averageResponseTime}s</p>
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-red-600">{metrics.totalErrors}</p>
                <p className="text-xs text-muted-foreground">Total Errors</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">
                  {metrics.totalErrors === 0 ? '100%' : 
                   `${Math.round(((metrics.totalProductsProcessed - metrics.totalErrors) / metrics.totalProductsProcessed) * 100)}%`}
                </p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🤖 AI Agents Working for You</h2>
          <p className="text-muted-foreground">
            Your intelligent agents are working automatically in the background
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Read-only monitoring</span>
          </div>
        </div>
      </div>

      {/* Metrics Card */}
      {renderMetricsCard()}

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(renderAgentCard)}
      </div>

      {/* Info Section */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-green-800">🎯 How Your AI Agents Work:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-blue-600">🔄 Automatic Capture</h5>
                <p className="text-muted-foreground">
                  Agents automatically detect purchases from emails, retailer APIs, and bank transactions
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-green-600">🧠 Intelligent Processing</h5>
                <p className="text-muted-foreground">
                  AI enriches product data with specifications, warranty info, and market value
                </p>
              </div>
              <div className="space-y-2">
                <h5 className="font-medium text-purple-600">💰 Value Maximization</h5>
                <p className="text-muted-foreground">
                  Agents continuously work to maximize value through claims, sales, and maintenance
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>💡 No manual work required!</strong> Your agents work 24/7 in the background. 
                Just live your life - we&apos;ll handle the rest.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
