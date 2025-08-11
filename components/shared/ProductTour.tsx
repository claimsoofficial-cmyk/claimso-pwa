'use client';

import { useEffect } from 'react';
import { useProductTour } from '@/lib/hooks/useProductTour';

/**
 * ProductTour Component
 * 
 * Manages the lifecycle of the welcome tour for first-time users.
 * This component renders nothing but handles tour initialization
 * and completion tracking using localStorage.
 */
export default function ProductTour() {
  const { startTour } = useProductTour();

  useEffect(() => {
    // Check if user has already completed the tour
    const hasCompletedTour = localStorage.getItem('hasCompletedTour');
    
    // Only start tour for first-time visitors
    if (!hasCompletedTour) {
      // Small delay to ensure DOM elements are rendered
      const timeoutId = setTimeout(() => {
        // Verify the first target element exists before starting tour
        const firstElement = document.querySelector('#product-card-0');
        if (firstElement) {
          startTour();
        }
      }, 500);

      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId);
    }
  }, [startTour]);

  // This component renders nothing - it only manages tour lifecycle
  return null;
}