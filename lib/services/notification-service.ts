import { createClient } from '@/lib/supabase/server';
import { 
  NotificationTemplate, 
  UserNotification, 
  NotificationPreferences,
  NotificationTrigger 
} from '@/lib/types/notifications';

// ==============================================================================
// SMART NOTIFICATIONS SERVICE
// ==============================================================================

// Notification templates
const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'warranty_expiry_30_days',
    type: 'warranty_expiry',
    title: 'Warranty Expiring Soon',
    message: 'Your {product_name} warranty expires in {days_left} days. Consider extending your protection.',
    priority: 'high',
    channels: [
      { type: 'push', enabled: true },
      { type: 'email', enabled: true },
      { type: 'in_app', enabled: true }
    ],
    actions: [
      {
        type: 'button',
        label: 'Extend Warranty',
        action: 'extend_warranty',
        data: { product_id: '{product_id}' }
      },
      {
        type: 'button',
        label: 'View Details',
        action: 'view_product',
        data: { product_id: '{product_id}' }
      }
    ],
    conditions: [
      {
        field: 'warranty_days_left',
        operator: 'less_than',
        value: 30,
        logic: 'and'
      }
    ]
  },
  {
    id: 'price_drop_alert',
    type: 'price_drop',
    title: 'Price Drop Alert',
    message: 'The price of {product_name} has dropped by {price_drop_percent}%. Great time to upgrade!',
    priority: 'medium',
    channels: [
      { type: 'push', enabled: true },
      { type: 'email', enabled: true },
      { type: 'in_app', enabled: true }
    ],
    actions: [
      {
        type: 'link',
        label: 'View Deal',
        url: '{product_url}'
      },
      {
        type: 'button',
        label: 'Trade In',
        action: 'trade_in',
        data: { product_id: '{product_id}' }
      }
    ],
    conditions: [
      {
        field: 'price_drop_percent',
        operator: 'greater_than',
        value: 10,
        logic: 'and'
      }
    ]
  },
  {
    id: 'upgrade_opportunity',
    type: 'upgrade_opportunity',
    title: 'Upgrade Opportunity',
    message: 'A new {product_category} model is available. Trade in your current device for great value.',
    priority: 'medium',
    channels: [
      { type: 'push', enabled: true },
      { type: 'email', enabled: true },
      { type: 'in_app', enabled: true }
    ],
    actions: [
      {
        type: 'button',
        label: 'Get Trade-In Value',
        action: 'get_trade_in_quote',
        data: { product_id: '{product_id}' }
      },
      {
        type: 'link',
        label: 'View New Model',
        url: '{new_product_url}'
      }
    ],
    conditions: [
      {
        field: 'product_age_months',
        operator: 'greater_than',
        value: 18,
        logic: 'and'
      }
    ]
  },
  {
    id: 'repair_quote_available',
    type: 'repair_quote',
    title: 'Repair Quote Available',
    message: 'We found a repair quote for your {product_name} issue. Get it fixed quickly and affordably.',
    priority: 'high',
    channels: [
      { type: 'push', enabled: true },
      { type: 'email', enabled: true },
      { type: 'in_app', enabled: true }
    ],
    actions: [
      {
        type: 'button',
        label: 'View Quote',
        action: 'view_repair_quote',
        data: { quote_id: '{quote_id}' }
      },
      {
        type: 'button',
        label: 'Schedule Repair',
        action: 'schedule_repair',
        data: { quote_id: '{quote_id}' }
      }
    ],
    conditions: [
      {
        field: 'repair_quote_available',
        operator: 'equals',
        value: true,
        logic: 'and'
      }
    ]
  },
  {
    id: 'warranty_claim_reminder',
    type: 'warranty_claim',
    title: 'Warranty Claim Reminder',
    message: 'Don\'t forget to file your warranty claim for {product_name}. Time is running out!',
    priority: 'urgent',
    channels: [
      { type: 'push', enabled: true },
      { type: 'email', enabled: true },
      { type: 'sms', enabled: true },
      { type: 'in_app', enabled: true }
    ],
    actions: [
      {
        type: 'button',
        label: 'File Claim',
        action: 'file_warranty_claim',
        data: { product_id: '{product_id}' }
      },
      {
        type: 'button',
        label: 'Get Help',
        action: 'contact_support',
        data: { issue: 'warranty_claim' }
      }
    ],
    conditions: [
      {
        field: 'warranty_days_left',
        operator: 'less_than',
        value: 7,
        logic: 'and'
      }
    ]
  }
];

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  templateId: string,
  data: Record<string, any>,
  scheduledFor?: string
): Promise<UserNotification | null> {
  const supabase = await createClient();
  
  try {
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Notification template not found: ${templateId}`);
    }

    // Personalize message with data
    let title = template.title;
    let message = template.message;
    
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Personalize actions with data
    const actions = template.actions.map(action => ({
      ...action,
      url: action.url ? personalizeUrl(action.url, data) : action.url,
      data: action.data ? personalizeData(action.data, data) : action.data
    }));

    const notification: Omit<UserNotification, 'id' | 'created_at'> = {
      user_id: userId,
      template_id: templateId,
      title,
      message,
      priority: template.priority,
      status: 'pending',
      channels: template.channels,
      actions,
      data,
      scheduled_for: scheduledFor || new Date().toISOString()
    };

    // In production, save to Supabase
    // const { data: savedNotification, error } = await supabase
    //   .from('user_notifications')
    //   .insert(notification)
    //   .select()
    //   .single();

    // For now, return mock data
    const mockNotification: UserNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    console.log('Notification created:', mockNotification.id);
    return mockNotification;

  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
  status?: string,
  limit: number = 50
): Promise<UserNotification[]> {
  const supabase = await createClient();
  
  try {
    // In production, query from Supabase
    // let query = supabase
    //   .from('user_notifications')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false })
    //   .limit(limit);

    // if (status) {
    //   query = query.eq('status', status);
    // }

    // const { data: notifications, error } = await query;

    // For now, return mock data
    const mockNotifications: UserNotification[] = [
      {
        id: 'notification-1',
        user_id: userId,
        template_id: 'warranty_expiry_30_days',
        title: 'Warranty Expiring Soon',
        message: 'Your iPhone 14 Pro warranty expires in 25 days. Consider extending your protection.',
        priority: 'high',
        status: 'pending',
        channels: [
          { type: 'push', enabled: true },
          { type: 'email', enabled: true },
          { type: 'in_app', enabled: true }
        ],
        actions: [
          {
            type: 'button',
            label: 'Extend Warranty',
            action: 'extend_warranty',
            data: { product_id: 'product-123' }
          }
        ],
        data: { product_name: 'iPhone 14 Pro', days_left: 25, product_id: 'product-123' },
        scheduled_for: new Date().toISOString(),
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return mockNotifications;

  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

/**
 * Update notification status
 */
export async function updateNotificationStatus(
  notificationId: string,
  status: UserNotification['status']
): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    // In production, update in Supabase
    // const { error } = await supabase
    //   .from('user_notifications')
    //   .update({ 
    //     status,
    //     read_at: status === 'read' ? new Date().toISOString() : null,
    //     sent_at: status === 'sent' ? new Date().toISOString() : null
    //   })
    //   .eq('id', notificationId);

    console.log(`Notification ${notificationId} status updated to: ${status}`);
    return true;

  } catch (error) {
    console.error('Error updating notification status:', error);
    return false;
  }
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  
  try {
    // In production, query from Supabase
    // const { data: preferences, error } = await supabase
    //   .from('notification_preferences')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .single();

    // For now, return default preferences
    const defaultPreferences: NotificationPreferences = {
      user_id: userId,
      channels: {
        push: true,
        email: true,
        sms: false,
        in_app: true
      },
      types: {
        warranty_expiry: true,
        price_drop: true,
        upgrade_opportunity: true,
        repair_quote: true,
        warranty_claim: true,
        product_recall: true
      },
      frequency: 'immediate',
      quiet_hours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return defaultPreferences;

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    // In production, update in Supabase
    // const { error } = await supabase
    //   .from('notification_preferences')
    //   .upsert({
    //     user_id: userId,
    //     ...preferences,
    //     updated_at: new Date().toISOString()
    //   });

    console.log('Notification preferences updated for user:', userId);
    return true;

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

/**
 * Check and trigger notifications based on conditions
 */
export async function checkAndTriggerNotifications(userId: string): Promise<void> {
  const supabase = await createClient();
  
  try {
    // Get user's products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);

    if (!products) return;

    // Get user preferences
    const preferences = await getUserNotificationPreferences(userId);
    if (!preferences) return;

    // Check each product for notification triggers
    for (const product of products) {
      await checkProductNotifications(product, preferences);
    }

  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

/**
 * Check notifications for a specific product
 */
async function checkProductNotifications(product: any, preferences: NotificationPreferences): Promise<void> {
  // Check warranty expiry
  if (preferences.types.warranty_expiry && product.warranties) {
    for (const warranty of product.warranties) {
      const daysLeft = getWarrantyDaysLeft(warranty);
      
      if (daysLeft <= 30 && daysLeft > 0) {
        await createNotification(
          product.user_id,
          'warranty_expiry_30_days',
          {
            product_name: product.product_name,
            days_left: daysLeft,
            product_id: product.id
          }
        );
      }
    }
  }

  // Check for upgrade opportunities (products older than 18 months)
  if (preferences.types.upgrade_opportunity) {
    const productAge = getProductAgeInMonths(product.purchase_date);
    
    if (productAge >= 18) {
      await createNotification(
        product.user_id,
        'upgrade_opportunity',
        {
          product_category: product.category,
          product_id: product.id
        }
      );
    }
  }
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function personalizeUrl(url: string, data: Record<string, any>): string {
  let personalizedUrl = url;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    personalizedUrl = personalizedUrl.replace(new RegExp(placeholder, 'g'), String(value));
  });
  return personalizedUrl;
}

function personalizeData(data: Record<string, any>, userData: Record<string, any>): Record<string, any> {
  const personalizedData = { ...data };
  Object.entries(userData).forEach(([key, value]) => {
    if (personalizedData[key] && typeof personalizedData[key] === 'string') {
      personalizedData[key] = personalizedData[key].replace(
        new RegExp(`{${key}}`, 'g'), 
        String(value)
      );
    }
  });
  return personalizedData;
}

function getWarrantyDaysLeft(warranty: any): number {
  if (!warranty.warranty_end_date) return 0;
  
  const endDate = new Date(warranty.warranty_end_date);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

function getProductAgeInMonths(purchaseDate: string): number {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  return (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 30);
} 