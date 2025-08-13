import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { Settings, LogOut, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

interface AuthenticatedNavbarProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  profile?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
}

// ==============================================================================
// SERVER ACTIONS
// ==============================================================================

/**
 * Server action to securely log out the user
 * This function signs out the user and redirects to homepage
 */
async function logoutAction() {
  'use server';
  
  const cookieStore = await cookies();
  
  // Create server-side Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Sign out the user
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    // Even if there's an error, we'll redirect to ensure security
  }
  
  // Redirect to homepage
  redirect('/');
}

// ==============================================================================
// AUTHENTICATED NAVBAR COMPONENT
// ==============================================================================

/**
 * AuthenticatedNavbar - Shared navigation component for authenticated pages
 * 
 * Features:
 * - CLAIMSO logo
 * - User avatar with dropdown menu
 * - Settings link
 * - Secure logout functionality
 */
export default function AuthenticatedNavbar({ user, profile }: AuthenticatedNavbarProps) {
  // Get user display information
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const userInitials = displayName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">
                CLAIMSO
              </span>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {/* User Info */}
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm text-gray-900">
                      {displayName}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-600">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Census */}
                <DropdownMenuItem asChild>
                  <a href="/census" className="cursor-pointer flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Census</span>
                  </a>
                </DropdownMenuItem>
                
                {/* Settings */}
                <DropdownMenuItem asChild>
                  <a href="/settings/account" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Logout */}
                <form action={logoutAction}>
                  <DropdownMenuItem asChild>
                    <button 
                      type="submit" 
                      className="w-full flex items-center cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}