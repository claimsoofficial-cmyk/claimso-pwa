'use client';

import React from 'react';
import { useUIState } from './UIStateContext';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isSidebarOpen, isMobile, isTablet, isDesktop } = useUIState();

  return (
    <main className={cn(
      "min-h-[calc(100vh-4rem)] bg-gray-50 transition-all duration-300 ease-in-out",
      // Dynamic width based on sidebar state
      isMobile 
        ? "w-full ml-0" // Full width on mobile (no sidebar)
        : isTablet
        ? isSidebarOpen 
          ? "ml-64 w-[calc(100%-16rem)]" // Sidebar open on tablet
          : "ml-16 w-[calc(100%-4rem)]"  // Sidebar collapsed on tablet
        : isDesktop
        ? isSidebarOpen 
          ? "ml-64 w-[calc(100%-16rem)]" // Sidebar open on desktop
          : "ml-16 w-[calc(100%-4rem)]"  // Sidebar collapsed on desktop
        : "w-full ml-0" // Fallback
    )}>
      <div className="p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </main>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
