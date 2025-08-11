'use client';

import { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  targetValue: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ 
  targetValue, 
  duration = 2000,
  className = '' 
}: AnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = 0;

    // Easing function for smooth animation
    const easeOutQuart = (t: number): number => {
      return 1 - Math.pow(1 - t, 4);
    };

    const animateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing function
      const easedProgress = easeOutQuart(progress);
      const interpolatedValue = Math.round(startValue + (targetValue - startValue) * easedProgress);

      setCurrentValue(interpolatedValue);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animateValue);
  }, [targetValue, duration]);

  // Format number with commas for better readability
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <span className={`${className} ${isAnimating ? 'animate-pulse' : ''}`}>
      {formatNumber(currentValue)}
    </span>
  );
}