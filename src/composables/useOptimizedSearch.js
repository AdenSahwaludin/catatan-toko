import { ref, watch } from "vue";

export function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value.value);

  watch(value, (newVal) => {
    const timer = setTimeout(() => {
      debouncedValue.value = newVal;
    }, delay);

    // Cleanup timer jika value berubah lagi sebelum delay selesai
    return () => clearTimeout(timer);
  });

  return debouncedValue;
}

export function useOptimizedSearch(searchFunction, delay = 500) {
  const searchTerm = ref("");
  const isSearching = ref(false);
  const searchResults = ref([]);

  let searchTimeout = null;

  const performSearch = async (term) => {
    if (!term.trim()) {
      searchResults.value = [];
      return;
    }

    isSearching.value = true;

    try {
      const results = await searchFunction(term);
      searchResults.value = results;
    } catch (error) {
      console.error("Search error:", error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  const search = (term) => {
    searchTerm.value = term;

    // Clear timeout sebelumnya
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set timeout baru untuk debounce
    searchTimeout = setTimeout(() => {
      performSearch(term);
    }, delay);
  };

  const clearSearch = () => {
    searchTerm.value = "";
    searchResults.value = [];
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  return {
    searchTerm,
    isSearching,
    searchResults,
    search,
    clearSearch,
  };
}
