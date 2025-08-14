import { ref, computed } from "vue";

export function useLazyData(fetchFunction, pageSize = 50) {
  const items = ref([]);
  const currentPage = ref(1);
  const totalItems = ref(0);
  const loading = ref(false);
  const hasMore = ref(true);

  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize));

  const loadPage = async (page = 1, reset = false) => {
    if (loading.value) return;

    loading.value = true;

    try {
      const offset = (page - 1) * pageSize;
      const { data, count } = await fetchFunction({
        offset,
        limit: pageSize,
        count: "exact",
      });

      if (reset) {
        items.value = data;
      } else {
        items.value.push(...data);
      }

      totalItems.value = count;
      currentPage.value = page;
      hasMore.value = data.length === pageSize && offset + data.length < count;
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async () => {
    if (hasMore.value && !loading.value) {
      await loadPage(currentPage.value + 1);
    }
  };

  const refresh = async () => {
    currentPage.value = 1;
    hasMore.value = true;
    await loadPage(1, true);
  };

  return {
    items,
    currentPage,
    totalPages,
    totalItems,
    loading,
    hasMore,
    loadPage,
    loadMore,
    refresh,
  };
}
