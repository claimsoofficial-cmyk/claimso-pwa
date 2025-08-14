'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Wrench, 
  Plus, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Phone, 
  ExternalLink,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product, MaintenanceRecord } from '@/lib/types/common';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

interface ServiceProvider {
  id: string;
  name: string;
  type: string;
  rating: number;
  distance: string;
  contact: string;
  website: string;
  services: string[];
  estimated_cost: string;
}

export default function MaintenanceModal({ isOpen, onClose, product }: MaintenanceModalProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'providers'>('records');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    service_date: '',
    service_type: 'routine' as MaintenanceRecord['service_type'],
    provider_name: '',
    provider_contact: '',
    cost: '',
    description: '',
    next_service_date: ''
  });

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && product) {
      fetchMaintenanceRecords();
      fetchServiceProviders();
    }
  }, [isOpen, product]);

  const fetchMaintenanceRecords = async () => {
    if (!product) return;
    
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('product_id', product.id)
        .order('service_date', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance records:', error);
        toast.error('Failed to load maintenance records');
      } else {
        setMaintenanceRecords(data || []);
      }
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      toast.error('Failed to load maintenance records');
    }
  };

  const fetchServiceProviders = async () => {
    if (!product) return;
    
    setIsLoading(true);
    try {
      // Mock service providers - in production, this would be a real API call
      const mockProviders: ServiceProvider[] = [
        {
          id: '1',
          name: 'TechCare Pro',
          type: 'Authorized Service Center',
          rating: 4.8,
          distance: '2.3 miles',
          contact: '(555) 123-4567',
          website: 'https://techcarepro.com',
          services: ['Repair', 'Maintenance', 'Upgrade'],
          estimated_cost: '$50-200'
        },
        {
          id: '2',
          name: 'QuickFix Mobile',
          type: 'Mobile Service',
          rating: 4.5,
          distance: '5.1 miles',
          contact: '(555) 987-6543',
          website: 'https://quickfixmobile.com',
          services: ['Repair', 'Cleaning', 'Inspection'],
          estimated_cost: '$75-300'
        },
        {
          id: '3',
          name: 'Premium Electronics Repair',
          type: 'Specialized Repair',
          rating: 4.9,
          distance: '8.7 miles',
          contact: '(555) 456-7890',
          website: 'https://premiumrepair.com',
          services: ['Repair', 'Upgrade', 'Data Recovery'],
          estimated_cost: '$100-500'
        }
      ];
      
      setServiceProviders(mockProviders);
    } catch (error) {
      console.error('Error fetching service providers:', error);
      toast.error('Failed to load service providers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!product) return;
    
    try {
      const newRecord: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'> = {
        product_id: product.id,
        service_date: formData.service_date,
        service_type: formData.service_type,
        provider_name: formData.provider_name,
        provider_contact: formData.provider_contact || undefined,
        cost: parseFloat(formData.cost) || 0,
        currency: 'USD',
        description: formData.description,
        next_service_date: formData.next_service_date || undefined
      };

      const { data, error } = await supabase
        .from('maintenance_records')
        .insert([newRecord])
        .select()
        .single();

      if (error) {
        console.error('Error adding maintenance record:', error);
        toast.error('Failed to add maintenance record');
      } else {
        setMaintenanceRecords([data, ...maintenanceRecords]);
        setShowAddForm(false);
        setFormData({
          service_date: '',
          service_type: 'routine',
          provider_name: '',
          provider_contact: '',
          cost: '',
          description: '',
          next_service_date: ''
        });
        toast.success('Maintenance record added successfully');
      }
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      toast.error('Failed to add maintenance record');
    }
  };

  const getServiceTypeColor = (type: MaintenanceRecord['service_type']) => {
    switch (type) {
      case 'routine': return 'bg-blue-100 text-blue-800';
      case 'repair': return 'bg-red-100 text-red-800';
      case 'upgrade': return 'bg-green-100 text-green-800';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800';
      case 'inspection': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Maintenance & Service - {product.product_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'records' ? 'default' : 'outline'}
            onClick={() => setActiveTab('records')}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Maintenance Records
          </Button>
          <Button
            variant={activeTab === 'providers' ? 'default' : 'outline'}
            onClick={() => setActiveTab('providers')}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Find Service Providers
          </Button>
        </div>

        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Maintenance History</h3>
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </Button>
            </div>

            {showAddForm && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">Add Maintenance Record</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service_date">Service Date</Label>
                      <Input
                        id="service_date"
                        type="date"
                        value={formData.service_date}
                        onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_type">Service Type</Label>
                      <select
                        id="service_type"
                        value={formData.service_type}
                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value as MaintenanceRecord['service_type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="routine">Routine Maintenance</option>
                        <option value="repair">Repair</option>
                        <option value="upgrade">Upgrade</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="inspection">Inspection</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="provider_name">Service Provider</Label>
                      <Input
                        id="provider_name"
                        value={formData.provider_name}
                        onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                        placeholder="Provider name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="provider_contact">Contact Info</Label>
                      <Input
                        id="provider_contact"
                        value={formData.provider_contact}
                        onChange={(e) => setFormData({ ...formData, provider_contact: e.target.value })}
                        placeholder="Phone or email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost</Label>
                      <Input
                        id="cost"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="next_service_date">Next Service Date</Label>
                      <Input
                        id="next_service_date"
                        type="date"
                        value={formData.next_service_date}
                        onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the service performed..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddRecord} className="flex-1">
                      Save Record
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {maintenanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance records yet</h3>
                  <p className="text-gray-500">Start tracking your device maintenance to keep it in top condition.</p>
                </div>
              ) : (
                maintenanceRecords.map((record) => (
                  <Card key={record.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getServiceTypeColor(record.service_type)}>
                              {record.service_type.charAt(0).toUpperCase() + record.service_type.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(record.service_date)}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900">{record.provider_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                          {record.provider_contact && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {record.provider_contact}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${record.cost.toFixed(2)}
                          </p>
                          {record.next_service_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Next: {formatDate(record.next_service_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'providers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Service Providers Near You</h3>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="all">All Services</option>
                  <option value="repair">Repair</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="upgrade">Upgrade</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Finding service providers...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {serviceProviders.map((provider) => (
                  <Card key={provider.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{provider.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {provider.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {provider.rating} stars
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {provider.distance}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {provider.estimated_cost}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {provider.services.map((service) => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {provider.contact}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => window.open(provider.website, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Visit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${provider.contact}`, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
