'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  DollarSign,
  BarChart3,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIState } from './UIStateContext';

interface BottomNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface BottomNavBarProps {
  stats?: {
    totalProducts: number;
    activeWarranties: number;
    pendingClaims: number;
    notifications: number;
  };
}

export default function BottomNavBar({ stats }: BottomNavBarProps) {
  const pathname = usePathname();
  const { isMobile } = useUIState();

  // Core navigation items for mobile
  const navigationItems: BottomNavItem[] = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      badge: stats?.totalProducts
    },
    {
      name: 'Quick Cash',
      href: '/quick-cash',
      icon: DollarSign
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3
    }
  ];

  // Check if item is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Don't render on desktop/tablet
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full relative transition-colors",
                  isActive(item.href)
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-6 w-6 mb-1",
                    isActive(item.href) ? "text-blue-600" : "text-gray-500"
                  )} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isActive(item.href) ? "text-blue-600" : "text-gray-500"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button for Add Product */}
      <Link
        href="/products/add"
        className={cn(
          "fixed bottom-20 right-4 z-50",
          "w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg",
          "flex items-center justify-center text-white hover:from-blue-700 hover:to-purple-700",
          "transition-all duration-200 hover:scale-110"
        )}
      >
        <Plus className="h-6 w-6" />
      </Link>

      {/* Bottom padding to prevent content from being hidden behind nav */}
      <div className="h-16" />
    </>
  );
}
