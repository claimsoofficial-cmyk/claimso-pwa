import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  OrchestrationRequest, 
  UserIntent, 
  IntentType, 
  WorkflowExecution, 
  WorkflowStep, 
  AgentType,
  AgentTask,
  OrchestrationEvent,
  EventType,
  DeviceInfo
} from '../shared/orchestration-types';
import { logAgentActivity } from '../shared/utils';
import { IntentRecognizer } from '../shared/intent-recognizer';
import { WorkflowEngine } from '../shared/workflow-engine';
import { AgentCoordinator } from '../shared/agent-coordinator';
import { EventProcessor } from '../shared/event-processor';

const agentName = 'MasterOrchestrator';

// Initialize core components
const intentRecognizer = new IntentRecognizer();
const workflowEngine = new WorkflowEngine();
const agentCoordinator = new AgentCoordinator();
const eventProcessor = new EventProcessor();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    logAgentActivity(agentName, 'Starting orchestration request', { 
      timestamp: new Date().toISOString(),
      requestId: event.requestContext.requestId 
    });

    // Step 1: Parse and validate request
    const request = parseRequest(event);
    logAgentActivity(agentName, 'Request parsed', { 
      userId: request.userId, 
      intentType: request.intent.type 
    });

    // Step 2: Recognize user intent (if not provided)
    if (!request.intent || request.intent.confidence < 0.7) {
      request.intent = await intentRecognizer.recognizeIntent(request);
      logAgentActivity(agentName, 'Intent recognized', { 
        intent: request.intent.type, 
        confidence: request.intent.confidence 
      });
    }

    // Step 3: Create workflow execution
    const workflowExecution = await workflowEngine.createWorkflow(request);
    logAgentActivity(agentName, 'Workflow created', { 
      workflowId: workflowExecution.id,
      totalSteps: workflowExecution.metadata.totalSteps 
    });

    // Step 4: Execute workflow
    const result = await executeWorkflow(workflowExecution);
    
    const executionTime = Date.now() - startTime;
    
    logAgentActivity(agentName, 'Orchestration completed', {
      workflowId: workflowExecution.id,
      executionTime,
      status: result.status,
      stepsCompleted: result.metadata.completedSteps
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Orchestration completed successfully',
        data: {
          workflowId: workflowExecution.id,
          status: result.status,
          executionTime,
          result: result.status,
          metadata: result.metadata
        }
      })
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logAgentActivity(agentName, 'Orchestration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Orchestration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      })
    };
  }
};

// ==============================================================================
// REQUEST PARSING
// ==============================================================================

function parseRequest(event: APIGatewayProxyEvent): OrchestrationRequest {
  const body = event.body ? JSON.parse(event.body) : {};
  
  return {
    id: event.requestContext.requestId,
    userId: body.userId || extractUserIdFromHeaders(event),
    intent: body.intent || null,
    context: {
      userAgent: event.headers['User-Agent'],
      ipAddress: event.requestContext.identity?.sourceIp,
      sessionId: event.headers['X-Session-Id'],
      previousActions: body.previousActions || [],
      userPreferences: body.userPreferences,
      deviceInfo: extractDeviceInfo(event)
    },
    priority: body.priority || 'medium',
    timestamp: new Date().toISOString(),
    source: determineRequestSource(event)
  };
}

function extractUserIdFromHeaders(event: APIGatewayProxyEvent): string {
  // Extract user ID from various possible header sources
  return event.headers['X-User-Id'] || 
         event.headers['Authorization']?.replace('Bearer ', '') ||
         event.requestContext.authorizer?.userId ||
         'anonymous';
}

function extractDeviceInfo(event: APIGatewayProxyEvent): DeviceInfo {
  const userAgent = event.headers['User-Agent'] || '';
  
  return {
    type: userAgent.includes('Mobile') ? 'mobile' : 
          userAgent.includes('Tablet') ? 'tablet' : 'desktop',
    platform: userAgent.includes('iPhone') ? 'iOS' :
              userAgent.includes('Android') ? 'Android' :
              userAgent.includes('Windows') ? 'Windows' :
              userAgent.includes('Mac') ? 'macOS' : 'Unknown',
    browser: userAgent.includes('Chrome') ? 'Chrome' :
             userAgent.includes('Firefox') ? 'Firefox' :
             userAgent.includes('Safari') ? 'Safari' : 'Unknown'
  };
}

