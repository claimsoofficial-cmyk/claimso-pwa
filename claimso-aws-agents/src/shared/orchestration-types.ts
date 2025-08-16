// ==============================================================================
// MASTER ORCHESTRATOR TYPES
// ==============================================================================

export interface OrchestrationRequest {
  id: string;
  userId: string;
  intent: UserIntent;
  context: RequestContext;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  source: 'pwa' | 'api' | 'webhook' | 'scheduled';
}

export interface UserIntent {
  type: IntentType;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  entities: IntentEntity[];
}

export type IntentType = 
  | 'purchase_detection'
  | 'product_enrichment'
  | 'warranty_research'
  | 'value_optimization'
  | 'claim_processing'
  | 'cash_extraction'
  | 'maintenance_scheduling'
  | 'user_query'
  | 'system_health'
  | 'data_sync';

export interface IntentEntity {
  type: 'product' | 'retailer' | 'date' | 'price' | 'category' | 'brand';
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  previousActions?: string[];
  userPreferences?: UserPreferences;
  deviceInfo?: DeviceInfo;
}

export interface UserPreferences {
  notificationPreferences: NotificationPreferences;
  privacySettings: PrivacySettings;
  automationLevel: 'manual' | 'semi_auto' | 'full_auto';
  preferredRetailers: string[];
  excludedCategories: string[];
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface PrivacySettings {
  dataSharing: boolean;
  analytics: boolean;
  thirdPartyAccess: boolean;
}

export interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet';
  platform: string;
  browser?: string;
  appVersion?: string;
}

// ==============================================================================
// WORKFLOW ORCHESTRATION TYPES
// ==============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: AgentType;
  status: WorkflowStatus;
  input: any;
  output?: any;
  error?: string;
  startTime: string;
  endTime?: string;
  retryCount: number;
  maxRetries: number;
}

export type AgentType = 
  | 'email-monitoring'
  | 'retailer-api'
  | 'bank-integration'
  | 'duplicate-detection'
  | 'product-intelligence'
  | 'warranty-intelligence'
  | 'warranty-claim'
  | 'cash-extraction'
  | 'browser-extension'
  | 'mobile-app';

export type WorkflowStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export interface WorkflowExecution {
  id: string;
  requestId: string;
  userId: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStep?: string;
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  error?: string;
  metadata: WorkflowMetadata;
}

export interface WorkflowMetadata {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  estimatedCompletion?: string;
  progress: number; // 0-100
}

// ==============================================================================
// AGENT COORDINATION TYPES
// ==============================================================================

export interface AgentTask {
  id: string;
  agentType: AgentType;
  userId: string;
  input: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeout: number;
  retryPolicy: RetryPolicy;
  dependencies?: string[];
  createdAt: string;
  scheduledFor?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface AgentResponse {
  taskId: string;
  agentType: AgentType;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  timestamp: string;
}

export interface AgentHealth {
  agentType: AgentType;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastHeartbeat: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  activeTasks: number;
  queueLength: number;
}

// ==============================================================================
// EVENT PROCESSING TYPES
// ==============================================================================

export interface OrchestrationEvent {
  id: string;
  type: EventType;
  source: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  correlationId?: string;
}

export type EventType = 
  | 'purchase_detected'
  | 'product_created'
  | 'enrichment_completed'
  | 'warranty_found'
  | 'opportunity_identified'
  | 'claim_submitted'
  | 'user_action'
  | 'system_alert'
  | 'agent_health_update'
  | 'workflow_completed';

export interface EventHandler {
  eventType: EventType;
  handler: (event: OrchestrationEvent) => Promise<void>;
  priority: number;
  enabled: boolean;
}

// ==============================================================================
// PERFORMANCE MONITORING TYPES
// ==============================================================================

export interface PerformanceMetrics {
  workflowId: string;
  userId: string;
  totalDuration: number;
  stepDurations: Record<string, number>;
  agentPerformance: Record<AgentType, AgentPerformance>;
  bottlenecks: string[];
  recommendations: string[];
  timestamp: string;
}

export interface AgentPerformance {
  agentType: AgentType;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  database: number;
}

// ==============================================================================
// ERROR HANDLING TYPES
// ==============================================================================

export interface OrchestrationError {
  id: string;
  workflowId?: string;
  stepId?: string;
  agentType?: AgentType;
  errorType: ErrorType;
  message: string;
  stack?: string;
  context: any;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution?: string;
}

export type ErrorType = 
  | 'agent_timeout'
  | 'agent_failure'
  | 'data_validation'
  | 'permission_denied'
  | 'rate_limit'
  | 'network_error'
  | 'database_error'
  | 'configuration_error'
  | 'unknown_error';

// ==============================================================================
// CONFIGURATION TYPES
// ==============================================================================

export interface OrchestratorConfig {
  maxConcurrentWorkflows: number;
  maxRetries: number;
  defaultTimeout: number;
  healthCheckInterval: number;
  eventProcessingBatchSize: number;
  performanceMonitoring: boolean;
  debugMode: boolean;
  agentConfigs: Record<AgentType, AgentConfig>;
}

export interface AgentConfig {
  enabled: boolean;
  timeout: number;
  maxRetries: number;
  priority: number;
  concurrency: number;
  healthCheckEnabled: boolean;
}
