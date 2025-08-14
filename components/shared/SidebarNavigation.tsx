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
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  User,
  Bell,
  HelpCircle,
  Zap,
  DollarSign,
  Calendar,
  Archive
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
  children?: NavigationItem[];
}

export default function SidebarNavigation({ user, profile, stats }: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));
  const pathname = usePathname();

  // Get user display information
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const userInitials = displayName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  // Navigation structure
  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      badge: stats?.totalProducts,
      children: [
        { name: 'All Products', href: '/products', icon: Package },
        { name: 'Add Product', href: '/products/add', icon: Plus },
        { name: 'Archived', href: '/products/archived', icon: Archive },
      ]
    },
    {
      name: 'Warranties',
      href: '/warranties',
      icon: Shield,
      badge: stats?.activeWarranties,
      children: [
        { name: 'Active Warranties', href: '/warranties', icon: Shield },
        { name: 'Expired', href: '/warranties/expired', icon: Calendar },
        { name: 'Extended Coverage', href: '/warranties/extended', icon: Zap },
      ]
    },
    {
      name: 'Claims',
      href: '/claims',
      icon: FileText,
      badge: stats?.pendingClaims,
      children: [
        { name: 'Active Claims', href: '/claims', icon: FileText },
        { name: 'New Claim', href: '/claims/new', icon: Plus },
        { name: 'History', href: '/claims/history', icon: Archive },
      ]
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      children: [
        { name: 'Overview', href: '/analytics', icon: BarChart3 },
        { name: 'Spending Trends', href: '/analytics/spending', icon: DollarSign },
        { name: 'Warranty Coverage', href: '/analytics/warranties', icon: Shield },
      ]
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      children: [
        { name: 'Account', href: '/settings/account', icon: User },
        { name: 'Notifications', href: '/settings/notifications', icon: Bell },
        { name: 'Connections', href: '/settings/connections', icon: Zap },
      ]
    },
  ];

  // Use all navigation items (search is now handled by SearchBar component)
  const filteredNavigation = navigationItems;

  // Toggle section expansion
  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

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

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(item.name);
    const active = isActive(item.href);

    return (
      <div key={item.name}>
        <Link
          href={item.href}
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            active && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
            level > 0 && "ml-4"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.name);
            }
            if (isMobileOpen) {
              setIsMobileOpen(false);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <Icon className={cn("h-4 w-4", active && "text-blue-600")} />
            <span className={cn(isCollapsed && "hidden")}>{item.name}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
            {hasChildren && !isCollapsed && (
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "rotate-180"
              )} />
            )}
          </div>
        </Link>

        {/* Render children */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden sidebar-mobile",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Claimso</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto p-4">
                         <SidebarContent
               user={user}
               profile={profile}
               stats={stats}
               displayName={displayName}
               avatarUrl={avatarUrl}
               userInitials={userInitials}
               filteredNavigation={filteredNavigation}
               renderNavigationItem={renderNavigationItem}
               expandedSections={expandedSections}
               toggleSection={toggleSection}
               isCollapsed={false}
             />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        isCollapsed && "lg:w-16"
      )}>
        <div className="flex flex-col h-full">
          {/* Desktop Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold text-gray-900 dark:text-white">Claimso</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto p-4">
                         <SidebarContent
               user={user}
               profile={profile}
               stats={stats}
               displayName={displayName}
               avatarUrl={avatarUrl}
               userInitials={userInitials}
               filteredNavigation={filteredNavigation}
               renderNavigationItem={renderNavigationItem}
               expandedSections={expandedSections}
               toggleSection={toggleSection}
               isCollapsed={isCollapsed}
             />
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  );
}

// Sidebar content component to avoid code duplication
function SidebarContent({
  user,
  profile,
  stats,
  displayName,
  avatarUrl,
  userInitials,
  filteredNavigation,
  renderNavigationItem,
  expandedSections,
  toggleSection,
  isCollapsed
}: {
  user: any;
  profile: any;
  stats: any;
  displayName: string;
  avatarUrl: string | undefined;
  userInitials: string;
  filteredNavigation: NavigationItem[];
  renderNavigationItem: (item: NavigationItem, level?: number) => React.ReactNode;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  isCollapsed: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Search */}
      {!isCollapsed && (
        <div className="space-y-2">
          <SearchBar />
        </div>
      )}

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
          <div className="space-y-1">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              New Claim
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <HelpCircle className="h-4 w-4 mr-2" />
              Get Help
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="space-y-2">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
        )}
        <div className="space-y-1">
          {filteredNavigation.map(item => renderNavigationItem(item))}
        </div>
      </div>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
            {stats?.notifications && (
              <Badge variant="destructive" className="text-xs">
                {stats.notifications}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
