'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import AmazonConnectButton from '@/components/shared/AmazonConnectButton';
import { toast } from 'sonner';

interface RetailerConnectProps {
  onProductsImported?: (count: number) => void;
  userId?: string;
}

interface Retailer {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  status: 'available' | 'connected' | 'unavailable';
  connectUrl?: string;
}

const retailers: Retailer[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    icon: ShoppingCart,
    description: 'Import your Amazon order history',
    status: 'available',
    connectUrl: '/api/auth/amazon/auth'
  },
  {
    id: 'walmart',
    name: 'Walmart',
    icon: ShoppingCart,
    description: 'Import your Walmart purchases',
    status: 'unavailable'
  },
  {
    id: 'bestbuy',
    name: 'Best Buy',
    icon: ShoppingCart,
    description: 'Import your Best Buy purchases',
    status: 'unavailable'
  },
  {
    id: 'target',
    name: 'Target',
    icon: ShoppingCart,
    description: 'Import your Target purchases',
    status: 'unavailable'
  }
];

export default function RetailerConnect({ onProductsImported, userId }: RetailerConnectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedRetailers, setConnectedRetailers] = useState<string[]>([]);

  const handleAmazonConnect = async () => {
    setIsConnecting(true);
    try {
      // This will be handled by the AmazonConnectButton component
      toast.success('Amazon connection initiated');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Amazon connection error:', error);
      toast.error('Failed to connect to Amazon');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCredentialConnect = async (retailerId: string) => {
    setIsConnecting(true);
    try {
      // For now, show a message that this is coming soon
      toast.info(`${retailers.find(r => r.id === retailerId)?.name} connection coming soon!`);
    } catch (error) {
      console.error('Credential connection error:', error);
      toast.error('Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Connect Retailer
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Connect Retailer Account
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your retailer accounts to automatically import your purchase history and warranties.
          </p>
          
          <div className="space-y-3">
            {retailers.map((retailer) => {
              const Icon = retailer.icon;
              const isConnected = connectedRetailers.includes(retailer.id);
              
              return (
                <Card 
                  key={retailer.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    retailer.status === 'unavailable' ? 'opacity-50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{retailer.name}</h3>
                          <p className="text-sm text-gray-500">{retailer.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <Badge variant="default" className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        ) : retailer.status === 'available' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCredentialConnect(retailer.id)}
                            disabled={isConnecting}
                          >
                            {isConnecting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ExternalLink className="w-4 h-4" />
                            )}
                          </Button>
                        ) : (
                          <Badge variant="secondary">Coming Soon</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
                     {/* Special Amazon Connect Button */}
           <div className="pt-4 border-t">
             {userId ? (
               <AmazonConnectButton
                 userId={userId}
                 variant="default"
                 size="default"
                 className="w-full"
               >
                 <ShoppingCart className="w-4 h-4 mr-2" />
                 Connect Amazon Account
               </AmazonConnectButton>
             ) : (
               <Button
                 variant="outline"
                 size="default"
                 className="w-full"
                 disabled
               >
                 <ShoppingCart className="w-4 h-4 mr-2" />
                 Connect Amazon Account
               </Button>
             )}
           </div>
          
          <div className="text-xs text-gray-500 text-center">
            We only import your order history and never store your login credentials.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
