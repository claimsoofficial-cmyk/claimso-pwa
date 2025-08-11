'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface CredentialConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  retailerName: string;
  onConnect: (credentials: { username: string; password: string }) => Promise<void>;
}

const RETAILER_LOGOS: Record<string, string> = {
  walmart: '/logos/walmart.png',
  target: '/logos/target.png',
  bestbuy: '/logos/bestbuy.png',
  // Add more retailer logos as needed
};

export default function CredentialConnectModal({
  isOpen,
  onClose,
  retailerName,
  onConnect
}: CredentialConnectModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await onConnect({ username: username.trim(), password });
      // Reset form on success
      setUsername('');
      setPassword('');
      setShowPassword(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (isConnecting) return; // Prevent closing while connecting
    
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setError(null);
    onClose();
  };

  const retailerDisplayName = retailerName.charAt(0).toUpperCase() + retailerName.slice(1);
  const logoSrc = RETAILER_LOGOS[retailerName.toLowerCase()] || '/logos/default.png';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={logoSrc}
                alt={`${retailerDisplayName} logo`}
                fill
                className="object-contain rounded-lg"
              />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Connect to {retailerDisplayName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Enter your {retailerDisplayName} account credentials to import your purchase history.
          </DialogDescription>
        </DialogHeader>

        {/* Security Disclaimer */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm font-medium text-blue-800 dark:text-blue-200">
            For your security, these credentials are sent directly to our secure server for a one-time import and are NEVER stored.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Email / Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`Enter your ${retailerDisplayName} username or email`}
              disabled={isConnecting}
              className="w-full"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isConnecting}
                className="w-full pr-10"
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isConnecting}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isConnecting || !username.trim() || !password.trim()}
              className="min-w-[100px]"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}