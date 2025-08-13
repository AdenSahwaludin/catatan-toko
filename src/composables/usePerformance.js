/**
 * Performance optimization utilities
 * Provides debouncing, throttling, memoization, and other performance helpers
 */

import { ref, computed, watch, onUnmounted } from "vue";

/**
 * Debounce utility for search inputs and API calls
 */
export function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value.value || value);
  let timeoutId;

  const updateDebouncedValue = (newValue) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  };

  // Watch for changes
  watch(() => value.value || value, updateDebouncedValue, { immediate: false });

  onUnmounted(() => {
    clearTimeout(timeoutId);
  });

  return debouncedValue;
}

/**
 * Throttle utility for scroll handlers and frequent events
 */
export function useThrottle(callback, delay = 100) {
  let lastCall = 0;

  return function throttledFunction(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return callback.apply(this, args);
    }
  };
}

/**
 * Virtual scrolling helper for large lists
 */
export function useVirtualList(items, itemHeight = 50, containerHeight = 400) {
  const scrollTop = ref(0);
  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, items.value.length);

    return { start, end };
  });

  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value;
    return items.value.slice(start, end).map((item, index) => ({
      ...item,
      index: start + index,
    }));
  });

  const totalHeight = computed(() => items.value.length * itemHeight);
  const offsetY = computed(() => visibleRange.value.start * itemHeight);

  const onScroll = (event) => {
    scrollTop.value = event.target.scrollTop;
  };

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
  };
}

/**
 * Memoization helper for expensive computations
 */
export function useMemo(fn, deps) {
  const cache = new Map();

  return computed(() => {
    const key = JSON.stringify(deps.map((dep) => dep.value));

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn();
    cache.set(key, result);

    // Clean cache if it gets too large
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  });
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(target, callback, options = {}) {
  let observer;

  const observe = () => {
    if (target.value) {
      observer = new IntersectionObserver(callback, {
        threshold: 0.1,
        ...options,
      });
      observer.observe(target.value);
    }
  };

  const disconnect = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  onUnmounted(() => {
    disconnect();
  });

  return { observe, disconnect };
}

/**
 * Image lazy loading helper
 */
export function useLazyImage(src) {
  const imageRef = ref(null);
  const loaded = ref(false);
  const error = ref(false);

  const { observe } = useIntersectionObserver(imageRef, ([entry]) => {
    if (entry.isIntersecting && !loaded.value) {
      const img = new Image();
      img.onload = () => {
        loaded.value = true;
        if (imageRef.value) {
          imageRef.value.src = src;
        }
      };
      img.onerror = () => {
        error.value = true;
      };
      img.src = src;
    }
  });

  return { imageRef, loaded, error, observe };
}

/**
 * Memory-efficient table pagination
 */
export function useSmartPagination(items, itemsPerPage = 25) {
  const currentPage = ref(1);
  const searchQuery = ref("");

  const filteredItems = computed(() => {
    if (!searchQuery.value) return items.value;

    const query = searchQuery.value.toLowerCase();
    return items.value.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  });

  const totalPages = computed(() =>
    Math.ceil(filteredItems.value.length / itemsPerPage)
  );

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredItems.value.slice(start, end);
  });

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  };

  const nextPage = () => goToPage(currentPage.value + 1);
  const previousPage = () => goToPage(currentPage.value - 1);
  const firstPage = () => goToPage(1);
  const lastPage = () => goToPage(totalPages.value);

  // Reset to first page when search changes
  watch(searchQuery, () => {
    currentPage.value = 1;
  });

  return {
    currentPage,
    searchQuery,
    filteredItems,
    paginatedItems,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
  };
}

/**
 * Bundle size optimization - Dynamic imports helper
 */
export function useDynamicImport(importFn) {
  const component = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const load = async () => {
    if (component.value) return component.value;

    loading.value = true;
    error.value = null;

    try {
      const module = await importFn();
      component.value = module.default || module;
      return component.value;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { component, loading, error, load };
}

/**
 * Performance monitoring helper
 */
export function usePerformanceMonitor(name) {
  const startTime = ref(0);
  const endTime = ref(0);
  const duration = computed(() => endTime.value - startTime.value);

  const start = () => {
    startTime.value = performance.now();
  };

  const end = () => {
    endTime.value = performance.now();

    if (process.env.NODE_ENV === "development") {
      console.log(`${name}: ${duration.value.toFixed(2)}ms`);
    }
  };

  const measure = async (fn) => {
    start();
    const result = await fn();
    end();
    return result;
  };

  return { start, end, measure, duration };
}
