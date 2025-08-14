'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  Shield, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  Menu,
  X,
  User,
  Bell,
  HelpCircle,
  Zap,
  DollarSign,
  Calendar,
  Archive,
  Search,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';

interface SidebarNavigationProps {
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

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

export default function SidebarNavigation({ user, profile, stats }: SidebarNavigationProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Get user display information
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const userInitials = displayName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  // Simplified navigation - only functional pages
  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview of your products and warranties'
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      badge: stats?.totalProducts,
      description: 'Manage your product inventory'
    },
    {
      name: 'Warranties',
      href: '/warranties',
      icon: Shield,
      badge: stats?.activeWarranties,
      description: 'Track warranty coverage and expiration'
    },
    {
      name: 'Claims',
      href: '/claims',
      icon: FileText,
      badge: stats?.pendingClaims,
      description: 'File and track warranty claims'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'View spending and coverage insights'
    },
    {
      name: 'Settings',
      href: '/settings/account',
      icon: Settings,
      description: 'Manage your account and preferences'
    },
  ];

  // Check if item is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileOpen && !target.closest('.sidebar-mobile')) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 transform transition-all duration-300 ease-out lg:hidden sidebar-mobile",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Claimso
                </h1>
                <p className="text-xs text-gray-500">Smart Warranty Management</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <SidebarContent
              user={user}
              profile={profile}
              stats={stats}
              displayName={displayName}
              avatarUrl={avatarUrl}
              userInitials={userInitials}
              navigationItems={navigationItems}
              isActive={isActive}
              isMobile={true}
            />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:z-40 bg-white/95 backdrop-blur-xl border-r border-gray-200/50">
        <div className="flex flex-col h-full">
          {/* Desktop Header */}
          <div className="flex items-center gap-3 p-6 border-b border-gray-200/50">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Claimso
              </h1>
              <p className="text-xs text-gray-500">Smart Warranty Management</p>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <SidebarContent
              user={user}
              profile={profile}
              stats={stats}
              displayName={displayName}
              avatarUrl={avatarUrl}
              userInitials={userInitials}
              navigationItems={navigationItems}
              isActive={isActive}
              isMobile={false}
            />
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  );
}

// Sidebar content component
function SidebarContent({
  user,
  profile,
  stats,
  displayName,
  avatarUrl,
  userInitials,
  navigationItems,
  isActive,
  isMobile
}: {
  user: any;
  profile: any;
  stats: any;
  displayName: string;
  avatarUrl: string | undefined;
  userInitials: string;
  navigationItems: NavigationItem[];
  isActive: (href: string) => boolean;
  isMobile: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</h3>
        <SearchBar />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
        <div className="space-y-2">
          <Button 
            variant="gradient" 
            size="sm" 
            className="w-full justify-start shadow-md"
            onClick={() => window.location.href = '/products/add'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => window.location.href = '/claims/new'}
          >
            <FileText className="h-4 w-4 mr-2" />
            New Claim
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => window.location.href = '/help'}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Get Help
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  "hover:bg-gray-100/80 hover:shadow-sm",
                  active 
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border border-blue-200/50" 
                    : "text-gray-700 hover:text-gray-900"
                )}
                title={item.description}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  active 
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md" 
                    : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-700"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </div>
                  {isMobile && item.description && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  active ? "text-blue-500 rotate-90" : "text-gray-400 group-hover:text-gray-600"
                )} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="pt-6 border-t border-gray-200/50">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100/80 transition-colors cursor-pointer">
          <Avatar className="h-10 w-10 ring-2 ring-gray-200/50">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>
          {stats?.notifications && stats.notifications > 0 && (
            <Badge variant="destructive" className="text-xs">
              {stats.notifications > 9 ? '9+' : stats.notifications}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
