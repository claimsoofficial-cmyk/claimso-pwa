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
  Bell
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
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Show/hide based on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else {
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
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="bg-white border-t border-gray-200 px-4 py-2">
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
                      "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors relative",
                      active 
                        ? "text-blue-600 bg-blue-50" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn("w-5 h-5", active && "text-blue-600")} />
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs mt-1 font-medium",
                      active ? "text-blue-600" : "text-gray-600"
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
                size="sm"
                className="w-10 h-10 p-0 rounded-full"
                onClick={() => {
                  // Trigger search modal or focus search input
                  const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 rounded-full relative"
                onClick={() => {
                  // Open notifications panel
                  console.log('Open notifications');
                }}
              >
                <Bell className="w-4 h-4" />
                {stats?.notifications && stats.notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {stats.notifications > 9 ? '9+' : stats.notifications}
                  </Badge>
                )}
              </Button>

              {/* Add Button */}
              <Button
                size="sm"
                className="w-10 h-10 p-0 rounded-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Open add product modal or navigate to add page
                  window.location.href = '/products/add';
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Safe Area Spacer for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white"></div>
      </div>

      {/* Bottom Spacer to prevent content from being hidden */}
      <div className="h-20 lg:hidden"></div>
    </>
  );
}
