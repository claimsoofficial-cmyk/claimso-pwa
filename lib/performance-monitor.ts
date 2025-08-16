// Performance Monitoring System for Claimso
// Tracks Core Web Vitals, custom metrics, and performance analytics

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  
  // Custom metrics
  pageLoadTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  bundleSize: number;
  
  // User interaction metrics
  timeToInteractive: number;
  firstMeaningfulPaint: number;
  domContentLoaded: number;
  windowLoad: number;
}

interface PerformanceEvent {
  type: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    fcp: 0,
    pageLoadTime: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    bundleSize: 0,
    timeToInteractive: 0,
    firstMeaningfulPaint: 0,
    domContentLoaded: 0,
    windowLoad: 0,
  };

  private events: PerformanceEvent[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.setupCoreWebVitals();
    this.setupCustomMetrics();
    this.setupMemoryMonitoring();
    this.setupBundleSizeTracking();
    this.setupApiMonitoring();
    this.setupCacheMonitoring();
  }

  // Setup Core Web Vitals monitoring
  private setupCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      this.recordEvent('lcp', lastEntry.startTime);
    });

    // First Input Delay (FID)
    this.observeMetric('first-input', (entries) => {
      const firstInput = entries[0];
      this.metrics.fid = firstInput.processingStart - firstInput.startTime;
      this.recordEvent('fid', this.metrics.fid);
    });

    // Cumulative Layout Shift (CLS)
    this.observeMetric('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cls = clsValue;
      this.recordEvent('cls', clsValue);
    });

    // First Contentful Paint (FCP)
    this.observeMetric('first-contentful-paint', (entries) => {
      const fcp = entries[0];
      this.metrics.fcp = fcp.startTime;
      this.recordEvent('fcp', fcp.startTime);
    });
  }

  // Setup custom performance metrics
  private setupCustomMetrics() {
    // Page load time
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.metrics.domContentLoaded = performance.now();
        this.recordEvent('domContentLoaded', this.metrics.domContentLoaded);
      });
    }

    window.addEventListener('load', () => {
      this.metrics.windowLoad = performance.now();
      this.metrics.pageLoadTime = this.metrics.windowLoad;
      this.recordEvent('pageLoad', this.metrics.pageLoadTime);
    });

    // Time to Interactive (TTI) approximation
    this.observeMetric('longtask', (entries) => {
      const lastLongTask = entries[entries.length - 1];
      this.metrics.timeToInteractive = lastLongTask.startTime + lastLongTask.duration;
      this.recordEvent('tti', this.metrics.timeToInteractive);
    });
  }

  // Setup memory usage monitoring
  private setupMemoryMonitoring() {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        this.recordEvent('memoryUsage', this.metrics.memoryUsage);
      };

      updateMemoryUsage();
      setInterval(updateMemoryUsage, 30000); // Update every 30 seconds
    }
  }

  // Setup bundle size tracking
  private setupBundleSizeTracking() {
    // Track JavaScript bundle sizes
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach((script) => {
      const src = script.getAttribute('src');
      if (src && src.includes('_next/static/chunks/')) {
        // This is a Next.js chunk
        this.recordEvent('bundleChunk', 0, { src });
      }
    });

    this.metrics.bundleSize = totalSize;
  }

  // Setup API response time monitoring
  private setupApiMonitoring() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.metrics.apiResponseTime = responseTime;
        this.recordEvent('apiResponse', responseTime, {
          url: args[0],
          method: args[1]?.method || 'GET',
          status: response.status,
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.recordEvent('apiError', responseTime, {
          url: args[0],
          method: args[1]?.method || 'GET',
          error: error.message,
        });
        
        throw error;
      }
    };
  }

  // Setup cache monitoring
  private setupCacheMonitoring() {
    // Monitor cache hit rates for React Query
    if (typeof window !== 'undefined') {
      const originalCache = (window as any).__REACT_QUERY_CACHE__;
      if (originalCache) {
        // This would integrate with React Query's cache monitoring
        this.recordEvent('cacheInit', 0, { cacheSize: originalCache.size });
      }
    }
  }

  // Observe performance metrics
  private observeMetric(metricName: string, callback: (entries: PerformanceEntryList) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [metricName] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Performance monitoring for ${metricName} not supported:`, error);
    }
  }

  // Record performance events
  private recordEvent(type: string, value: number, metadata?: Record<string, any>) {
    const event: PerformanceEvent = {
      type,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.events.push(event);
    this.sendToAnalytics(event);
  }

  // Send metrics to analytics
  private sendToAnalytics(event: PerformanceEvent) {
    // Send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', 'performance_metric', {
          metric_name: event.type,
          metric_value: event.value,
          timestamp: event.timestamp,
          ...event.metadata,
        });
      }

      // Example: Custom analytics endpoint
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(console.error);
    }
  }

  // Get current metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance events
  public getEvents(): PerformanceEvent[] {
    return [...this.events];
  }

  // Get performance score (0-100)
  public getPerformanceScore(): number {
    const scores = {
      lcp: this.getLcpScore(),
      fid: this.getFidScore(),
      cls: this.getClsScore(),
      fcp: this.getFcpScore(),
    };

    return Math.round(
      (scores.lcp + scores.fid + scores.cls + scores.fcp) / 4
    );
  }

  // Calculate LCP score
  private getLcpScore(): number {
    const lcp = this.metrics.lcp;
    if (lcp <= 2500) return 100;
    if (lcp <= 4000) return 75;
    if (lcp <= 6000) return 50;
    return 25;
  }

  // Calculate FID score
  private getFidScore(): number {
    const fid = this.metrics.fid;
    if (fid <= 100) return 100;
    if (fid <= 300) return 75;
    if (fid <= 500) return 50;
    return 25;
  }

  // Calculate CLS score
  private getClsScore(): number {
    const cls = this.metrics.cls;
    if (cls <= 0.1) return 100;
    if (cls <= 0.25) return 75;
    if (cls <= 0.5) return 50;
    return 25;
  }

  // Calculate FCP score
  private getFcpScore(): number {
    const fcp = this.metrics.fcp;
    if (fcp <= 1800) return 100;
    if (fcp <= 3000) return 75;
    if (fcp <= 4500) return 50;
    return 25;
  }

  // Custom metric tracking
  public trackCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    this.recordEvent(name, value, metadata);
  }

  // Track user interaction
  public trackInteraction(element: string, action: string, duration?: number) {
    this.recordEvent('userInteraction', duration || 0, {
      element,
      action,
      timestamp: Date.now(),
    });
  }

  // Track page navigation
  public trackNavigation(from: string, to: string, duration: number) {
    this.recordEvent('navigation', duration, {
      from,
      to,
      timestamp: Date.now(),
    });
  }

  // Track component render time
  public trackComponentRender(componentName: string, renderTime: number) {
    this.recordEvent('componentRender', renderTime, {
      component: componentName,
      timestamp: Date.now(),
    });
  }

  // Track API call
  public trackApiCall(url: string, method: string, duration: number, status: number) {
    this.recordEvent('apiCall', duration, {
      url,
      method,
      status,
      timestamp: Date.now(),
    });
  }

  // Track cache operation
  public trackCacheOperation(operation: string, key: string, hit: boolean, duration?: number) {
    this.recordEvent('cacheOperation', duration || 0, {
      operation,
      key,
      hit,
      timestamp: Date.now(),
    });
  }

  // Generate performance report
  public generateReport(): any {
    const score = this.getPerformanceScore();
    const metrics = this.getMetrics();
    const events = this.getEvents();

    return {
      timestamp: Date.now(),
      score,
      metrics,
      events: events.slice(-100), // Last 100 events
      summary: {
        totalEvents: events.length,
        averageApiResponseTime: this.calculateAverage(events.filter(e => e.type === 'apiResponse')),
        averagePageLoadTime: this.calculateAverage(events.filter(e => e.type === 'pageLoad')),
        cacheHitRate: this.calculateCacheHitRate(),
        memoryUsage: metrics.memoryUsage,
      },
      recommendations: this.generateRecommendations(),
    };
  }

  // Calculate average from events
  private calculateAverage(events: PerformanceEvent[]): number {
    if (events.length === 0) return 0;
    const sum = events.reduce((acc, event) => acc + event.value, 0);
    return sum / events.length;
  }

  // Calculate cache hit rate
  private calculateCacheHitRate(): number {
    const cacheEvents = this.events.filter(e => e.type === 'cacheOperation');
    if (cacheEvents.length === 0) return 0;
    
    const hits = cacheEvents.filter(e => e.metadata?.hit).length;
    return (hits / cacheEvents.length) * 100;
  }

  // Generate performance recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.lcp > 4000) {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and improving server response times');
    }

    if (metrics.fid > 300) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }

    if (metrics.cls > 0.25) {
      recommendations.push('Improve Cumulative Layout Shift by setting explicit dimensions for images and ads');
    }

    if (metrics.apiResponseTime > 1000) {
      recommendations.push('Optimize API response times by implementing caching and database query optimization');
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('Reduce memory usage by optimizing component rendering and cleaning up event listeners');
    }

    return recommendations;
  }

  // Cleanup observers
  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in components
export { performanceMonitor, PerformanceMonitor };
export type { PerformanceMetrics, PerformanceEvent };

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(performanceMonitor.getMetrics());
  const [score, setScore] = React.useState<number>(performanceMonitor.getPerformanceScore());

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
      setScore(performanceMonitor.getPerformanceScore());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    score,
    trackCustomMetric: performanceMonitor.trackCustomMetric.bind(performanceMonitor),
    trackInteraction: performanceMonitor.trackInteraction.bind(performanceMonitor),
    trackNavigation: performanceMonitor.trackNavigation.bind(performanceMonitor),
    trackComponentRender: performanceMonitor.trackComponentRender.bind(performanceMonitor),
    trackApiCall: performanceMonitor.trackApiCall.bind(performanceMonitor),
    trackCacheOperation: performanceMonitor.trackCacheOperation.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
  };
};
