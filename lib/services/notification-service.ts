import { createClient } from '@/lib/supabase/server';
import { 
  NotificationTemplate, 
  UserNotification, 
  NotificationPreferences,
  NotificationTrigger 
} from '@/lib/types/notifications';

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log('Notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    return Notification.permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSupported || !this.registration) {
      return null;
    }

    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '') as any
      });

      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.isSupported || !this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push subscription removed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async showNotification(data: NotificationData): Promise<void> {
    if (!this.isSupported || !this.registration) {
      return;
    }

    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    try {
      await this.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/badge-72x72.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: false,
        silent: false
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async showWarrantyExpiryNotification(productName: string, daysLeft: number): Promise<void> {
    await this.showNotification({
      title: 'Warranty Expiring Soon',
      body: `${productName} warranty expires in ${daysLeft} days`,
      tag: 'warranty-expiry',
      data: { type: 'warranty-expiry', productName, daysLeft },
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'extend',
          title: 'Extend Warranty'
        }
      ]
    });
  }

  async showNewProductNotification(productName: string): Promise<void> {
    await this.showNotification({
      title: 'New Product Added',
      body: `${productName} has been added to your inventory`,
      tag: 'new-product',
      data: { type: 'new-product', productName },
      actions: [
        {
          action: 'view',
          title: 'View Product'
        }
      ]
    });
  }

  async showClaimUpdateNotification(claimId: string, status: string): Promise<void> {
    await this.showNotification({
      title: 'Claim Update',
      body: `Your warranty claim has been ${status}`,
      tag: 'claim-update',
      data: { type: 'claim-update', claimId, status },
      actions: [
        {
          action: 'view',
          title: 'View Claim'
        }
      ]
    });
  }

  async showQuickCashNotification(amount: number, productName: string): Promise<void> {
    await this.showNotification({
      title: 'Quick Cash Offer',
      body: `Get $${amount} for your ${productName}`,
      tag: 'quick-cash',
      data: { type: 'quick-cash', amount, productName },
      actions: [
        {
          action: 'accept',
          title: 'Accept Offer'
        },
        {
          action: 'view',
          title: 'View Details'
        }
      ]
    });
  }

  async scheduleWarrantyReminder(productId: string, productName: string, expiryDate: Date): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    const now = new Date();
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24));

    // Schedule notifications at different intervals
    const reminderIntervals = [30, 7, 1]; // days before expiry

    for (const days of reminderIntervals) {
      if (daysUntilExpiry <= days && daysUntilExpiry > 0) {
        const delay = (daysUntilExpiry - days) * 24 * 60 * 60 * 1000; // Convert to milliseconds
        
        setTimeout(async () => {
          await this.showWarrantyExpiryNotification(productName, daysUntilExpiry);
        }, delay);
      }
    }
  }

  async clearNotifications(tag?: string): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    try {
      if (tag) {
        // Clear notifications with specific tag
        const notifications = await this.registration?.getNotifications({ tag });
        notifications?.forEach(notification => notification.close());
      } else {
        // Clear all notifications
        const notifications = await this.registration?.getNotifications();
        notifications?.forEach(notification => notification.close());
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  // Utility function to convert VAPID public key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get subscription for sending to server
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported || !this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  // Check if notifications are enabled
  async isEnabled(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      return false;
    }

    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  // Setup notification click handlers
  setupClickHandlers(): void {
    if (!this.isSupported) {
      return;
    }

    // Listen for notification clicks
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        this.handleNotificationClick(event.data);
      }
    });
  }

  private handleNotificationClick(data: any): void {
    const { action, notificationData } = data;

    switch (action) {
      case 'view':
        if (notificationData.type === 'warranty-expiry') {
          window.location.href = `/warranties?product=${notificationData.productName}`;
        } else if (notificationData.type === 'new-product') {
          window.location.href = `/products?search=${notificationData.productName}`;
        } else if (notificationData.type === 'claim-update') {
          window.location.href = `/claims/${notificationData.claimId}`;
        } else if (notificationData.type === 'quick-cash') {
          window.location.href = `/products?quick-cash=${notificationData.productName}`;
        }
        break;
      
      case 'extend':
        window.location.href = `/warranties/extended?product=${notificationData.productName}`;
        break;
      
      case 'accept':
        window.location.href = `/quick-cash/accept?product=${notificationData.productName}&amount=${notificationData.amount}`;
        break;
      
      default:
        // Default action - open dashboard
        window.location.href = '/dashboard';
        break;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

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
 * Create a new notification
 */
export async function createNotification(
  notification: Omit<UserNotification, 'id' | 'created_at'>
): Promise<UserNotification | null> {
  const supabase = await createClient();
  
  try {
    const { data: savedNotification, error } = await supabase
      .from('user_notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    console.log('Notification created:', savedNotification.id);
    return savedNotification;

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
    let query = supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error getting notifications:', error);
      return [];
    }

    return notifications || [];

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
          {
            user_id: product.user_id,
            template_id: 'warranty_expiry_30_days',
            title: 'Warranty Expiring Soon',
            message: 'Your {product_name} warranty expires in {days_left} days. Consider extending your protection.',
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
                data: { product_id: product.id }
              },
              {
                type: 'button',
                label: 'View Details',
                action: 'view_product',
                data: { product_id: product.id }
              }
            ],
            data: { product_name: product.product_name, days_left: daysLeft, product_id: product.id },
            scheduled_for: new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000).toISOString()
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
        {
          user_id: product.user_id,
          template_id: 'upgrade_opportunity',
          title: 'Upgrade Opportunity',
          message: 'A new {product_category} model is available. Trade in your current device for great value.',
          priority: 'medium',
          status: 'pending',
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
              data: { product_id: product.id }
            },
            {
              type: 'link',
              label: 'View New Model',
              url: `/products/${product.id}`
            }
          ],
          data: { product_category: product.category, product_id: product.id },
          scheduled_for: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString()
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