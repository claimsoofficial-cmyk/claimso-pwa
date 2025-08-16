import { OrchestrationEvent, EventType, EventHandler } from './orchestration-types';
import { logAgentActivity } from './utils';

export class EventProcessor {
  private readonly agentName = 'EventProcessor';
  private readonly eventHandlers: Map<EventType, EventHandler[]>;

  constructor() {
    this.eventHandlers = new Map();
    this.initializeEventHandlers();
  }

  async processEvent(event: OrchestrationEvent): Promise<void> {
    try {
      logAgentActivity(this.agentName, 'Processing event', {
        eventId: event.id,
        eventType: event.type,
        source: event.source,
        priority: event.priority
      });

      // Get handlers for this event type
      const handlers = this.eventHandlers.get(event.type) || [];
      
      if (handlers.length === 0) {
        logAgentActivity(this.agentName, 'No handlers found for event type', {
          eventType: event.type
        });
        return;
      }

      // Sort handlers by priority (higher priority first)
      const sortedHandlers = handlers
        .filter(handler => handler.enabled)
        .sort((a, b) => b.priority - a.priority);

      // Execute handlers
      for (const handler of sortedHandlers) {
        try {
          await handler.handler(event);
          
          logAgentActivity(this.agentName, 'Event handler executed successfully', {
            eventId: event.id,
            eventType: event.type,
            handlerPriority: handler.priority
          });
        } catch (error) {
          logAgentActivity(this.agentName, 'Event handler failed', {
            eventId: event.id,
            eventType: event.type,
            handlerPriority: handler.priority,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

    } catch (error) {
      logAgentActivity(this.agentName, 'Event processing failed', {
        eventId: event.id,
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private initializeEventHandlers(): void {
    // Purchase detected event handlers
    this.registerEventHandler('purchase_detected', {
      eventType: 'purchase_detected',
      handler: this.handlePurchaseDetected.bind(this),
      priority: 100,
      enabled: true
    });

    // Product created event handlers
    this.registerEventHandler('product_created', {
      eventType: 'product_created',
      handler: this.handleProductCreated.bind(this),
      priority: 90,
      enabled: true
    });

    // Enrichment completed event handlers
    this.registerEventHandler('enrichment_completed', {
      eventType: 'enrichment_completed',
      handler: this.handleEnrichmentCompleted.bind(this),
      priority: 80,
      enabled: true
    });

    // Warranty found event handlers
    this.registerEventHandler('warranty_found', {
      eventType: 'warranty_found',
      handler: this.handleWarrantyFound.bind(this),
      priority: 85,
      enabled: true
    });

    // Opportunity identified event handlers
    this.registerEventHandler('opportunity_identified', {
      eventType: 'opportunity_identified',
      handler: this.handleOpportunityIdentified.bind(this),
      priority: 95,
      enabled: true
    });

    // Claim submitted event handlers
    this.registerEventHandler('claim_submitted', {
      eventType: 'claim_submitted',
      handler: this.handleClaimSubmitted.bind(this),
      priority: 100,
      enabled: true
    });

    // User action event handlers
    this.registerEventHandler('user_action', {
      eventType: 'user_action',
      handler: this.handleUserAction.bind(this),
      priority: 70,
      enabled: true
    });

    // System alert event handlers
    this.registerEventHandler('system_alert', {
      eventType: 'system_alert',
      handler: this.handleSystemAlert.bind(this),
      priority: 110,
      enabled: true
    });

    // Agent health update event handlers
    this.registerEventHandler('agent_health_update', {
      eventType: 'agent_health_update',
      handler: this.handleAgentHealthUpdate.bind(this),
      priority: 60,
      enabled: true
    });

    // Workflow completed event handlers
    this.registerEventHandler('workflow_completed', {
      eventType: 'workflow_completed',
      handler: this.handleWorkflowCompleted.bind(this),
      priority: 75,
      enabled: true
    });
  }

  private registerEventHandler(eventType: EventType, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
  }

  // Event handler implementations
  private async handlePurchaseDetected(event: OrchestrationEvent): Promise<void> {
    const { userId, product } = event.data;
    
    logAgentActivity(this.agentName, 'Handling purchase detected', {
      userId,
      productName: product?.name,
      source: event.source
    });

    // In a real implementation, this would:
    // 1. Trigger product enrichment
    // 2. Send notifications to user
    // 3. Update user dashboard
    // 4. Log analytics
    
    // Simulated processing
    await this.simulateProcessing('purchase_detected', 500);
  }

  private async handleProductCreated(event: OrchestrationEvent): Promise<void> {
    const { userId, product } = event.data;
    
    logAgentActivity(this.agentName, 'Handling product created', {
      userId,
      productId: product?.id,
      productName: product?.name
    });

    // In a real implementation, this would:
    // 1. Queue product for enrichment
    // 2. Trigger warranty research
    // 3. Update product catalog
    // 4. Send welcome notification
    
    // Simulated processing
    await this.simulateProcessing('product_created', 300);
  }

  private async handleEnrichmentCompleted(event: OrchestrationEvent): Promise<void> {
    const { userId, product, enrichedData } = event.data;
    
    logAgentActivity(this.agentName, 'Handling enrichment completed', {
      userId,
      productId: product?.id,
      enrichmentType: enrichedData?.type
    });

    // In a real implementation, this would:
    // 1. Update product with enriched data
    // 2. Trigger value optimization
    // 3. Send enrichment notification
    // 4. Update search index
    
    // Simulated processing
    await this.simulateProcessing('enrichment_completed', 400);
  }

  private async handleWarrantyFound(event: OrchestrationEvent): Promise<void> {
    const { userId, product, warranty } = event.data;
    
    logAgentActivity(this.agentName, 'Handling warranty found', {
      userId,
      productId: product?.id,
      warrantyType: warranty?.type
    });

    // In a real implementation, this would:
    // 1. Store warranty information
    // 2. Calculate warranty value
    // 3. Send warranty notification
    // 4. Schedule warranty reminders
    
    // Simulated processing
    await this.simulateProcessing('warranty_found', 600);
  }

  private async handleOpportunityIdentified(event: OrchestrationEvent): Promise<void> {
    const { userId, product, opportunity } = event.data;
    
    logAgentActivity(this.agentName, 'Handling opportunity identified', {
      userId,
      productId: product?.id,
      opportunityType: opportunity?.type,
      potentialValue: opportunity?.potentialValue
    });

    // In a real implementation, this would:
    // 1. Store opportunity data
    // 2. Send high-priority notification
    // 3. Update opportunity dashboard
    // 4. Trigger follow-up actions
    
    // Simulated processing
    await this.simulateProcessing('opportunity_identified', 800);
  }

  private async handleClaimSubmitted(event: OrchestrationEvent): Promise<void> {
    const { userId, product, claim } = event.data;
    
    logAgentActivity(this.agentName, 'Handling claim submitted', {
      userId,
      productId: product?.id,
      claimId: claim?.id,
      claimStatus: claim?.status
    });

    // In a real implementation, this would:
    // 1. Store claim information
    // 2. Send claim confirmation
    // 3. Track claim status
    // 4. Schedule follow-ups
    
    // Simulated processing
    await this.simulateProcessing('claim_submitted', 1000);
  }

  private async handleUserAction(event: OrchestrationEvent): Promise<void> {
    const { userId, action, context } = event.data;
    
    logAgentActivity(this.agentName, 'Handling user action', {
      userId,
      action,
      context
    });

    // In a real implementation, this would:
    // 1. Log user behavior
    // 2. Update user preferences
    // 3. Trigger personalized responses
    // 4. Update analytics
    
    // Simulated processing
    await this.simulateProcessing('user_action', 200);
  }

  private async handleSystemAlert(event: OrchestrationEvent): Promise<void> {
    const { alert, severity, affectedComponents } = event.data;
    
    logAgentActivity(this.agentName, 'Handling system alert', {
      alert,
      severity,
      affectedComponents
    });

    // In a real implementation, this would:
    // 1. Log system alert
    // 2. Send admin notifications
    // 3. Trigger automated recovery
    // 4. Update system status
    
    // Simulated processing
    await this.simulateProcessing('system_alert', 1500);
  }

  private async handleAgentHealthUpdate(event: OrchestrationEvent): Promise<void> {
    const { agentType, health } = event.data;
    
    logAgentActivity(this.agentName, 'Handling agent health update', {
      agentType,
      status: health?.status,
      responseTime: health?.responseTime
    });

    // In a real implementation, this would:
    // 1. Update agent health status
    // 2. Trigger health checks
    // 3. Send health notifications
    // 4. Update monitoring dashboard
    
    // Simulated processing
    await this.simulateProcessing('agent_health_update', 100);
  }

  private async handleWorkflowCompleted(event: OrchestrationEvent): Promise<void> {
    const { workflowId, userId, status, duration } = event.data;
    
    logAgentActivity(this.agentName, 'Handling workflow completed', {
      workflowId,
      userId,
      status,
      duration
    });

    // In a real implementation, this would:
    // 1. Log workflow completion
    // 2. Send completion notification
    // 3. Update workflow metrics
    // 4. Trigger next steps
    
    // Simulated processing
    await this.simulateProcessing('workflow_completed', 300);
  }

  private async simulateProcessing(eventType: string, delay: number): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, delay));
    
    logAgentActivity(this.agentName, 'Event processing completed', {
      eventType,
      processingTime: delay
    });
  }

  // Public methods for managing event handlers
  public enableEventHandler(eventType: EventType, priority: number): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const handler = handlers.find(h => h.priority === priority);
    if (handler) {
      handler.enabled = true;
    }
  }

  public disableEventHandler(eventType: EventType, priority: number): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    const handler = handlers.find(h => h.priority === priority);
    if (handler) {
      handler.enabled = false;
    }
  }

  public getEventHandlers(eventType: EventType): EventHandler[] {
    return this.eventHandlers.get(eventType) || [];
  }

  public getRegisteredEventTypes(): EventType[] {
    return Array.from(this.eventHandlers.keys());
  }
}
