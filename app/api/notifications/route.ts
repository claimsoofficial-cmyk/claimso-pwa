import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getUserNotifications, 
  createNotification,
  updateNotificationStatus 
} from '@/lib/services/notification-service';

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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user notifications
    const notifications = await getUserNotifications(session.user.id, status || undefined, limit);

    return NextResponse.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { template_id, data, scheduled_for } = body;

    if (!template_id) {
      return NextResponse.json({ 
        error: 'Missing required field: template_id' 
      }, { status: 400 });
    }

    // Create notification
    const notification = await createNotification({
      user_id: session.user.id,
      template_id,
      title: 'Notification',
      message: 'Notification message',
      priority: 'medium',
      status: 'pending',
      channels: [
        { type: 'push', enabled: true },
        { type: 'email', enabled: true },
        { type: 'in_app', enabled: true }
      ],
      actions: [],
      data: data || {},
      scheduled_for: scheduled_for || new Date().toISOString()
    });

    if (!notification) {
      return NextResponse.json({ 
        error: 'Failed to create notification' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { notification_id, status } = body;

    if (!notification_id || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: notification_id, status' 
      }, { status: 400 });
    }

    // Update notification status
    const success = await updateNotificationStatus(notification_id, status);

    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to update notification' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully'
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 