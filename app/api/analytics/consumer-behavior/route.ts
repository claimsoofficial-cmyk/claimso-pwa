import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateConsumerBehaviorData } from '@/lib/services/analytics-service';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || session.user.id;
    const segment = searchParams.get('segment') || 'individual';

    // Generate consumer behavior data
    const data = await generateConsumerBehaviorData(userId);

    // Add metadata
    const response = {
      success: true,
      data,
      metadata: {
        data_points: 150, // Estimated data points used
        confidence_score: 0.85,
        last_updated: new Date().toISOString(),
        source: 'claimso_analytics_engine',
        user_id: userId,
        segment
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in consumer behavior API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 