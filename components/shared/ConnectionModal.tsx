'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Chrome } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConnectionModalProps {
  /** Controls whether the modal is open or closed */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Optional title override for the modal */
  title?: string;
  /** Optional description override for the modal */
  description?: string;
}

/**
 * ConnectionModal - A secure authentication modal component
 * 
 * This component provides users with options to sign in via Google OAuth
 * or email/password authentication through Supabase Auth.
 * 
 * @param isOpen - Controls modal visibility
 * @param onClose - Function to call when modal should close
 * @param title - Optional custom title
 * @param description - Optional custom description
 */
export default function ConnectionModal({
  isOpen,
  onClose,
  title = "Connect to Your Vault",
  description = "Connect securely to create your vault. We will never post without your permission."
}: ConnectionModalProps) {
  // Initialize Supabase client for authentication
  const supabase = createClient();
  
  // State management for UI interactions
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Handle Google OAuth sign-in
   * Uses Supabase's signInWithOAuth method for secure authentication
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Initiate Google OAuth flow through Supabase
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect to current page after successful authentication
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign-in error:', error);
        setErrorMessage('Failed to sign in with Google. Please try again.');
      }
      // Note: On success, user will be redirected by Supabase
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle email/password form submission
   * Uses standard form submission with Supabase email auth
   */
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Attempt to sign in with email/password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If sign-in fails, try to sign up instead
        if (error.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (signUpError) {
            setErrorMessage(signUpError.message);
          } else {
            setErrorMessage('Check your email for a confirmation link.');
          }
        } else {
          setErrorMessage(error.message);
        }
      } else {
        // Success - modal will close via auth state change
        onClose();
      }
    } catch (error) {
      console.error('Email authentication error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset modal state when closing
   */
  const handleClose = () => {
    setShowEmailForm(false);
    setErrorMessage(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Error Message Display */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          {/* Google Sign-In Button - Primary CTA */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 shadow-sm"
            variant="outline"
          >
            <Chrome className="w-5 h-5 mr-3 text-blue-500" />
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>

          {/* Email Form Toggle or Form */}
          {!showEmailForm ? (
            <Button
              onClick={() => setShowEmailForm(true)}
              variant="ghost"
              className="w-full h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
              disabled={isLoading}
            >
              <Mail className="w-4 h-4 mr-2" />
              Continue with Email
            </Button>
          ) : (
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    variant="outline"
                    disabled={isLoading}
                    className="px-4 h-11 border-gray-300 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                </div>
              </form>

              <p className="text-xs text-gray-500 text-center leading-relaxed">
                New users will automatically create an account. 
                Check your email for a confirmation link.
              </p>
            </div>
          )}
        </div>

        {/* Trust Message */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Secure authentication powered by Supabase. Your data is encrypted and protected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}