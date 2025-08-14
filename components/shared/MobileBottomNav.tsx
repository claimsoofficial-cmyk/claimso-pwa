'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Package, 
  Shield, 
  BarChart3, 
  Plus,
  Search,
  Bell,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  stats?: {
    totalProducts: number;
    activeWarranties: number;
    pendingClaims: number;
    notifications: number;
  };
}

export default function MobileBottomNav({ stats }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Show/hide based on scroll direction with improved logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 100;
      
      // Always show when at top or scrolling up
      if (currentScrollY < scrollThreshold || currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        // Hide when scrolling down and not at top
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Home',
      badge: undefined
    },
    {
      href: '/products',
      icon: Package,
      label: 'Products',
      badge: stats?.totalProducts
    },
    {
      href: '/warranties',
      icon: Shield,
      label: 'Warranties',
      badge: stats?.activeWarranties
    },
    {
      href: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      badge: undefined
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-4 py-3 safe-area-bottom">
          <div className="flex items-center justify-between">
            {/* Navigation Items */}
            <div className="flex items-center justify-around flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 relative group",
                      active 
                        ? "text-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
                    )}
                  >
                    <div className="relative">
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        active 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md" 
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-700"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center bg-red-500 text-white border-2 border-white"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs mt-1 font-medium transition-colors",
                      active ? "text-blue-600" : "text-gray-600 group-hover:text-gray-900"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 ml-4">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                onClick={() => {
                  // Trigger search modal or focus search input
                  const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 relative"
                onClick={() => {
                  // Open notifications panel
                  window.location.href = '/notifications';
                }}
              >
                <Bell className="w-5 h-5" />
                {stats?.notifications && stats.notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center border-2 border-white"
                  >
                    {stats.notifications > 9 ? '9+' : stats.notifications}
                  </Badge>
                )}
              </Button>

              {/* Add Button */}
              <Button
                size="icon"
                variant="gradient"
                className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  // Open add product modal or navigate to add page
                  window.location.href = '/products/add';
                }}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Safe Area Spacer for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white/95 backdrop-blur-xl"></div>
      </div>

      {/* Bottom Spacer to prevent content from being hidden */}
      <div className="h-24 lg:hidden"></div>
    </>
  );
}
