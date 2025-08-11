'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Mail, 
  Smartphone, 
  Shield, 
  Sparkles,
  Apple,
  Chrome,
  Skip,
  Party
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MultiConnect from '@/components/onboarding/MultiConnect';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

type OnboardingStep = 'connect_retailers' | 'enable_sync' | 'get_smart_pass';

interface OnboardingFlowProps {
  onComplete?: () => void;
  className?: string;
}

interface DeviceInfo {
  os: 'ios' | 'android' | 'desktop';
  isMobile: boolean;
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Detects user's operating system and device type
 */
function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { os: 'desktop', isMobile: false };
  }

  const userAgent = window.navigator.userAgent;
 
  
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return { os: 'ios', isMobile: true };
  } else if (/Android/i.test(userAgent)) {
    return { os: 'android', isMobile: true };
  } else {
    return { os: 'desktop', isMobile: false };
  }
}

// ==============================================================================
// ONBOARDING FLOW COMPONENT
// ==============================================================================

/**
 * OnboardingFlow - Multi-step setup experience for new users
 * 
 * Guides users through:
 * 1. Connecting retail accounts (MultiConnect)
 * 2. Enabling universal email capture 
 * 3. Adding Smart Pass to wallet
 */
export default function OnboardingFlow({ onComplete, className = '' }: OnboardingFlowProps) {
  // ==============================================================================
  // STATE MANAGEMENT
  // ==============================================================================

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('connect_retailers');
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({ os: 'desktop', isMobile: false });
  const [isLoading, setIsLoading] = useState(false);

  // Detect device on mount
  useEffect(() => {
    setDeviceInfo(detectDevice());
  }, []);

  // ==============================================================================
  // STEP NAVIGATION HANDLERS
  // ==============================================================================

  const handleContinueFromMultiConnect = () => {
    if (connectedAccounts.length > 0) {
      setCurrentStep('enable_sync');
    }
  };

  const handleSkipSync = () => {
    setCurrentStep('get_smart_pass');
  };

  const handleEnableSync = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement OS-specific sync setup
      if (deviceInfo.os === 'ios') {
        // TODO: Guide user to create iOS Mail Rule
        // This could open a modal with step-by-step instructions
        console.log('Setting up iOS Mail Rule...');
      } else if (deviceInfo.os === 'android' || deviceInfo.os === 'desktop') {
        // TODO: Initiate Gmail API filter creation
        // This could trigger OAuth flow and API calls
        console.log('Setting up Gmail filters...');
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep('get_smart_pass');
    } catch (error) {
      console.error('Error setting up sync:', error);
      // For now, continue to next step even on error
      setCurrentStep('get_smart_pass');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWallet = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Call /api/passes/generate endpoint
      const response = await fetch('/api/passes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const passData = await response.json();
        // TODO: Trigger wallet app to open with pass
        console.log('Pass generated:', passData);
      }
      
    } catch (error) {
      console.error('Error generating pass:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishOnboarding = () => {
    onComplete?.();
  };

  // ==============================================================================
  // RENDER HELPER FUNCTIONS
  // ==============================================================================

  const renderProgressIndicator = () => {
    const steps = [
      { key: 'connect_retailers', label: 'Connect', icon: Shield },
      { key: 'enable_sync', label: 'Sync', icon: Mail },
      { key: 'get_smart_pass', label: 'Pass', icon: Smartphone },
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.key === currentStep;
          const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                ${isCompleted 
                  ? 'bg-green-100 text-green-600' 
                  : isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              
              <span className={`
                ml-2 text-sm font-medium transition-colors
                ${isCompleted 
                  ? 'text-green-600' 
                  : isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-400'
                }
              `}>
                {step.label}
              </span>
              
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 mx-4 text-gray-300" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'connect_retailers':
        return renderConnectRetailersStep();
      case 'enable_sync':
        return renderEnableSyncStep();
      case 'get_smart_pass':
        return renderSmartPassStep();
      default:
        return null;
    }
  };

  const renderConnectRetailersStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Connect Your Accounts
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Link your retail accounts to automatically import your purchase history 
          and warranty information.
        </p>
      </div>

      <MultiConnect 
        onAccountsChange={setConnectedAccounts}
        className="max-w-2xl mx-auto"
      />

      <div className="flex justify-center pt-6">
        <Button
          onClick={handleContinueFromMultiConnect}
          disabled={connectedAccounts.length === 0}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {connectedAccounts.length === 0 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Connect at least one account to continue
        </p>
      )}
    </div>
  );

  const renderEnableSyncStep = () => {
    const getSyncButtonText = () => {
      switch (deviceInfo.os) {
        case 'ios':
          return 'Enable Sync on my iPhone';
        case 'android':
          return 'Enable Sync with my Gmail';
        default:
          return 'Enable Sync with my Gmail';
      }
    };

    const getSyncButtonIcon = () => {
      switch (deviceInfo.os) {
        case 'ios':
          return <Apple className="w-4 h-4" />;
        case 'android':
        case 'desktop':
        default:
          return <Chrome className="w-4 h-4" />;
      }
    };

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Enable Universal Capture
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Automatically track purchases from <strong>anywhere</strong> by securely 
            syncing new receipts from your email.
          </p>
        </div>

        <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Forward receipts to your personal CLAIMSO inbox</li>
                <li>• AI automatically extracts product and warranty info</li>
                <li>• Everything appears in your vault within seconds</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleEnableSync}
            disabled={isLoading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Setting up...
              </>
            ) : (
              <>
                {getSyncButtonIcon()}
                <span className="ml-2">{getSyncButtonText()}</span>
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSkipSync}
            variant="outline"
            size="lg"
            className="px-8"
            disabled={isLoading}
          >
            <Skip className="w-4 h-4 mr-2" />
            Skip for now
          </Button>
        </div>
      </div>
    );
  };

  const renderSmartPassStep = () => (
    <div className="max-w-2xl mx-auto space-y-8 text-center">
      <div>
        <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <Party className="w-10 h-10 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Your vault is ready!
        </h2>
        <p className="text-gray-600 text-lg">
          Add your CLAIMSO Smart Pass to get real-time updates about your warranties 
          and protection plans.
        </p>
      </div>

      {/* Smart Pass Visual */}
      <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900">CLAIMSO Smart Pass</div>
            <div className="text-sm text-gray-600">Personal Warranty Assistant</div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center space-x-4">
          <Badge variant="secondary" className="text-xs">
            <Smartphone className="w-3 h-3 mr-1" />
            Push Notifications
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Warranty Alerts
          </Badge>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={handleAddToWallet}
          disabled={isLoading}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generating...
            </>
          ) : (
            <>
              {deviceInfo.os === 'ios' ? (
                <Apple className="w-4 h-4 mr-2" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              Add to {deviceInfo.os === 'ios' ? 'Apple' : 'Google'} Wallet
            </>
          )}
        </Button>
        
        <Button
          onClick={handleFinishOnboarding}
          variant="outline"
          size="lg"
          className="px-8"
          disabled={isLoading}
        >
          Finish Setup
        </Button>
      </div>

      {/* Mission Statement */}
      <div className="pt-8 border-t border-gray-100">
        <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
          By using CLAIMSO, you&apos;re contributing to a more transparent market where 
          consumers have the power to hold companies accountable for their promises. 
          Together, we&apos;re building a world where every warranty matters.
        </p>
      </div>
    </div>
  );

  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        {renderProgressIndicator()}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team anytime.
          </p>
        </div>
      </div>
    </div>
  );
}