function determineRequestSource(event: APIGatewayProxyEvent): 'pwa' | 'api' | 'webhook' | 'scheduled' {
  const path = event.path;
  const headers = event.headers;
  
  if (path.includes('/webhook')) return 'webhook';
  if (path.includes('/api')) return 'api';
  if (headers['X-Source'] === 'scheduled') return 'scheduled';
  return 'pwa';
}

// ==============================================================================
// WORKFLOW EXECUTION
// ==============================================================================

async function executeWorkflow(workflow: WorkflowExecution): Promise<WorkflowExecution> {
  logAgentActivity(agentName, 'Starting workflow execution', { 
    workflowId: workflow.id,
    steps: workflow.steps.length 
  });

  // Step 1: Initialize workflow
  workflow.status = 'running';
  workflow.startTime = new Date().toISOString();

  // Step 2: Execute steps in order
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    workflow.currentStep = step.id;
    
    try {
      logAgentActivity(agentName, 'Executing workflow step', { 
        workflowId: workflow.id,
        stepId: step.id,
        agentType: step.agentType 
      });

      // Execute the step
      const result = await executeWorkflowStep(step);
      
      // Update step status
      step.status = 'completed';
      step.output = result;
      step.endTime = new Date().toISOString();
      
      // Update workflow metadata
      workflow.metadata.completedSteps++;
      workflow.metadata.progress = Math.round((workflow.metadata.completedSteps / workflow.metadata.totalSteps) * 100);

      // Process step completion event
      await eventProcessor.processEvent({
        id: `step-completed-${step.id}`,
        type: 'workflow_completed',
        source: agentName,
        data: { step, result },
        timestamp: new Date().toISOString(),
        priority: 'medium',
        correlationId: workflow.id
      });

    } catch (error) {
      logAgentActivity(agentName, 'Workflow step failed', { 
        workflowId: workflow.id,
        stepId: step.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Handle step failure
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.endTime = new Date().toISOString();
      
      workflow.metadata.failedSteps++;
      
      // Check if we should retry
      if (step.retryCount < step.maxRetries) {
        step.retryCount++;
        step.status = 'retrying';
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, step.retryCount), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the step
        i--; // Retry the same step
        continue;
      } else {
        // Max retries exceeded, fail the workflow
        workflow.status = 'failed';
        workflow.error = `Step ${step.id} failed after ${step.maxRetries} retries`;
        workflow.endTime = new Date().toISOString();
        return workflow;
      }
    }
  }

  // Step 3: Complete workflow
  workflow.status = 'completed';
  workflow.endTime = new Date().toISOString();
  workflow.totalDuration = new Date(workflow.endTime).getTime() - new Date(workflow.startTime).getTime();

  logAgentActivity(agentName, 'Workflow execution completed', { 
    workflowId: workflow.id,
    status: workflow.status,
    duration: workflow.totalDuration 
  });

  return workflow;
}

async function executeWorkflowStep(step: WorkflowStep): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Create agent task
    const task: AgentTask = {
      id: step.id,
      agentType: step.agentType,
      userId: step.input.userId,
      input: step.input,
      priority: 'medium',
      timeout: 30000, // 30 seconds
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
        maxDelay: 30000
      },
      createdAt: new Date().toISOString()
    };

    // Execute task through agent coordinator
    const response = await agentCoordinator.executeTask(task);
    
    const executionTime = Date.now() - startTime;
    
    logAgentActivity(agentName, 'Agent task completed', { 
      taskId: task.id,
      agentType: task.agentType,
      executionTime,
      success: response.success 
    });

    if (!response.success) {
      throw new Error(response.error || 'Agent task failed');
    }

    return response.data;

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logAgentActivity(agentName, 'Agent task failed', { 
      taskId: step.id,
      agentType: step.agentType,
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

// ==============================================================================
// HEALTH CHECK ENDPOINT
// ==============================================================================

export const healthCheck = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const health = await agentCoordinator.getSystemHealth();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        data: health
      })
    };
  } catch (error) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
