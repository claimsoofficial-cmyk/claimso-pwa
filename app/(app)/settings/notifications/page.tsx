'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Shield, 
  TrendingUp, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  Settings,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface NotificationPreferences {
  email_notifications: {
    warranty_expiry_30_days: boolean;
    warranty_expiry_7_days: boolean;
    warranty_expiry_1_day: boolean;
    price_drops_10_percent: boolean;
    price_drops_25_percent: boolean;
    upgrade_opportunities: boolean;
    repair_quotes_ready: boolean;
    claim_status_updates: boolean;
  };
  push_notifications: {
    urgent_warranty_alerts: boolean;
    instant_price_drops: boolean;
    claim_status_updates: boolean;
    system_maintenance: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: {
      warranty_expiry_30_days: true,
      warranty_expiry_7_days: true,
      warranty_expiry_1_day: true,
      price_drops_10_percent: true,
      price_drops_25_percent: true,
      upgrade_opportunities: true,
      repair_quotes_ready: true,
      claim_status_updates: true,
    },
    push_notifications: {
      urgent_warranty_alerts: true,
      instant_price_drops: true,
      claim_status_updates: true,
      system_maintenance: false,
    },
    quiet_hours: {
      enabled: true,
      start_time: '22:00',
      end_time: '08:00',
    },
    frequency: 'immediate',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setHasChanges(false);
      toast.success('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (category: keyof NotificationPreferences, key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, any>),
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const toggleEmailNotification = (key: string) => {
    updatePreference('email_notifications', key, !preferences.email_notifications[key as keyof typeof preferences.email_notifications]);
  };

  const togglePushNotification = (key: string) => {
    updatePreference('push_notifications', key, !preferences.push_notifications[key as keyof typeof preferences.push_notifications]);
  };

  const toggleQuietHours = () => {
    updatePreference('quiet_hours', 'enabled', !preferences.quiet_hours.enabled);
  };

  const updateFrequency = (frequency: NotificationPreferences['frequency']) => {
    setPreferences(prev => ({ ...prev, frequency }));
    setHasChanges(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Manage how and when you receive notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <Label className="text-sm font-medium">Warranty Expiry (30 days)</Label>
                </div>
                <Switch
                  checked={preferences.email_notifications.warranty_expiry_30_days}
                  onCheckedChange={() => toggleEmailNotification('warranty_expiry_30_days')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <Label className="text-sm font-medium">Warranty Expiry (7 days)</Label>
                </div>
                <Switch
                  checked={preferences.email_notifications.warranty_expiry_7_days}
                  onCheckedChange={() => toggleEmailNotification('warranty_expiry_7_days')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <Label className="text-sm font-medium">Warranty Expiry (1 day)</Label>
                </div>
                <Switch
                  checked={preferences.email_notifications.warranty_expiry_1_day}
                  onCheckedChange={() => toggleEmailNotification('warranty_expiry_1_day')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <Label className="text-sm font-medium">Price Drops (10%+)</Label>
                </div>
                <Switch
                  checked={preferences.email_notifications.price_drops_10_percent}
                  onCheckedChange={() => toggleEmailNotification('price_drops_10_percent')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <Label className="text-sm font-medium">Price Drops (25%+)</Label>
                </div>
                <Switch
                  checked={preferences.email_notifications.price_drops_25_percent}
                  onCheckedChange={() => toggleEmailNotification('price_drops_25_percent')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <Label className="text-sm font-medium">Upgrade Opportunities</Label>
                </div>
                <Switch
                  checked={preferences.email_notifications.upgrade_opportunities}
                  onCheckedChange={() => toggleEmailNotification('upgrade_opportunities')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <Label className="text-sm font-medium">Repair Quotes Ready</Label>
                </div>
                <Switch
                  checked={preferences.email_notifications.repair_quotes_ready}
                  onCheckedChange={() => toggleEmailNotification('repair_quotes_ready')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <Label className="text-sm font-medium">Claim Status Updates</Label>
                </div>
                <Switch
                  checked={preferences.email_notifications.claim_status_updates}
                  onCheckedChange={() => toggleEmailNotification('claim_status_updates')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <Label className="text-sm font-medium">Urgent Warranty Alerts</Label>
                </div>
                <Switch
                  checked={preferences.push_notifications.urgent_warranty_alerts}
                  onCheckedChange={() => togglePushNotification('urgent_warranty_alerts')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <Label className="text-sm font-medium">Instant Price Drops</Label>
                </div>
                <Switch
                  checked={preferences.push_notifications.instant_price_drops}
                  onCheckedChange={() => togglePushNotification('instant_price_drops')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <Label className="text-sm font-medium">Claim Status Updates</Label>
                </div>
                <Switch
                  checked={preferences.push_notifications.claim_status_updates}
                  onCheckedChange={() => togglePushNotification('claim_status_updates')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm font-medium">System Maintenance</Label>
                </div>
                <Switch
                  checked={preferences.push_notifications.system_maintenance}
                  onCheckedChange={() => togglePushNotification('system_maintenance')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Notification Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'immediate', label: 'Immediate', description: 'Get notified instantly' },
              { value: 'hourly', label: 'Hourly', description: 'Digest every hour' },
              { value: 'daily', label: 'Daily', description: 'Daily summary' },
              { value: 'weekly', label: 'Weekly', description: 'Weekly digest' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={preferences.frequency === option.value ? 'default' : 'outline'}
                className="flex flex-col items-center p-4 h-auto"
                onClick={() => updateFrequency(option.value as NotificationPreferences['frequency'])}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-gray-500 mt-1">{option.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Quiet Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enable Quiet Hours</Label>
                <p className="text-xs text-gray-500">Pause notifications during specified hours</p>
              </div>
              <Switch
                checked={preferences.quiet_hours.enabled}
                onCheckedChange={toggleQuietHours}
              />
            </div>

            {preferences.quiet_hours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <input
                    type="time"
                    value={preferences.quiet_hours.start_time}
                    onChange={(e) => updatePreference('quiet_hours', 'start_time', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">End Time</Label>
                  <input
                    type="time"
                    value={preferences.quiet_hours.end_time}
                    onChange={(e) => updatePreference('quiet_hours', 'end_time', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={!hasChanges || isLoading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
