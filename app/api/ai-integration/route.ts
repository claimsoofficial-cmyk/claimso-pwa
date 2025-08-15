import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIAgentService } from '@/lib/services/ai-agent-service';

// ==============================================================================
// AI-POWERED INTEGRATION API - REPLACING SCRAPING WITH INTELLIGENT AGENTS
// ==============================================================================

interface AIIntegrationRequest {
  userInput: string;
  integrationType?: 'natural_language' | 'email_forward' | 'receipt_scan' | 'voice_input';
  metadata?: {
    emailContent?: string;
    imageData?: string;
    voiceTranscript?: string;
  };
}

interface AIIntegrationResponse {
  success: boolean;
  message: string;
  product?: any;
  enrichedData?: any;
  confidence: number;
  sources: string[];
  processingTime: number;
  recommendations?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Authentication
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
            return NextResponse.json(
        { 
          success: false,
          message: 'Authentication required',
          error: 'Please log in to use AI integration',
          confidence: 0,
          sources: [],
          processingTime: 0
        } as AIIntegrationResponse,
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Step 2: Parse request
    let body: AIIntegrationRequest;
    try {
      body = await request.json();
    } catch {
            return NextResponse.json(
        { 
          success: false,
          message: 'Invalid request format',
          error: 'Request body must be valid JSON',
          confidence: 0,
          sources: [],
          processingTime: 0
        } as AIIntegrationResponse,
        { status: 400 }
      );
    }

    // Step 3: Validate request
    if (!body.userInput || typeof body.userInput !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User input is required',
          error: 'Please provide a description of your purchase or product',
          confidence: 0,
          sources: [],
          processingTime: 0
        } as AIIntegrationResponse,
        { status: 400 }
      );
    }

    // Step 4: Initialize AI Agent Service
    const aiService = new AIAgentService();
    
    console.log(`Processing AI integration request for user ${userId}: "${body.userInput}"`);

    // Step 5: Process with AI Agents
    let enrichedData;
    let product;

    try {
      // Get enriched data from AI agents
      enrichedData = await aiService.processUserRequest(body.userInput, userId);
      
      // Create product in database
      product = await aiService.createProductFromRequest(body.userInput, userId);
      
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'AI processing failed',
          error: aiError instanceof Error ? aiError.message : 'Unknown AI error',
          confidence: 0,
          sources: [],
          processingTime: Date.now() - startTime
        } as AIIntegrationResponse,
        { status: 500 }
      );
    }

    // Step 6: Generate recommendations
    const recommendations = generateRecommendations(enrichedData, product);

    // Step 7: Calculate processing time
    const processingTime = Date.now() - startTime;

    console.log(`AI integration completed successfully in ${processingTime}ms for user ${userId}`);

    // Step 8: Return success response
    return NextResponse.json({
      success: true,
      message: 'Product successfully added with AI enrichment',
      product,
      enrichedData,
      confidence: enrichedData.confidence_score,
      sources: enrichedData.sources,
      processingTime,
      recommendations
    } as AIIntegrationResponse);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('AI integration error:', error);

    return NextResponse.json(
      { 
        success: false, 
        message: 'Integration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        sources: [],
        processingTime
      } as AIIntegrationResponse,
      { status: 500 }
    );
  }
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function generateRecommendations(enrichedData: any, product: any): string[] {
  const recommendations: string[] = [];

  // Based on confidence score
  if (enrichedData.confidence_score < 0.7) {
    recommendations.push('Consider adding more details to improve accuracy');
  }

  // Based on warranty information
  if (enrichedData.warranty_info?.manufacturer?.duration < 12) {
    recommendations.push('Consider purchasing extended warranty coverage');
  }

  // Based on product value
  if (enrichedData.market_value > 500) {
    recommendations.push('High-value item detected - consider adding to insurance');
  }

  // Based on common issues
  if (enrichedData.common_issues?.length > 0) {
    recommendations.push('Check for known issues and preventive measures');
  }

  // Based on product category
  if (enrichedData.category === 'Electronics') {
    recommendations.push('Register your product with the manufacturer for better support');
  }

  return recommendations;
}

// ==============================================================================
// GET HANDLER FOR DEMO PURPOSES
// ==============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    message: 'AI Integration API',
    description: 'Replace scraping with intelligent AI agents',
    endpoints: {
      POST: '/api/ai-integration',
      description: 'Process natural language product descriptions'
    },
    examples: [
      {
        input: 'I bought an iPhone 15 Pro from Amazon last week',
        expected_output: 'Complete product profile with specs, warranty, value'
      },
      {
        input: 'Just purchased a MacBook Pro M3 from Apple Store',
        expected_output: 'Full product details with AppleCare coverage'
      },
      {
        input: 'Got a Samsung Galaxy S24 from Best Buy yesterday',
        expected_output: 'Comprehensive product information and warranty details'
      }
    ],
    features: [
      'Natural language processing',
      'Multi-source data gathering',
      'Automatic product enrichment',
      'Warranty intelligence',
      'Value assessment',
      'Conflict resolution'
    ]
  });
}
