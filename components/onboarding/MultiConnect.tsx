'use client';

import React, { useState, useEffect } from 'react';

import { 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Retailer connection status type
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

// Retailer data structure
interface Retailer {
  id: string;
  name: string;
  logo: string;
  region: string[];
  tier: 1 | 2;
  isAvailable: boolean;
}

// Hardcoded Tier 1 Retailers list
const TIER_1_RETAILERS: Retailer[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '/logos/amazon.svg',
    region: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'CA', 'AU', 'IN', 'JP'],
    tier: 1,
    isAvailable: true
  },
  {
    id: 'apple',
    name: 'Apple',
    logo: '/logos/apple.svg',
    region: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'CA', 'AU', 'IN', 'JP', 'CN'],
    tier: 1,
    isAvailable: false // TODO: Implement Apple OAuth
  },
  {
    id: 'walmart',
    name: 'Walmart',
    logo: '/logos/walmart.svg',
    region: ['US', 'CA', 'MX'],
    tier: 1,
    isAvailable: false // TODO: Implement Walmart OAuth
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: '/logos/flipkart.svg',
    region: ['IN'],
    tier: 1,
    isAvailable: false // TODO: Implement Flipkart OAuth
  },
  {
    id: 'johnlewis',
    name: 'John Lewis',
    logo: '/logos/johnlewis.svg',
    region: ['UK'],
    tier: 1,
    isAvailable: false // TODO: Implement John Lewis OAuth
  },
  {
    id: 'mediamarkt',
    name: 'MediaMarkt',
    logo: '/logos/mediamarkt.svg',
    region: ['DE', 'AT', 'CH', 'NL', 'BE', 'ES', 'IT'],
    tier: 1,
    isAvailable: false // TODO: Implement MediaMarkt OAuth
  },
  {
    id: 'bestbuy',
    name: 'Best Buy',
    logo: '/logos/bestbuy.svg',
    region: ['US', 'CA'],
    tier: 1,
    isAvailable: false // TODO: Implement Best Buy OAuth
  },
  {
    id: 'target',
    name: 'Target',
    logo: '/logos/target.svg',
    region: ['US'],
    tier: 1,
    isAvailable: false // TODO: Implement Target OAuth
  }
];

interface MultiConnectProps {
  onContinue?: () => void;
}

