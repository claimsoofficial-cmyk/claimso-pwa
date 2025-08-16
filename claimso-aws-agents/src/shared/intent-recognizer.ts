import { OrchestrationRequest, UserIntent, IntentType, IntentEntity } from './orchestration-types';
import { logAgentActivity } from './utils';

export class IntentRecognizer {
  private readonly agentName = 'IntentRecognizer';

  async recognizeIntent(request: OrchestrationRequest): Promise<UserIntent> {
    try {
      logAgentActivity(this.agentName, 'Starting intent recognition', {
        userId: request.userId,
        source: request.source
      });

      // Extract text from request
      const text = this.extractTextFromRequest(request);
      
      if (!text) {
        return this.createDefaultIntent(request);
      }

      // Use AI to recognize intent (simulated for now)
      const recognizedIntent = await this.analyzeIntentWithAI(text, request);
      
      logAgentActivity(this.agentName, 'Intent recognized', {
        userId: request.userId,
        intent: recognizedIntent.type,
        confidence: recognizedIntent.confidence,
        entities: recognizedIntent.entities.length
      });

      return recognizedIntent;

    } catch (error) {
      logAgentActivity(this.agentName, 'Intent recognition failed', {
        userId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to default intent
      return this.createDefaultIntent(request);
    }
  }

  private extractTextFromRequest(request: OrchestrationRequest): string {
    // Extract text from various request sources
    const body = request as any;
    
    if (body.query) return body.query;
    if (body.text) return body.text;
    if (body.message) return body.message;
    if (body.description) return body.description;
    if (body.action) return body.action;
    
    // Check context for clues
    if (request.context.previousActions && request.context.previousActions.length > 0) {
      return request.context.previousActions[request.context.previousActions.length - 1];
    }
    
    return '';
  }

  private async analyzeIntentWithAI(text: string, request: OrchestrationRequest): Promise<UserIntent> {
    // Simulated AI intent recognition
    // In production, this would use OpenAI API or similar
    
    const lowerText = text.toLowerCase();
    
    // Pattern matching for intent recognition
    if (this.matchesPurchaseDetection(lowerText)) {
      return this.createPurchaseDetectionIntent(text, request);
    }
    
    if (this.matchesProductEnrichment(lowerText)) {
      return this.createProductEnrichmentIntent(text, request);
    }
    
    if (this.matchesWarrantyResearch(lowerText)) {
      return this.createWarrantyResearchIntent(text, request);
    }
    
    if (this.matchesValueOptimization(lowerText)) {
      return this.createValueOptimizationIntent(text, request);
    }
    
    if (this.matchesClaimProcessing(lowerText)) {
      return this.createClaimProcessingIntent(text, request);
    }
    
    if (this.matchesCashExtraction(lowerText)) {
      return this.createCashExtractionIntent(text, request);
    }
    
    if (this.matchesMaintenanceScheduling(lowerText)) {
      return this.createMaintenanceSchedulingIntent(text, request);
    }
    
    if (this.matchesUserQuery(lowerText)) {
      return this.createUserQueryIntent(text, request);
    }
    
    // Default to data sync if no specific intent is recognized
    return this.createDataSyncIntent(text, request);
  }

  // Intent pattern matching methods
  private matchesPurchaseDetection(text: string): boolean {
    const patterns = [
      'purchase', 'bought', 'ordered', 'bought', 'acquired', 'received',
      'new product', 'just bought', 'recent purchase', 'order confirmation',
      'receipt', 'invoice', 'order number'
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  private matchesProductEnrichment(text: string): boolean {
    const patterns = [
      'enrich', 'details', 'specifications', 'more info', 'product info',
      'specs', 'features', 'description', 'research product'
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  private matchesWarrantyResearch(text: string): boolean {
    const patterns = [
      'warranty', 'coverage', 'protection', 'extended warranty',
      'warranty info', 'coverage period', 'warranty status'
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  private matchesValueOptimization(text: string): boolean {
    const patterns = [
      'value', 'worth', 'price', 'market value', 'current value',
      'depreciation', 'resale', 'trade-in', 'optimize value'
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  private matchesClaimProcessing(text: string): boolean {
    const patterns = [
      'claim', 'warranty claim', 'file claim', 'submit claim',
      'broken', 'defective', 'not working', 'issue', 'problem'
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  private matchesCashExtraction(text: string): boolean {
    const patterns = [
      'sell', 'cash', 'money', 'extract value', 'trade in',
      'resell', 'marketplace', 'auction', 'best price'
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  private matchesMaintenanceScheduling(text: string): boolean {
    const patterns = [
      'maintenance', 'service', 'repair', 'schedule', 'appointment',
      'checkup', 'inspection', 'upkeep', 'care'
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  private matchesUserQuery(text: string): boolean {
    const patterns = [
      'what', 'how', 'when', 'where', 'why', 'question',
      'help', 'info', 'information', 'tell me', 'show me'
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  // Intent creation methods
  private createPurchaseDetectionIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'purchase_detection',
      action: 'detect_purchase',
      parameters: {
        text,
        source: request.source,
        entities
      },
      confidence: 0.85,
      entities
    };
  }

  private createProductEnrichmentIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'product_enrichment',
      action: 'enrich_product',
      parameters: {
        text,
        entities
      },
      confidence: 0.80,
      entities
    };
  }

  private createWarrantyResearchIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'warranty_research',
      action: 'research_warranty',
      parameters: {
        text,
        entities
      },
      confidence: 0.90,
      entities
    };
  }

  private createValueOptimizationIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'value_optimization',
      action: 'optimize_value',
      parameters: {
        text,
        entities
      },
      confidence: 0.75,
      entities
    };
  }

  private createClaimProcessingIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'claim_processing',
      action: 'process_claim',
      parameters: {
        text,
        entities
      },
      confidence: 0.85,
      entities
    };
  }

  private createCashExtractionIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'cash_extraction',
      action: 'extract_cash',
      parameters: {
        text,
        entities
      },
      confidence: 0.80,
      entities
    };
  }

  private createMaintenanceSchedulingIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'maintenance_scheduling',
      action: 'schedule_maintenance',
      parameters: {
        text,
        entities
      },
      confidence: 0.85,
      entities
    };
  }

  private createUserQueryIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'user_query',
      action: 'answer_query',
      parameters: {
        text,
        entities
      },
      confidence: 0.70,
      entities
    };
  }

  private createDataSyncIntent(text: string, request: OrchestrationRequest): UserIntent {
    const entities = this.extractEntities(text);
    
    return {
      type: 'data_sync',
      action: 'sync_data',
      parameters: {
        text,
        entities
      },
      confidence: 0.60,
      entities
    };
  }

  private createDefaultIntent(request: OrchestrationRequest): UserIntent {
    return {
      type: 'data_sync',
      action: 'sync_data',
      parameters: {
        source: request.source,
        userId: request.userId
      },
      confidence: 0.50,
      entities: []
    };
  }

  private extractEntities(text: string): IntentEntity[] {
    const entities: IntentEntity[] = [];
    
    // Simple entity extraction (in production, use NLP/AI)
    const words = text.split(' ');
    
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Product detection
      if (this.isProduct(cleanWord)) {
        entities.push({
          type: 'product',
          value: word,
          confidence: 0.8,
          start: text.indexOf(word),
          end: text.indexOf(word) + word.length
        });
      }
      
      // Retailer detection
      if (this.isRetailer(cleanWord)) {
        entities.push({
          type: 'retailer',
          value: word,
          confidence: 0.9,
          start: text.indexOf(word),
          end: text.indexOf(word) + word.length
        });
      }
      
      // Brand detection
      if (this.isBrand(cleanWord)) {
        entities.push({
          type: 'brand',
          value: word,
          confidence: 0.85,
          start: text.indexOf(word),
          end: text.indexOf(word) + word.length
        });
      }
      
      // Price detection
      if (this.isPrice(word)) {
        entities.push({
          type: 'price',
          value: word,
          confidence: 0.95,
          start: text.indexOf(word),
          end: text.indexOf(word) + word.length
        });
      }
    });
    
    return entities;
  }

  private isProduct(word: string): boolean {
    const products = ['phone', 'laptop', 'computer', 'tablet', 'watch', 'headphones', 'camera', 'tv'];
    return products.includes(word);
  }

  private isRetailer(word: string): boolean {
    const retailers = ['amazon', 'apple', 'bestbuy', 'target', 'walmart', 'ebay'];
    return retailers.includes(word);
  }

  private isBrand(word: string): boolean {
    const brands = ['iphone', 'samsung', 'apple', 'sony', 'lg', 'dell', 'hp', 'lenovo'];
    return brands.includes(word);
  }

  private isPrice(word: string): boolean {
    return /\$\d+/.test(word) || /\d+\.\d{2}/.test(word);
  }
}
