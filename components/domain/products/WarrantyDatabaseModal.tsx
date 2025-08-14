'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Loader2,
  ExternalLink,
  DollarSign,
  Calendar,
  FileText,
  Phone,
  Mail,
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/types/common';

interface WarrantyDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

interface WarrantyInfo {
  id: string;
  product_name: string;
  brand: string;
  category: string;
  manufacturer_warranty: {
    duration: string;
    coverage: string[];
    exclusions: string[];
    claim_process: string;
    contact_info: {
      phone: string;
      email: string;
      website: string;
    };
  };
  extended_warranty_options: ExtendedWarrantyOption[];
  common_issues: CommonIssue[];
  repair_cost_estimates: RepairCost[];
  warranty_status: 'active' | 'expired' | 'expiring_soon';
  days_until_expiry: number;
}

interface ExtendedWarrantyOption {
  id: string;
  provider: string;
  name: string;
  duration: string;
  price: number;
  coverage: string[];
  rating: number;
  features: string[];
  claim_process: string;
  affiliate_url?: string;
}

interface CommonIssue {
  id: string;
  issue: string;
  frequency: 'rare' | 'common' | 'very_common';
  symptoms: string[];
  solutions: string[];
  estimated_repair_cost: number;
  covered_by_warranty: boolean;
}