export default function MultiConnect({ onContinue }: MultiConnectProps) {
  const [connectionStates, setConnectionStates] = useState<Record<string, ConnectionStatus>>({});
  const [userLocation, setUserLocation] = useState<string>('US'); // Default to US
  const [sortedRetailers, setSortedRetailers] = useState<Retailer[]>(TIER_1_RETAILERS);

  // TODO: Implement geo-location logic to determine user's country
  useEffect(() => {
    const detectUserLocation = async () => {
      // TODO: Use IP geolocation service or browser geolocation API
      // For now, we'll use a placeholder that defaults to US
      try {
        // Placeholder for geo-location logic
        const detectedCountry = 'US'; // This would come from geolocation service
        setUserLocation(detectedCountry);
        
        // Re-sort retailers to prioritize local ones
        const localRetailers = TIER_1_RETAILERS.filter(retailer => 
          retailer.region.includes(detectedCountry)
        );
        const otherRetailers = TIER_1_RETAILERS.filter(retailer => 
          !retailer.region.includes(detectedCountry)
        );
        
        setSortedRetailers([...localRetailers, ...otherRetailers]);
      } catch (error) {
        console.error('Failed to detect user location:', error);
      }
    };

    detectUserLocation();
  }, []);

  // Check if any retailers are connected
  const hasConnectedRetailers = Object.values(connectionStates).some(
    status => status === 'connected'
  );

  // Handle retailer connection
  const handleRetailerConnect = async (retailer: Retailer) => {
    if (!retailer.isAvailable) {
      return;
    }

    setConnectionStates(prev => ({
      ...prev,
      [retailer.id]: 'connecting'
    }));

    try {
      if (retailer.id === 'amazon') {
        // Trigger Amazon OAuth flow
        await initiateAmazonOAuth();
      }
      // TODO: Add other retailer OAuth flows here
      
    } catch (error) {
      console.error(`Failed to connect to ${retailer.name}:`, error);
      setConnectionStates(prev => ({
        ...prev,
        [retailer.id]: 'error'
      }));
    }
  };

  // Amazon OAuth initiation
  const initiateAmazonOAuth = async () => {
    try {
      // Construct Amazon OAuth URL
      const clientId = process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/amazon/callback`);
      const scope = encodeURIComponent('profile');
      
      const amazonAuthUrl = `https://www.amazon.com/ap/oa?client_id=${clientId}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}`;
      
      // Open OAuth flow in popup or redirect
      window.location.href = amazonAuthUrl;
      
    } catch {
      throw new Error('Failed to initiate Amazon OAuth');
    }
  };




  // Get connection status for a retailer
  const getConnectionStatus = (retailerId: string): ConnectionStatus => {
    return connectionStates[retailerId] || 'idle';
  };

  // Render retailer card
  const renderRetailerCard = (retailer: Retailer) => {
    const status = getConnectionStatus(retailer.id);
    const isLocal = retailer.region.includes(userLocation);
    
    return (
      <Card
        key={retailer.id}
        className={`relative p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
          !retailer.isAvailable 
            ? 'opacity-50 cursor-not-allowed bg-gray-50' 
            : status === 'connected'
            ? 'bg-green-50 border-green-200 shadow-md'
            : 'hover:bg-gray-50 border-gray-200'
        }`}
        onClick={() => handleRetailerConnect(retailer)}
      >
        {/* Local retailer badge */}
        {isLocal && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              <MapPin className="w-3 h-3 mr-1" />
              Local
            </Badge>
          </div>
        )}

        {/* Connection status indicator */}
        {status === 'connected' && (
          <div className="absolute top-2 left-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        )}

        {status === 'connecting' && (
          <div className="absolute top-2 left-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        )}

        {/* Retailer logo and name */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 relative bg-white rounded-lg flex items-center justify-center border">
            {/* Placeholder for actual logos */}
            <div className="text-xs font-semibold text-gray-600 text-center px-2">
              {retailer.name}
            </div>
            {/* TODO: Replace with actual logo images */}
            {/* <Image
              src={retailer.logo}
              alt={`${retailer.name} logo`}
              width={48}
              height={48}
              className="object-contain"
            /> */}
          </div>
          
          <div className="text-center">
            <p className="font-medium text-gray-900 text-sm">
              {retailer.name}
            </p>
            {!retailer.isAvailable && (
              <p className="text-xs text-gray-500 mt-1">
                Coming Soon
              </p>
            )}
            {status === 'connected' && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                Connected ✓
              </p>
            )}
            {status === 'error' && (
              <p className="text-xs text-red-600 mt-1">
                Connection Failed
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Let&apos;s build your vault. Connect the places you shop.
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Connect your favorite retailers to automatically import your purchases and warranties. 
          We&apos;ll prioritize stores available in your region.
        </p>
      </div>

      {/* Location indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
          <MapPin className="w-4 h-4" />
          Showing retailers for {userLocation}
        </div>
      </div>

      {/* Retailer grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {sortedRetailers.map(renderRetailerCard)}
      </div>

      {/* Progress indicator */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Connected: {Object.values(connectionStates).filter(status => status === 'connected').length} retailers
        </p>
      </div>

      {/* Continue button */}
      <div className="flex justify-center">
        <Button
          onClick={onContinue}
          disabled={!hasConnectedRetailers}
          className="px-8 py-3 text-lg"
          size="lg"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Footer help text */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          Don&apos;t see your favorite store? We&apos;re adding new retailers regularly. 
          You can also add purchases manually after setup.
        </p>
      </div>
    </div>
  );
}