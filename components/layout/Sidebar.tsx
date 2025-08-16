'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  Shield, 
  DollarSign,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIState } from './UIStateContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

interface SidebarProps {
  stats?: {
    totalProducts: number;
    activeWarranties: number;
    pendingClaims: number;
    notifications: number;
  };
}

export default function Sidebar({ stats }: SidebarProps) {
  const pathname = usePathname();
  const { isSidebarOpen, isMobile, isTablet, isDesktop } = useUIState();

  // Navigation items
  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview of your products'
    },
    {
      name: 'My Products',
      href: '/products',
      icon: Package,
      badge: stats?.totalProducts,
      description: 'Manage your product collection'
    },
    {
      name: 'Warranties',
      href: '/warranties',
      icon: Shield,
      badge: stats?.activeWarranties,
      description: 'Track warranty coverage'
    },
    {
      name: 'Quick Cash',
      href: '/quick-cash',
      icon: DollarSign,
      description: 'Get cash for your products'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Product insights and trends'
    },
    {
      name: 'Claims',
      href: '/claims',
      icon: FileText,
      badge: stats?.pendingClaims,
      description: 'Warranty claims and tracking'
    },
    {
      name: 'Partners',
      href: '/partners',
      icon: Users,
      description: 'Partner network and offers'
    },
    {
      name: 'Market Trends',
      href: '/market-trends',
      icon: TrendingUp,
      description: 'Product value insights'
    }
  ];

  // Check if item is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Don't render sidebar on mobile (replaced by bottom navigation)
  if (isMobile) {
    return null;
  }

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
      "fixed top-16 left-0 h-[calc(100vh-4rem)] z-40",
      isSidebarOpen 
        ? "w-64 translate-x-0" 
        : "w-16 -translate-x-0",
      isTablet && !isSidebarOpen && "translate-x-0 w-16"
    )}>
      <div className="flex flex-col h-full">
        {/* Add Product Button */}
        <div className="p-4 border-b border-gray-100">
          <Link
            href="/products/add"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700",
              !isSidebarOpen && "justify-center px-2"
            )}
          >
            <Plus className="h-5 w-5" />
            {isSidebarOpen && <span className="font-medium">Add Product</span>}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative",
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive(item.href) ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
                
                {isSidebarOpen && (
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                    {item.description && (
                      <div className="text-xs text-gray-300 mt-1 max-w-48">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings Section */}
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              isActive('/settings')
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
              !isSidebarOpen && "justify-center px-2"
            )}
          >
            <Settings className="h-5 w-5" />
            {isSidebarOpen && <span className="font-medium">Settings</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}