interface RepairCost {
  issue: string;
  diy_cost: number;
  professional_cost: number;
  time_estimate: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function WarrantyDatabaseModal({ isOpen, onClose, product }: WarrantyDatabaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'extended' | 'issues' | 'repairs'>('overview');
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && product) {
      fetchWarrantyInfo();
    }
  }, [isOpen, product]);

  const fetchWarrantyInfo = async () => {
    if (!product) return;

    setIsLoading(true);
    try {
      // Fetch warranty information from database
      const response = await fetch('/api/warranty-database/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: product.product_name,
          brand: product.brand,
          category: product.category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch warranty info');
      }

      const data = await response.json();
      setWarrantyInfo(data);
      toast.success('Warranty information loaded!');
    } catch (error) {
      console.error('Error fetching warranty info:', error);
      // Fallback to mock data
      setWarrantyInfo(generateMockWarrantyInfo(product));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockWarrantyInfo = (product: Product): WarrantyInfo => {
    const isPhone = product.category?.toLowerCase().includes('phone') || false;
    const isLaptop = product.category?.toLowerCase().includes('laptop') || false;
    
    return {
      id: 'warranty-1',
      product_name: product.product_name,
      brand: product.brand || 'Unknown',
      category: product.category || 'Unknown',
      manufacturer_warranty: {
        duration: isPhone ? '1 Year Limited' : '2 Years Limited',
        coverage: [
          'Hardware defects',
          'Manufacturing faults',
          'Component failures',
          'Software issues (first 90 days)'
        ],
        exclusions: [
          'Accidental damage',
          'Water damage',
          'Unauthorized modifications',
          'Normal wear and tear',
          'Cosmetic damage'
        ],
        claim_process: isPhone 
          ? 'Contact manufacturer support → Provide proof of purchase → Ship device for repair → Receive repaired device'
          : 'Contact manufacturer → Create support ticket → Remote diagnosis → On-site repair or shipping',
        contact_info: {
          phone: isPhone ? '1-800-APPLE-1' : '1-800-MICROSOFT',
          email: isPhone ? 'support@apple.com' : 'support@microsoft.com',
          website: isPhone ? 'https://support.apple.com' : 'https://support.microsoft.com'
        }
      },
      extended_warranty_options: [
        {
          id: 'ext-1',
          provider: isPhone ? 'AppleCare+' : 'Microsoft Complete',
          name: isPhone ? 'AppleCare+ with Theft and Loss' : 'Microsoft Complete Protection',
          duration: '2 Years',
          price: isPhone ? 199 : 149,
          coverage: [
            'Accidental damage protection',
            'Express replacement service',
            'Priority technical support',
            'Unlimited repairs'
          ],
          rating: 4.8,
          features: [
            'Deductible: $29 for screen damage',
            'Deductible: $99 for other damage',
            '2 incidents per year',
            '24/7 priority support'
          ],
          claim_process: 'Contact support → Schedule appointment → Visit store or ship → Quick turnaround',
          affiliate_url: isPhone ? 'https://www.apple.com/applecare/' : 'https://www.microsoft.com/complete'
        },
        {
          id: 'ext-2',
          provider: 'SquareTrade',
          name: 'SquareTrade Protection Plan',
          duration: '3 Years',
          price: isPhone ? 89 : 129,
          coverage: [
            'Accidental damage',
            'Mechanical breakdown',
            'Power surge protection',
            '24/7 claims support'
          ],
          rating: 4.6,
          features: [
            'No deductibles',
            'Unlimited claims',
            'Fast repair or replacement',
            'Nationwide repair network'
          ],
          claim_process: 'File claim online → Get repair authorization → Ship or visit repair center → Receive fixed device',
          affiliate_url: 'https://www.squaretrade.com'
        }
      ],
      common_issues: [
        {
          id: 'issue-1',
          issue: 'Battery not holding charge',
          frequency: 'common',
          symptoms: ['Device dies quickly', 'Battery percentage jumps', 'Slow charging'],
          solutions: ['Replace battery', 'Check charging cable', 'Update software'],
          estimated_repair_cost: isPhone ? 79 : 129,
          covered_by_warranty: true
        },
        {
          id: 'issue-2',
          issue: 'Screen cracked or damaged',
          frequency: 'very_common',
          symptoms: ['Cracked screen', 'Touch not responding', 'Display issues'],
          solutions: ['Replace screen', 'Professional repair', 'Insurance claim'],
          estimated_repair_cost: isPhone ? 279 : 399,
          covered_by_warranty: false
        },
        {
          id: 'issue-3',
          issue: 'Software performance issues',
          frequency: 'common',
          symptoms: ['Slow performance', 'Apps crashing', 'System freezes'],
          solutions: ['Factory reset', 'Software update', 'Clear cache'],
          estimated_repair_cost: 0,
          covered_by_warranty: true
        }
      ],
      repair_cost_estimates: [
        {
          issue: 'Screen replacement',
          diy_cost: isPhone ? 150 : 250,
          professional_cost: isPhone ? 279 : 399,
          time_estimate: '2-4 hours',
          difficulty: 'hard'
        },
        {
          issue: 'Battery replacement',
          diy_cost: isPhone ? 40 : 80,
          professional_cost: isPhone ? 79 : 129,
          time_estimate: '1-2 hours',
          difficulty: 'medium'
        },
        {
          issue: 'Software repair',
          diy_cost: 0,
          professional_cost: 49,
          time_estimate: '30 minutes',
          difficulty: 'easy'
        }
      ],
      warranty_status: 'active',
      days_until_expiry: 45
    };
  };

  const getWarrantyStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'rare': return 'bg-green-100 text-green-800';
      case 'common': return 'bg-yellow-100 text-yellow-800';
      case 'very_common': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Warranty Database
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
                  <Badge className={getWarrantyStatusColor(warrantyInfo?.warranty_status || 'active')}>
                    {warrantyInfo?.warranty_status === 'active' ? 'Active Warranty' : 
                     warrantyInfo?.warranty_status === 'expired' ? 'Expired' : 'Expiring Soon'}
                  </Badge>
                  {warrantyInfo?.days_until_expiry && (
                    <p className="text-sm text-gray-600 mt-1">
                      {warrantyInfo.days_until_expiry} days remaining
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading warranty information...</p>
            </div>
          )}

          {/* Content */}
          {!isLoading && warrantyInfo && (
            <>
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
                  { id: 'extended', label: 'Extended Warranty', icon: <Star className="w-4 h-4" /> },
                  { id: 'issues', label: 'Common Issues', icon: <AlertTriangle className="w-4 h-4" /> },
                  { id: 'repairs', label: 'Repair Costs', icon: <DollarSign className="w-4 h-4" /> }
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={selectedTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTab(tab.id as any)}
                    className="flex items-center gap-2"
                  >
                    {tab.icon}
                    {tab.label}
                  </Button>
                ))}
              </div>

              {/* Tab Content */}
              {selectedTab === 'overview' && (
                <div className="space-y-4">
                  {/* Manufacturer Warranty */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Manufacturer Warranty
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Duration</Label>
                          <p className="text-lg font-semibold">{warrantyInfo.manufacturer_warranty.duration}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge className={getWarrantyStatusColor(warrantyInfo.warranty_status)}>
                            {warrantyInfo.warranty_status === 'active' ? 'Active' : 
                             warrantyInfo.warranty_status === 'expired' ? 'Expired' : 'Expiring Soon'}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Coverage</Label>
                        <ul className="mt-2 space-y-1">
                          {warrantyInfo.manufacturer_warranty.coverage.map((item, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Exclusions</Label>
                        <ul className="mt-2 space-y-1">
                          {warrantyInfo.manufacturer_warranty.exclusions.map((item, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <X className="w-4 h-4 text-red-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Claim Process</Label>
                        <p className="text-sm text-gray-600 mt-1">{warrantyInfo.manufacturer_warranty.claim_process}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Contact Information</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{warrantyInfo.manufacturer_warranty.contact_info.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{warrantyInfo.manufacturer_warranty.contact_info.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                            <a 
                              href={warrantyInfo.manufacturer_warranty.contact_info.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {warrantyInfo.manufacturer_warranty.contact_info.website}
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedTab === 'extended' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Extended Warranty Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {warrantyInfo.extended_warranty_options.map((option) => (
                      <Card key={option.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{option.provider}</h4>
                              <p className="text-sm text-gray-600">{option.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">${option.price}</p>
                              <p className="text-sm text-gray-500">{option.duration}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(option.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">({option.rating})</span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <Label className="text-sm font-medium">Coverage</Label>
                            <ul className="space-y-1">
                              {option.coverage.map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-2 mb-4">
                            <Label className="text-sm font-medium">Features</Label>
                            <ul className="space-y-1">
                              {option.features.map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                  <Zap className="w-4 h-4 text-blue-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              if (option.affiliate_url) {
                                window.open(option.affiliate_url, '_blank');
                                toast.success(`Redirecting to ${option.provider}...`);
                              }
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Get Quote
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === 'issues' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Common Issues</h3>
                  <div className="space-y-4">
                    {warrantyInfo.common_issues.map((issue) => (
                      <Card key={issue.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{issue.issue}</h4>
                              <Badge className={getFrequencyColor(issue.frequency)}>
                                {issue.frequency.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-600">
                                ${issue.estimated_repair_cost}
                              </p>
                              <Badge variant={issue.covered_by_warranty ? 'default' : 'secondary'}>
                                {issue.covered_by_warranty ? 'Covered' : 'Not Covered'}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Symptoms</Label>
                              <ul className="mt-2 space-y-1">
                                {issue.symptoms.map((symptom, index) => (
                                  <li key={index} className="flex items-center gap-2 text-sm">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    {symptom}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Solutions</Label>
                              <ul className="mt-2 space-y-1">
                                {issue.solutions.map((solution, index) => (
                                  <li key={index} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    {solution}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === 'repairs' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Repair Cost Estimates</h3>
                  <div className="space-y-4">
                    {warrantyInfo.repair_cost_estimates.map((repair, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">{repair.issue}</h4>
                            <Badge className={getDifficultyColor(repair.difficulty)}>
                              {repair.difficulty}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <Label className="text-sm font-medium">DIY Cost</Label>
                              <p className="text-lg font-bold text-green-600">${repair.diy_cost}</p>
                            </div>
                            <div className="text-center">
                              <Label className="text-sm font-medium">Professional</Label>
                              <p className="text-lg font-bold text-blue-600">${repair.professional_cost}</p>
                            </div>
                            <div className="text-center">
                              <Label className="text-sm font-medium">Time Estimate</Label>
                              <p className="text-sm">{repair.time_estimate}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
