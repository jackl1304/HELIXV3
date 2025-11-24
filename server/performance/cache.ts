// Performance Optimizations & Caching Layer for HELIX System
// Best-in-class approach: In-memory architecture with TTL support

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  max?: number; // Maximum number of items
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-Memory Cache with TTL and LRU eviction
class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.max || 500;
    this.defaultTTL = options.ttl || 1000 * 60 * 5; // 5 minutes default
  }

  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    console.log(`[CACHE HIT] ${key}`);
    return entry.value;
  }

  set(key: string, value: any, ttl?: number): void {
    // Evict oldest if at max capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
    console.log(`[CACHE SET] ${key}`);
  }

  delete(key: string): void {
    this.cache.delete(key);
    console.log(`[CACHE DELETE] ${key}`);
  }

  clear(): void {
    this.cache.clear();
    console.log('[CACHE] Cleared all entries');
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

// Cache Instances for different data types
export const regulatoryUpdatesCache = new MemoryCache({
  max: 1000,
  ttl: 1000 * 60 * 10, // 10 minutes (regulatory data changes infrequently)
});

export const evaluationsCache = new MemoryCache({
  max: 500,
  ttl: 1000 * 60 * 15, // 15 minutes (evaluation data is relatively stable)
});

export const costItemsCache = new MemoryCache({
  max: 300,
  ttl: 1000 * 60 * 30, // 30 minutes (cost data rarely changes)
});

export const legalCasesCache = new MemoryCache({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour (legal cases are historical)
});

export const projectsCache = new MemoryCache({
  max: 200,
  ttl: 1000 * 60 * 2, // 2 minutes (projects change frequently)
});

// Cache Key Generators (consistent naming)
export const CacheKeys = {
  regulatoryUpdate: (id: string) => `reg_update:${id}`,
  allRegulatoryUpdates: () => 'reg_updates:all',
  evaluation: (regulatoryUpdateId: string) => `eval:${regulatoryUpdateId}`,
  costItemsByJurisdiction: (jurisdiction: string) => `cost:${jurisdiction}`,
  allCostItems: () => 'cost:all',
  normativeActions: (regulatoryUpdateId: string) => `actions:${regulatoryUpdateId}`,
  legalCasesByJurisdiction: (jurisdiction: string) => `legal:${jurisdiction}`,
  project: (id: string) => `project:${id}`,
  projectPhases: (projectId: string) => `project_phases:${projectId}`,
  dashboardStats: () => 'dashboard:stats',
};

// Cache Invalidation Helpers
export const InvalidateCache = {
  regulatoryUpdate: (id?: string) => {
    if (id) {
      regulatoryUpdatesCache.delete(CacheKeys.regulatoryUpdate(id));
    }
    regulatoryUpdatesCache.delete(CacheKeys.allRegulatoryUpdates());
  },
  evaluation: (regulatoryUpdateId: string) => {
    evaluationsCache.delete(CacheKeys.evaluation(regulatoryUpdateId));
  },
  costItems: (jurisdiction?: string) => {
    if (jurisdiction) {
      costItemsCache.delete(CacheKeys.costItemsByJurisdiction(jurisdiction));
    }
    costItemsCache.delete(CacheKeys.allCostItems());
  },
  project: (id: string) => {
    projectsCache.delete(CacheKeys.project(id));
    projectsCache.delete(CacheKeys.projectPhases(id));
  },
  dashboard: () => {
    regulatoryUpdatesCache.delete(CacheKeys.dashboardStats());
  },
};

// Decorator for automatic caching (TypeScript decorator pattern)
export function Cached(cacheInstance: MemoryCache, keyGenerator: (...args: any[]) => string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args);

      // Try cache first
      const cached = cacheInstance.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Cache miss - execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cacheInstance.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// Performance Metrics Collector
class PerformanceMetrics {
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  record(operation: string, durationMs: number): void {
    const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += durationMs;
    existing.avgTime = existing.totalTime / existing.count;
    this.metrics.set(operation, existing);
  }

  getMetrics() {
    return Array.from(this.metrics.entries()).map(([operation, data]) => ({
      operation,
      ...data,
    }));
  }

  getSummary() {
    const allMetrics = this.getMetrics();
    return {
      totalOperations: allMetrics.reduce((sum, m) => sum + m.count, 0),
      operations: allMetrics.sort((a, b) => b.avgTime - a.avgTime).slice(0, 10), // Top 10 slowest
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMetrics = new PerformanceMetrics();

// Timing decorator for performance tracking
export function Timed(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        performanceMetrics.record(operationName, duration);
        if (duration > 1000) {
          console.warn(`[PERF WARNING] ${operationName} took ${duration}ms`);
        }
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        performanceMetrics.record(`${operationName}:error`, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

// Batch Request Optimizer (prevent N+1 queries)
class BatchLoader<K, V> {
  private queue: Array<{ key: K; resolve: (value: V) => void; reject: (error: any) => void }> = [];
  private batchFn: (keys: K[]) => Promise<V[]>;
  private timeout: NodeJS.Timeout | null = null;
  private maxBatchSize: number;

  constructor(batchFn: (keys: K[]) => Promise<V[]>, maxBatchSize = 100) {
    this.batchFn = batchFn;
    this.maxBatchSize = maxBatchSize;
  }

  load(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), 10); // 10ms batching window
      }
    });
  }

  private async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);
    const keys = batch.map(item => item.key);

    try {
      const results = await this.batchFn(keys);
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}

// Export batch loader factory
export function createBatchLoader<K, V>(batchFn: (keys: K[]) => Promise<V[]>, maxBatchSize?: number) {
  return new BatchLoader(batchFn, maxBatchSize);
}

// Health Check for Caches
export function getCacheHealth() {
  return {
    regulatoryUpdates: { size: regulatoryUpdatesCache.size(), maxSize: 1000 },
    evaluations: { size: evaluationsCache.size(), maxSize: 500 },
    costItems: { size: costItemsCache.size(), maxSize: 300 },
    legalCases: { size: legalCasesCache.size(), maxSize: 500 },
    projects: { size: projectsCache.size(), maxSize: 200 },
    performance: performanceMetrics.getSummary(),
  };
}
