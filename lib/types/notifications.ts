// ==============================================================================
// SMART NOTIFICATIONS SYSTEM TYPES
// ==============================================================================

export interface NotificationTemplate {
  id: string;
  type: 'warranty_expiry' | 'price_drop' | 'upgrade_opportunity' | 'repair_quote' | 'warranty_claim' | 'product_recall';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: NotificationChannel[];
  actions: NotificationAction[];
  conditions: NotificationCondition[];
}

export interface NotificationChannel {
  type: 'push' | 'email' | 'sms' | 'in_app';
  enabled: boolean;
  template?: string;
}

export interface NotificationAction {
  type: 'button' | 'link' | 'deep_link';
  label: string;
  url?: string;
  action?: string;
  data?: Record<string, any>;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  logic: 'and' | 'or';
}

export interface UserNotification {
  id: string;
  user_id: string;
  template_id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'clicked' | 'dismissed';
  channels: NotificationChannel[];
  actions: NotificationAction[];
  data: Record<string, any>;
  scheduled_for: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    in_app: boolean;
  };
  types: {
    warranty_expiry: boolean;
    price_drop: boolean;
    upgrade_opportunity: boolean;
    repair_quote: boolean;
    warranty_claim: boolean;
    product_recall: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
    timezone: string;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationTrigger {
  id: string;
  user_id: string;
  product_id?: string;
  type: string;
  conditions: NotificationCondition[];
  scheduled_for: string;
  status: 'pending' | 'triggered' | 'cancelled';
  created_at: string;
} 