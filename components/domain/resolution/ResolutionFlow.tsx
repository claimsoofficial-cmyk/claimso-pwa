'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Wrench, 
  DollarSign, 
  Phone, 
  MessageCircle, 
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  Zap,
  TrendingUp,
  Settings,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/types/common';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ResolutionFlowProps {
  isOpen?: boolean;
  onClose?: () => void;
  product: Product | null;
  onComplete?: (issueType: string, description: string) => void;
  onCancel?: () => void;
}

interface ResolutionOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'hardware' | 'software' | 'warranty' | 'cash' | 'support';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  cost: string;
  action: () => void;
}

export default function ResolutionFlow({ isOpen, onClose, product, onComplete, onCancel }: ResolutionFlowProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<ResolutionOption | null>(null);
  const [issueType, setIssueType] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>('');

  const resolutionOptions: ResolutionOption[] = [
    {
      id: 'hardware-repair',
      title: 'Hardware Problem',
      description: 'Screen, battery, camera, or other physical issues',
      icon: <Wrench className="w-5 h-5" />,
      category: 'hardware',
      priority: 'high',
      estimatedTime: '1-3 days',
      cost: '$50-300',
      action: () => {
        toast.success('Opening hardware repair options...');
        // Navigate to maintenance providers
        window.location.href = '/dashboard';
      }
    },
    {
      id: 'software-issue',
      title: 'Software Problem',
      description: 'Apps, updates, performance, or system issues',
      icon: <Settings className="w-5 h-5" />,
      category: 'software',
      priority: 'medium',
      estimatedTime: '30 min - 2 hours',
      cost: '$0-50',
      action: () => {
        toast.success('Opening software troubleshooting...');
        // Show software troubleshooting steps
        window.open('https://help.claimso.com/software-troubleshooting', '_blank');
      }
    },
    {
      id: 'expert-support',
      title: 'Talk to Expert',
      description: 'Get personalized help from our support team',
      icon: <Phone className="w-5 h-5" />,
      category: 'support',
      priority: 'medium',
      estimatedTime: '15-30 min',
      cost: '$0',
      action: () => {
        toast.success('Connecting you to support...');
        // Open support chat or call
        window.open('tel:1-800-CLAIMSO', '_blank');
      }
    },
    {
      id: 'live-chat',
      title: 'Live Chat Support',
      description: 'Chat with our support team in real-time',
      icon: <MessageCircle className="w-5 h-5" />,
      category: 'support',
      priority: 'medium',
      estimatedTime: '5-15 min',
      cost: '$0',
      action: () => {
        toast.success('Opening live chat...');
        // Open chat widget
        window.open('https://claimso.com/support', '_blank');
      }
    },
    {
      id: 'self-help',
      title: 'Self-Help Resources',
      description: 'Browse troubleshooting guides and FAQs',
      icon: <FileText className="w-5 h-5" />,
      category: 'software',
      priority: 'low',
      estimatedTime: '10-30 min',
      cost: '$0',
      action: () => {
        toast.success('Opening help resources...');
        // Navigate to help center
        window.open('https://help.claimso.com', '_blank');
      }
    }
  ];

  const categories = [
    { id: 'hardware', name: 'Hardware Issues', icon: <Wrench className="w-4 h-4" />, color: 'bg-red-100 text-red-800' },
    { id: 'software', name: 'Software Issues', icon: <Settings className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' },
    { id: 'support', name: 'Support & Help', icon: <Phone className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOptionSelect = (option: ResolutionOption) => {
    setSelectedOption(option);
    option.action();
    setTimeout(() => onClose?.(), 1000);
  };

  const filteredOptions = selectedCategory 
    ? resolutionOptions.filter(option => option.category === selectedCategory)
    : resolutionOptions;

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            How can we help?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {product.product_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {product.brand} • {product.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">What&apos;s the issue?</p>
                  <p className="text-sm font-medium">Choose an option below</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issue Form - Only show when onComplete is provided */}
          {onComplete && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="issueType" className="text-sm font-medium">
                      What type of issue are you experiencing?
                    </Label>
                    <select
                      id="issueType"
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select an issue type...</option>
                      <option value="hardware_malfunction">Hardware Malfunction</option>
                      <option value="physical_damage">Physical Damage</option>
                      <option value="software_issue">Software Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="problemDescription" className="text-sm font-medium">
                      Describe the problem in detail
                    </Label>
                    <textarea
                      id="problemDescription"
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Please describe what's happening with your device..."
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (issueType && problemDescription.trim()) {
                          onComplete(issueType, problemDescription.trim());
                        } else {
                          toast.error('Please fill in all required fields');
                        }
                      }}
                      disabled={!issueType || !problemDescription.trim()}
                    >
                      Submit Issue
                    </Button>
                    {onCancel && (
                      <Button variant="outline" onClick={onCancel}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Filter by Category</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedCategory ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Options
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  {category.icon}
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Resolution Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {selectedCategory 
                ? `${categories.find(c => c.id === selectedCategory)?.name} (${filteredOptions.length})`
                : `All Resolution Options (${filteredOptions.length})`
              }
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOptions.map((option) => (
                <Card 
                  key={option.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOptionSelect(option)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {option.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{option.title}</h4>
                          <Badge className={getPriorityColor(option.priority)}>
                            {option.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {option.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{option.estimatedTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            <span>{option.cost}</span>
                          </div>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.success('Opening warranty database...');
                    onClose?.();
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Check Warranty
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.success('Opening cash offers...');
                    onClose?.();
                  }}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Get Cash Offers
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.success('Opening claim filing...');
                    onClose?.();
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  File Claim
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open('tel:1-800-CLAIMSO', '_blank');
                    onClose?.();
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}