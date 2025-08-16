import { 
  OrchestrationRequest, 
  WorkflowExecution, 
  WorkflowStep, 
  AgentType, 
  IntentType 
} from './orchestration-types';
import { logAgentActivity } from './utils';

export class WorkflowEngine {
  private readonly agentName = 'WorkflowEngine';

  async createWorkflow(request: OrchestrationRequest): Promise<WorkflowExecution> {
    try {
      logAgentActivity(this.agentName, 'Creating workflow', {
        userId: request.userId,
        intentType: request.intent.type
      });

      // Generate workflow ID
      const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create workflow steps based on intent
      const steps = await this.createWorkflowSteps(request);
      
      // Create workflow execution
      const workflow: WorkflowExecution = {
        id: workflowId,
        requestId: request.id,
        userId: request.userId,
        status: 'pending',
        steps,
        startTime: new Date().toISOString(),
        metadata: {
          totalSteps: steps.length,
          completedSteps: 0,
          failedSteps: 0,
          progress: 0
        }
      };

      logAgentActivity(this.agentName, 'Workflow created', {
        workflowId,
        totalSteps: steps.length,
        intentType: request.intent.type
      });

      return workflow;

    } catch (error) {
      logAgentActivity(this.agentName, 'Workflow creation failed', {
        userId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async createWorkflowSteps(request: OrchestrationRequest): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = [];
    const intent = request.intent;
    
    switch (intent.type) {
      case 'purchase_detection':
        return this.createPurchaseDetectionWorkflow(request);
      
      case 'product_enrichment':
        return this.createProductEnrichmentWorkflow(request);
      
      case 'warranty_research':
        return this.createWarrantyResearchWorkflow(request);
      
      case 'value_optimization':
        return this.createValueOptimizationWorkflow(request);
      
      case 'claim_processing':
        return this.createClaimProcessingWorkflow(request);
      
      case 'cash_extraction':
        return this.createCashExtractionWorkflow(request);
      
      case 'maintenance_scheduling':
        return this.createMaintenanceSchedulingWorkflow(request);
      
      case 'user_query':
        return this.createUserQueryWorkflow(request);
      
      case 'data_sync':
        return this.createDataSyncWorkflow(request);
      
      default:
        return this.createDefaultWorkflow(request);
    }
  }

  private createPurchaseDetectionWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Detect purchase from multiple sources
    steps.push({
      id: stepId(1),
      name: 'Purchase Detection',
      agentType: 'email-monitoring',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters,
        context: request.context
      },
      retryCount: 0,
      maxRetries: 3
    });

    // Step 2: Check for duplicates
    steps.push({
      id: stepId(2),
      name: 'Duplicate Detection',
      agentType: 'duplicate-detection',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(1)
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 3: Enrich product data
    steps.push({
      id: stepId(3),
      name: 'Product Intelligence',
      agentType: 'product-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(2)
      },
      retryCount: 0,
      maxRetries: 3
    });

    // Step 4: Research warranty
    steps.push({
      id: stepId(4),
      name: 'Warranty Intelligence',
      agentType: 'warranty-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(3)
      },
      retryCount: 0,
      maxRetries: 2
    });

    return steps;
  }

  private createProductEnrichmentWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Get existing products
    steps.push({
      id: stepId(1),
      name: 'Get Products',
      agentType: 'product-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 2: Enrich product data
    steps.push({
      id: stepId(2),
      name: 'Enrich Products',
      agentType: 'product-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(1)
      },
      retryCount: 0,
      maxRetries: 3
    });

    return steps;
  }

  private createWarrantyResearchWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Get products for warranty research
    steps.push({
      id: stepId(1),
      name: 'Get Products',
      agentType: 'warranty-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 2: Research warranties
    steps.push({
      id: stepId(2),
      name: 'Research Warranties',
      agentType: 'warranty-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(1)
      },
      retryCount: 0,
      maxRetries: 3
    });

    return steps;
  }

  private createValueOptimizationWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Get products for value optimization
    steps.push({
      id: stepId(1),
      name: 'Get Products',
      agentType: 'cash-extraction',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 2: Find value opportunities
    steps.push({
      id: stepId(2),
      name: 'Find Value Opportunities',
      agentType: 'cash-extraction',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(1)
      },
      retryCount: 0,
      maxRetries: 3
    });

    return steps;
  }

  private createClaimProcessingWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Get products eligible for claims
    steps.push({
      id: stepId(1),
      name: 'Get Claimable Products',
      agentType: 'warranty-claim',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 2: Process claims
    steps.push({
      id: stepId(2),
      name: 'Process Claims',
      agentType: 'warranty-claim',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(1)
      },
      retryCount: 0,
      maxRetries: 3
    });

    return steps;
  }

  private createCashExtractionWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Get products for cash extraction
    steps.push({
      id: stepId(1),
      name: 'Get Products',
      agentType: 'cash-extraction',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 2: Find cash opportunities
    steps.push({
      id: stepId(2),
      name: 'Find Cash Opportunities',
      agentType: 'cash-extraction',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(1)
      },
      retryCount: 0,
      maxRetries: 3
    });

    return steps;
  }

  private createMaintenanceSchedulingWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Get products needing maintenance
    steps.push({
      id: stepId(1),
      name: 'Get Products for Maintenance',
      agentType: 'product-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 2: Schedule maintenance
    steps.push({
      id: stepId(2),
      name: 'Schedule Maintenance',
      agentType: 'product-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        dependsOn: stepId(1)
      },
      retryCount: 0,
      maxRetries: 3
    });

    return steps;
  }

  private createUserQueryWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Process user query
    steps.push({
      id: stepId(1),
      name: 'Process Query',
      agentType: 'product-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters,
        query: request.intent.parameters.text
      },
      retryCount: 0,
      maxRetries: 2
    });

    return steps;
  }

  private createDataSyncWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Step 1: Sync email data
    steps.push({
      id: stepId(1),
      name: 'Email Sync',
      agentType: 'email-monitoring',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 2: Sync retailer data
    steps.push({
      id: stepId(2),
      name: 'Retailer Sync',
      agentType: 'retailer-api',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    // Step 3: Sync bank data
    steps.push({
      id: stepId(3),
      name: 'Bank Sync',
      agentType: 'bank-integration',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 2
    });

    return steps;
  }

  private createDefaultWorkflow(request: OrchestrationRequest): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const stepId = (index: number) => `step-${index}-${Date.now()}`;
    
    // Default single step workflow
    steps.push({
      id: stepId(1),
      name: 'Default Processing',
      agentType: 'product-intelligence',
      status: 'pending',
      startTime: new Date().toISOString(),
      input: {
        userId: request.userId,
        parameters: request.intent.parameters
      },
      retryCount: 0,
      maxRetries: 1
    });

    return steps;
  }
}
