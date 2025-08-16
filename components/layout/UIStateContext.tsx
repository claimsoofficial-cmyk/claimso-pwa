'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilters: Record<string, any>;
  setActiveFilters: (filters: Record<string, any>) => void;
}

const UIStateContext = createContext<UIState | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Load initial state from localStorage, default to true for desktop
    if (typeof window !== 'undefined' && window.innerWidth > 1024) {
      return localStorage.getItem('sidebarOpen') === 'true' || true;
    }
    return false; // Default closed for smaller screens
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
      
      // Auto-close sidebar on mobile/tablet
      if (width < 1024 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  useEffect(() => {
    // Only persist sidebar state for desktop
    if (isDesktop) {
      localStorage.setItem('sidebarOpen', String(isSidebarOpen));
    }
  }, [isSidebarOpen, isDesktop]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const value = { 
    isSidebarOpen, 
    toggleSidebar, 
    viewMode, 
    setViewMode, 
    isMobile, 
    isTablet, 
    isDesktop,
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters
  };

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};
