'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  Search, 
  Bell, 
  User,
  Package,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUIState } from './UIStateContext';
import SearchModal from '../search/SearchModal';

interface HeaderProps {
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
  stats?: {
    totalProducts: number;
    activeWarranties: number;
    pendingClaims: number;
    notifications: number;
  };
}

export default function Header({ user, profile, stats }: HeaderProps) {
  const { isSidebarOpen, toggleSidebar, isMobile, isTablet, isDesktop } = useUIState();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Get user display information
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const userInitials = displayName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <>
      {/* Fixed Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Left Section: Sidebar Toggle + Logo */}
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle (Desktop/Tablet) */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 rounded-lg hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              {isDesktop && (
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Claimso
                </h1>
              )}
            </Link>
          </div>

          {/* Center Section: Search (Desktop) */}
          {isDesktop && (
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, brands, or categories..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  onClick={() => setIsSearchModalOpen(true)}
                  readOnly
                />
              </div>
            </div>
          )}

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2">
            {/* Search Icon (Mobile/Tablet) */}
            {(isMobile || isTablet) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchModalOpen(true)}
                className="h-9 w-9 rounded-lg hover:bg-gray-100"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-gray-100 relative"
            >
              <Bell className="h-5 w-5" />
              {stats?.notifications && stats.notifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {stats.notifications > 9 ? '9+' : stats.notifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="h-9 w-9 rounded-lg hover:bg-gray-100"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Link
                    href="/settings/account"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <Link
                    href="/settings/notifications"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                  <hr className="my-1" />
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      // Handle sign out
                      setIsUserMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />
    </>
  );
}
