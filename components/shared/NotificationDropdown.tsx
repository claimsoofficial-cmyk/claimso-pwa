'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bell, 
  X, 
  Settings, 
  ExternalLink,
  Clock,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: 'warranty_expiry' | 'price_drop' | 'upgrade_opportunity' | 'repair_quote' | 'claim_update' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  action_text?: string;
  created_at: string;
  read: boolean;
  dismissed: boolean;
  metadata?: {
    product_id?: string;
    product_name?: string;
    days_until_expiry?: number;
    price_change_percent?: number;
    claim_id?: string;
  };
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch notifications from database
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notifications:', error);
        // Fallback to mock notifications for demo
        setNotifications(generateMockNotifications());
      } else {
        setNotifications(dbNotifications || generateMockNotifications());
      }

      // Update unread count
      const unread = (dbNotifications || []).filter(n => !n.read).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(generateMockNotifications());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockNotifications = (): Notification[] => {
    return [
      {
        id: '1',
        type: 'warranty_expiry',
        title: 'iPhone 14 Pro warranty expires soon',
        message: 'Your iPhone 14 Pro warranty expires in 7 days. Consider extending coverage.',
        priority: 'urgent',
        action_url: '/products/iphone-14-pro',
        action_text: 'Extend Warranty',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        read: false,
        dismissed: false,
        metadata: {
          product_id: 'iphone-14-pro',
          product_name: 'iPhone 14 Pro',
          days_until_expiry: 7
        }
      },
      {
        id: '2',
        type: 'price_drop',
        title: 'MacBook Pro price dropped 15%',
        message: 'The MacBook Pro you\'ve been tracking is now 15% cheaper.',
        priority: 'high',
        action_url: '/products/macbook-pro',
        action_text: 'View Deal',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: false,
        dismissed: false,
        metadata: {
          product_id: 'macbook-pro',
          product_name: 'MacBook Pro',
          price_change_percent: -15
        }
      },
      {
        id: '3',
        type: 'repair_quote',
        title: 'Samsung TV repair quote ready',
        message: 'Your repair quote for Samsung TV is ready. Estimated cost: $89.',
        priority: 'medium',
                    action_url: '/dashboard?claim=samsung-tv-repair',
        action_text: 'View Quote',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        read: true,
        dismissed: false,
        metadata: {
          product_id: 'samsung-tv',
          product_name: 'Samsung TV',
          claim_id: 'claim-123'
        }
      },
      {
        id: '4',
        type: 'upgrade_opportunity',
        title: 'New iPhone 15 Pro available',
        message: 'Upgrade your iPhone 14 Pro to iPhone 15 Pro and get $425 trade-in value.',
        priority: 'medium',
        action_url: '/products/iphone-15-pro',
        action_text: 'Upgrade Now',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        read: true,
        dismissed: false,
        metadata: {
          product_id: 'iphone-15-pro',
          product_name: 'iPhone 15 Pro'
        }
      }
    ];
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleAction = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.action_url) {
      if (notification.action_url.startsWith('http')) {
        window.open(notification.action_url, '_blank');
      } else {
        window.location.href = notification.action_url;
      }
    }
    
    toast.success(`Navigating to ${notification.action_text || 'action'}...`);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warranty_expiry':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'price_drop':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'upgrade_opportunity':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'repair_quote':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case 'claim_update':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-blue-200 bg-blue-50';
      case 'low':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`m-2 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissNotification(notification.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {notification.action_text && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(notification)}
                          className="mt-2 w-full text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {notification.action_text}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/settings/notifications'}
            className="text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/notifications'}
            className="text-xs"
          >
            View All
          </Button>
        </div>
      </div>
    </div>
  );
}
