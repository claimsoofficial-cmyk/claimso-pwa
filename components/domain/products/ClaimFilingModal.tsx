'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Upload, 
  Camera, 
  Video, 
  X, 
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/types/common';

interface ClaimFilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

interface ClaimForm {
  issue_type: string;
  description: string;
  contact_phone: string;
  contact_email: string;
  documents: File[];
  photos: File[];
  videos: File[];
  preferred_contact_method: 'email' | 'phone';
  urgency_level: 'low' | 'medium' | 'high' | 'urgent';
}

interface ClaimStatus {
  id: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'repair_scheduled' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
  estimated_timeline: string;
  notes?: string;
}

export default function ClaimFilingModal({ isOpen, onClose, product }: ClaimFilingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [claimForm, setClaimForm] = useState<ClaimForm>({
    issue_type: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    documents: [],
    photos: [],
    videos: [],
    preferred_contact_method: 'email',
    urgency_level: 'medium',
  });
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && product) {
      // Pre-fill contact information if available
      loadUserProfile();
    }
  }, [isOpen, product]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setClaimForm(prev => ({
          ...prev,
          contact_email: profile.email || user.email || '',
          contact_phone: profile.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const issueTypes = [
    { value: 'hardware_defect', label: 'Hardware Defect', icon: <Shield className="w-4 h-4" /> },
    { value: 'screen_cracked', label: 'Screen Cracked', icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'battery_issue', label: 'Battery Issue', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'camera_problem', label: 'Camera Problem', icon: <Camera className="w-4 h-4" /> },
    { value: 'software_issue', label: 'Software Issue', icon: <FileText className="w-4 h-4" /> },
    { value: 'performance_issue', label: 'Performance Issue', icon: <Clock className="w-4 h-4" /> },
    { value: 'other', label: 'Other Issue', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', description: 'Minor issue, can wait' },
    { value: 'medium', label: 'Medium', description: 'Affects daily use' },
    { value: 'high', label: 'High', description: 'Significantly impacts use' },
    { value: 'urgent', label: 'Urgent', description: 'Critical functionality lost' },
  ];

  const handleFileUpload = (files: FileList, type: 'documents' | 'photos' | 'videos') => {
    const fileArray = Array.from(files);
    setClaimForm(prev => ({
      ...prev,
      [type]: [...prev[type], ...fileArray],
    }));
    toast.success(`${fileArray.length} ${type} uploaded`);
  };

  const removeFile = (type: 'documents' | 'photos' | 'videos', index: number) => {
    setClaimForm(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!product) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create claim record
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert({
          user_id: user.id,
          product_id: product.id,
          product_name: product.product_name,
          issue_type: claimForm.issue_type,
          description: claimForm.description,
          contact_phone: claimForm.contact_phone,
          contact_email: claimForm.contact_email,
          preferred_contact_method: claimForm.preferred_contact_method,
          urgency_level: claimForm.urgency_level,
          status: 'submitted',
        })
        .select()
        .single();

      if (claimError) throw claimError;

      // Upload files if any (simplified for now)
      if (claimForm.documents.length > 0 || claimForm.photos.length > 0 || claimForm.videos.length > 0) {
        console.log('Files to upload:', {
          documents: claimForm.documents.length,
          photos: claimForm.photos.length,
          videos: claimForm.videos.length
        });
        // TODO: Implement file upload when storage is configured
      }

      // Create initial status
      const { error: statusError } = await supabase
        .from('claim_statuses')
        .insert({
          claim_id: claim.id,
          status: 'submitted',
          notes: 'Claim submitted successfully',
        });

      if (statusError) throw statusError;

      setClaimStatus({
        id: claim.id,
        status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_timeline: '5-7 business days',
      });

      setCurrentStep(3);
      toast.success('Claim submitted successfully! We\'ll contact you within 24 hours.');
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadClaimFiles = async (claimId: string) => {
    const allFiles = [
      ...claimForm.documents.map(f => ({ file: f, type: 'document' })),
      ...claimForm.photos.map(f => ({ file: f, type: 'photo' })),
      ...claimForm.videos.map(f => ({ file: f, type: 'video' })),
    ];

    for (const { file, type } of allFiles) {
      const fileName = `${claimId}/${type}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('claim-files')
        .upload(fileName, file);

      if (error) {
        console.error(`Error uploading ${type}:`, error);
      }
    }
  };

  const getStatusColor = (status: ClaimStatus['status']) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ClaimStatus['status']) => {
    switch (status) {
      case 'submitted': return <FileText className="w-4 h-4" />;
      case 'under_review': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            File Warranty Claim
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
                  <p className="text-sm text-gray-600">
                    Serial: {product.serial_number || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Purchase Date</p>
                  <p className="text-sm font-medium">
                    {new Date(product.purchase_date || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Issue Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Issue Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {issueTypes.map((issue) => (
                    <Button
                      key={issue.value}
                      variant={claimForm.issue_type === issue.value ? 'default' : 'outline'}
                      className="justify-start h-auto p-3"
                      onClick={() => setClaimForm(prev => ({ ...prev, issue_type: issue.value }))}
                    >
                      {issue.icon}
                      <span className="ml-2 text-sm">{issue.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  value={claimForm.description}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Urgency Level</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {urgencyLevels.map((level) => (
                    <Button
                      key={level.value}
                      variant={claimForm.urgency_level === level.value ? 'default' : 'outline'}
                      className="justify-start h-auto p-3"
                      onClick={() => setClaimForm(prev => ({ ...prev, urgency_level: level.value as any }))}
                    >
                      <div className="text-left">
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-gray-500">{level.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!claimForm.issue_type || !claimForm.description}
                >
                  Next: Contact Information
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={claimForm.contact_phone}
                    onChange={(e) => setClaimForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="mt-1"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={claimForm.contact_email}
                    onChange={(e) => setClaimForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="mt-1"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Preferred Contact Method</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={claimForm.preferred_contact_method === 'email' ? 'default' : 'outline'}
                    onClick={() => setClaimForm(prev => ({ ...prev, preferred_contact_method: 'email' }))}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant={claimForm.preferred_contact_method === 'phone' ? 'default' : 'outline'}
                    onClick={() => setClaimForm(prev => ({ ...prev, preferred_contact_method: 'phone' }))}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Phone
                  </Button>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Upload Documents</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('documents')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Add Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('photos')?.click()}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Add Photos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('videos')?.click()}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Add Videos
                      </Button>
                    </div>
                    <input
                      id="documents"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'documents')}
                      className="hidden"
                    />
                    <input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'photos')}
                      className="hidden"
                    />
                    <input
                      id="videos"
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'videos')}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* File List */}
                {(claimForm.documents.length > 0 || claimForm.photos.length > 0 || claimForm.videos.length > 0) && (
                  <div className="space-y-2">
                    {claimForm.documents.map((file, index) => (
                      <div key={`doc-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('documents', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {claimForm.photos.map((file, index) => (
                      <div key={`photo-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('photos', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {claimForm.videos.map((file, index) => (
                      <div key={`video-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('videos', index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !claimForm.contact_email}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Claim'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && claimStatus && (
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Claim Submitted Successfully!</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Your claim has been submitted and is being reviewed. We&apos;ll contact you soon.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Claim ID:</span>
                  <Badge variant="outline">{claimStatus.id}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(claimStatus.status)}>
                    {getStatusIcon(claimStatus.status)}
                    <span className="ml-1 capitalize">{claimStatus.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated Timeline:</span>
                  <span className="text-sm">{claimStatus.estimated_timeline}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
