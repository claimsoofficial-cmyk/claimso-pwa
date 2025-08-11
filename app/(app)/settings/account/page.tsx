'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

import type { User } from '@supabase/supabase-js';

import { 
  User as UserIcon, 
  Download, 
  AlertTriangle,
  Save,
  Loader2
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { 
  updateUserProfile, 
  exportUserData, 
  deleteUserAccount 
} from '@/lib/actions/user-actions';

export default function AccountSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [isUpdatingProfile, startUpdateTransition] = useTransition();
  const [isExportingData, startExportTransition] = useTransition();
  const [isDeletingAccount, startDeleteTransition] = useTransition();
  const supabase = createClient();


  // Get user on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Get user profile data
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setFullName(profile.full_name || '');
        }
      }
      
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setFullName('');
        } else if (session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle profile update
const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  if (!fullName.trim()) {
    toast.error("Name cannot be empty");
    return; // Stop the function here
  }

  startUpdateTransition(async () => {
    const formData = new FormData();
    formData.append('full_name', fullName.trim());
    
    const result = await updateUserProfile(formData);
    
    if (result.success) {
      toast.success("Profile Updated", {
        description: "Your name has been updated successfully."
      });
    } else {
      toast.error("Update Failed", {
        description: result.error || "Please try again.",
      });
    }
  });
};

 // Handle data export
const handleDataExport = () => {
  startExportTransition(async () => {
    const result = await exportUserData();
    
    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `claimso-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Data Exported", {
        description: "Your account data has been successfully downloaded."
      });
    } else {
      toast.error("Export Failed", {
        description: result.error || "Please try again.",
      });
    }
  });
};

// Handle account deletion
const handleAccountDeletion = () => {
  if (window.confirm("Are you absolutely sure? This will permanently delete all your data and cannot be undone.")) {
    const finalConfirmation = window.prompt("To confirm, please type 'DELETE' in all capital letters.");
    
    if (finalConfirmation === 'DELETE') {
      startDeleteTransition(async () => {
        const result = await deleteUserAccount();
        if (result?.error) {
          toast.error("Deletion Failed", {
            description: result.error,
          });
        }
        // No success toast is needed as the page will redirect
      });
    } else {
      toast.info("Account deletion cancelled.");
    }
  }
};

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading account settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access account settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">
          Manage your account information, export your data, or delete your account.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Update your account information and preferences.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileUpdate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Email address cannot be changed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={isUpdatingProfile}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isUpdatingProfile || !fullName.trim()}
              className="w-full sm:w-auto"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export all your account data including products, warranties, and documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Download a complete backup of your account data in JSON format. This includes 
            your profile, products, warranties, and document metadata.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleDataExport}
            disabled={isExportingData}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isExportingData ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting Data...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export My Data
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone Section */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600">
            Irreversible actions that will permanently affect your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-700 mb-2">Delete Account</h4>
              <p className="text-sm text-gray-700 mb-4">
                Permanently delete your account and all associated data. This action 
                cannot be undone and will remove all your products, warranties, 
                documents, and account information.
              </p>
              <ul className="text-xs text-gray-600 space-y-1 mb-4">
                <li>• All product information will be deleted</li>
                <li>• All warranty data will be permanently removed</li>
                <li>• All uploaded documents will be deleted</li>
                <li>• Your account cannot be recovered</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAccountDeletion}
            disabled={isDeletingAccount}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {isDeletingAccount ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting Account...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete My Account
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}