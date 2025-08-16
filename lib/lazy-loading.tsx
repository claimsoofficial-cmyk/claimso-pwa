import React, { Suspense, lazy, ComponentType } from 'react';
import LoadingState from '@/components/shared/LoadingState';

// Lazy loading wrapper with error boundary and loading state
interface LazyComponentProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

// Error boundary component for lazy loaded components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const ErrorFallback = this.props.fallback;
      return <ErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.ComponentType<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-red-600 text-lg font-semibold mb-2">Something went wrong</div>
    <div className="text-red-500 text-sm mb-4 text-center">{error.message}</div>
    <button
      onClick={retry}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

// Create lazy component with error boundary and loading state
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyComponentProps = {}
) {
  const LazyComponent = lazy(importFunc);
  const { fallback = <LoadingState />, errorFallback = DefaultErrorFallback } = options;

  return React.forwardRef<React.ComponentRef<T>, React.ComponentProps<T>>((props, ref) => (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    </LazyErrorBoundary>
  ));
}

// Preload function for prefetching components
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return () => {
    importFunc();
  };
}

// Lazy loaded components
export const LazyDashboard = createLazyComponent(() => import('@/app/(app)/dashboard/page'));
export const LazyProducts = createLazyComponent(() => import('@/app/(app)/products/page'));
export const LazyProductDetail = createLazyComponent(() => import('@/app/(app)/products/page'));
export const LazySettings = createLazyComponent(() => import('@/app/(app)/settings/account/page'));
export const LazyAdmin = createLazyComponent(() => import('@/app/(app)/admin/data-dashboard/page'));

// Modal components
export const LazyEditProductModal = createLazyComponent(() => import('@/components/domain/products/EditProductModal'));
export const LazyClaimFilingModal = createLazyComponent(() => import('@/components/domain/products/ClaimFilingModal'));
export const LazyMaintenanceModal = createLazyComponent(() => import('@/components/domain/products/MaintenanceModal'));
export const LazyQuickCashModal = createLazyComponent(() => import('@/components/domain/products/QuickCashModal'));
export const LazyWarrantyDatabaseModal = createLazyComponent(() => import('@/components/domain/products/WarrantyDatabaseModal'));

// Complex components
export const LazyAgentDashboard = createLazyComponent(() => import('@/components/shared/AgentDashboard'));
export const LazyProductTour = createLazyComponent(() => import('@/components/shared/ProductTour'));
export const LazySearchModal = createLazyComponent(() => import('@/components/search/SearchModal'));

// Preload functions for critical components
export const preloadDashboard = preloadComponent(() => import('@/app/(app)/dashboard/page'));
export const preloadProducts = preloadComponent(() => import('@/app/(app)/products/page'));
export const preloadSettings = preloadComponent(() => import('@/app/(app)/settings/account/page'));

// Route-based code splitting
export const routeComponents = {
  dashboard: () => import('@/app/(app)/dashboard/page'),
  products: () => import('@/app/(app)/products/page'),
  productDetail: () => import('@/app/(app)/products/page'),
  settings: () => import('@/app/(app)/settings/account/page'),
  admin: () => import('@/app/(app)/admin/data-dashboard/page'),
  cart: () => import('@/app/(app)/cart/page'),
  share: () => import('@/app/(app)/share/product/[productId]/page'),
} as const;

// Dynamic import with retry logic
export async function dynamicImport<T>(
  importFunc: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await importFunc();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Import attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
}

// Performance monitoring for lazy loading
export const useLazyLoadingPerformance = () => {
  const [metrics, setMetrics] = React.useState({
    loadTimes: [] as number[],
    averageLoadTime: 0,
    totalLoads: 0,
    failedLoads: 0,
  });

  const recordLoad = React.useCallback((loadTime: number, success: boolean) => {
    setMetrics(prev => {
      const newLoadTimes = success ? [...prev.loadTimes, loadTime] : prev.loadTimes;
      const newTotalLoads = prev.totalLoads + 1;
      const newFailedLoads = success ? prev.failedLoads : prev.failedLoads + 1;
      
      return {
        loadTimes: newLoadTimes,
        averageLoadTime: newLoadTimes.length > 0 
          ? newLoadTimes.reduce((sum, time) => sum + time, 0) / newLoadTimes.length 
          : 0,
        totalLoads: newTotalLoads,
        failedLoads: newFailedLoads,
      };
    });
  }, []);

  return { metrics, recordLoad };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [ref, setRef] = React.useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref);

    return () => {
      observer.unobserve(ref);
    };
  }, [ref, options]);

  return { ref: setRef, isIntersecting };
};

// Image lazy loading component
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, placeholder, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (!isIntersecting) {
    return (
      <div
        ref={ref}
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ minHeight: '200px' }}
      />
    );
  }

  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      ref={ref}
      src={isLoaded ? src : placeholder || src}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
};

// Bundle analyzer utility (for development)
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    // This would integrate with webpack-bundle-analyzer or similar
    console.log('Bundle analysis available in development mode');
  }
};
