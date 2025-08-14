'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Shield,
  Package,
  Mail,
  Settings,
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isCompleted: boolean;
  isRequired: boolean;
  action?: () => void;
}

interface OnboardingData {
  hasCompletedProfile: boolean;
  hasConnectedRetailer: boolean;
  hasAddedProduct: boolean;
  hasSetUpEmailSync: boolean;
  hasViewedTutorial: boolean;
}

export default function UserOnboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    hasCompletedProfile: false,
    hasConnectedRetailer: false,
    hasAddedProduct: false,
    hasSetUpEmailSync: false,
    hasViewedTutorial: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check user profile completion
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, onboarding_completed')
        .eq('id', user.id)
        .single();

      // Check if user has products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has connected retailers
      const { data: connections } = await supabase
        .from('user_connections')
        .select('retailer')
        .eq('user_id', user.id)
        .eq('status', 'connected')
        .limit(1);

      const data: OnboardingData = {
        hasCompletedProfile: !!profile?.full_name,
        hasConnectedRetailer: (connections?.length || 0) > 0,
        hasAddedProduct: (products?.length || 0) > 0,
        hasSetUpEmailSync: false, // TODO: Implement email sync check
        hasViewedTutorial: profile?.onboarding_completed || false,
      };

      setOnboardingData(data);

      // Show onboarding if not completed
      if (!data.hasViewedTutorial) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your name and basic information to personalize your experience',
      icon: Settings,
      isCompleted: onboardingData.hasCompletedProfile,
      isRequired: true,
      action: () => window.location.href = '/settings/account',
    },
    {
      id: 'connect',
      title: 'Connect Your Retailers',
      description: 'Link your Amazon, Walmart, and other accounts to automatically import purchases',
      icon: Package,
      isCompleted: onboardingData.hasConnectedRetailer,
      isRequired: false,
      action: () => {
        // Open connection modal
        toast.message('Connect Your Accounts', {
          description: 'This will open the connection modal to link your retail accounts.',
        });
      },
    },
    {
      id: 'add-product',
      title: 'Add Your First Product',
      description: 'Manually add a product or import from your connected accounts',
      icon: Package,
      isCompleted: onboardingData.hasAddedProduct,
      isRequired: true,
      action: () => window.location.href = '/products/add',
    },
    {
      id: 'email-sync',
      title: 'Set Up Email Sync',
      description: 'Forward receipts to automatically capture future purchases',
      icon: Mail,
      isCompleted: onboardingData.hasSetUpEmailSync,
      isRequired: false,
      action: () => {
        toast.message('Email Sync Setup', {
          description: 'We\'ll guide you through setting up email forwarding for automatic receipt capture.',
        });
      },
    },
    {
      id: 'tutorial',
      title: 'Take a Quick Tour',
      description: 'Learn about key features and how to get the most out of Claimso',
      icon: HelpCircle,
      isCompleted: onboardingData.hasViewedTutorial,
      isRequired: false,
      action: () => {
        // Start product tour
        toast.message('Product Tour', {
          description: 'Starting interactive tour of Claimso features...',
        });
      },
    },
  ];

  const completedSteps = steps.filter(step => step.isCompleted).length;
  const progress = (completedSteps / steps.length) * 100;

  const handleStepClick = (step: OnboardingStep) => {
    if (step.action) {
      step.action();
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      setIsVisible(false);
      toast.success('Welcome to Claimso!', {
        description: 'You\'re all set up and ready to manage your warranties.',
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipOnboarding = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      setIsVisible(false);
      toast.success('Onboarding skipped', {
        description: 'You can always access the help section for guidance.',
      });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast.error('Failed to skip onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Welcome to Claimso!</CardTitle>
                <p className="text-sm text-gray-600">Let&apos;s get you set up in a few quick steps</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipOnboarding}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Setup Progress</span>
              <span className="text-sm text-gray-500">{completedSteps} of {steps.length} completed</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps List */}
          <div className="space-y-4 mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    step.isCompleted
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {step.isCompleted ? (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{step.title}</h3>
                        {step.isRequired && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {step.isCompleted && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                    {!step.isCompleted && (
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCompleteOnboarding}
              disabled={isLoading || completedSteps < 2} // Require at least profile and product
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkipOnboarding}
              disabled={isLoading}
            >
              Skip for Now
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Need help?</p>
                <p>You can always access the help section from the sidebar or contact our support team for assistance.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
