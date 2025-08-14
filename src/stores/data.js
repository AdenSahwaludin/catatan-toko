import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getItems, getCategories, getSales, getUsers } from "@/utils/supabase";

export const useDataStore = defineStore("data", () => {
  const items = ref([]);
  const categories = ref([]);
  const sales = ref([]);
  const employees = ref([]);
  const users = ref([]); // Added for all users (admin + employee)
  const loading = ref(false);

  // Cache untuk menghindari fetch berulang
  const lastFetchTimes = ref({
    items: null,
    categories: null,
    sales: null,
    users: null,
    employees: null,
  });

  // Cache duration dalam milidetik (5 menit)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Helper function untuk cek apakah cache masih valid
  const isCacheValid = (key) => {
    const lastFetch = lastFetchTimes.value[key];
    if (!lastFetch) return false;
    return Date.now() - lastFetch < CACHE_DURATION;
  };

  const fetchCategories = async (forceRefresh = false) => {
    if (
      !forceRefresh &&
      isCacheValid("categories") &&
      categories.value.length > 0
    ) {
      console.log("Using cached categories data");
      return;
    }

    try {
      loading.value = true;
      categories.value = await getCategories();
      lastFetchTimes.value.categories = Date.now();
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchItems = async (filters = {}, forceRefresh = false) => {
    // Jika ada filter, selalu fetch ulang
    const hasFilters = Object.keys(filters).length > 0;

    if (
      !forceRefresh &&
      !hasFilters &&
      isCacheValid("items") &&
      items.value.length > 0
    ) {
      console.log("Using cached items data");
      return;
    }

    try {
      loading.value = true;
      const rawItems = await getItems(filters);

      // Sanitize item data to ensure price is always a valid number
      items.value = rawItems.map((item) => ({
        ...item,
        price: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
      }));

      if (!hasFilters) {
        lastFetchTimes.value.items = Date.now();
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchSales = async (filters = {}, forceRefresh = false) => {
    // Jika ada filter, selalu fetch ulang
    const hasFilters = Object.keys(filters).length > 0;

    if (
      !forceRefresh &&
      !hasFilters &&
      isCacheValid("sales") &&
      sales.value.length > 0
    ) {
      console.log("Using cached sales data");
      return;
    }

    try {
      loading.value = true;
      sales.value = await getSales(filters);

      if (!hasFilters) {
        lastFetchTimes.value.sales = Date.now();
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchEmployees = async (forceRefresh = false) => {
    if (
      !forceRefresh &&
      isCacheValid("employees") &&
      employees.value.length > 0
    ) {
      console.log("Using cached employees data");
      return;
    }

    try {
      loading.value = true;
      employees.value = await getUsers("employee");
      lastFetchTimes.value.employees = Date.now();
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchUsers = async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid("users") && users.value.length > 0) {
      console.log("Using cached users data");
      return;
    }

    try {
      loading.value = true;
      users.value = await getUsers(); // Get all users
      lastFetchTimes.value.users = Date.now();
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      loading.value = false;
    }
  };

  // Function untuk batch fetch data yang diperlukan
  const fetchInitialData = async () => {
    try {
      loading.value = true;

      // Fetch data secara parallel untuk performa yang lebih baik
      await Promise.all([fetchCategories(), fetchUsers(), fetchItems()]);

      console.log("Initial data loaded successfully");
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      loading.value = false;
    }
  };

  // Function untuk refresh semua data
  const refreshAllData = async () => {
    try {
      loading.value = true;

      // Clear cache dan fetch ulang semua data
      await Promise.all([
        fetchCategories(true),
        fetchUsers(true),
        fetchItems({}, true),
        fetchSales({}, true),
        fetchEmployees(true),
      ]);

      console.log("All data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      loading.value = false;
    }
  };

  // Computed properties untuk data yang sering diakses
  const itemsCount = computed(() => items.value.length);
  const salesCount = computed(() => sales.value.length);
  const categoriesCount = computed(() => categories.value.length);
  const lowStockItems = computed(() =>
    items.value.filter((item) => item.stock < 10)
  );

  return {
    // State
    items,
    categories,
    sales,
    employees,
    users,
    loading,

    // Computed
    itemsCount,
    salesCount,
    categoriesCount,
    lowStockItems,

    // Actions
    fetchCategories,
    fetchItems,
    fetchSales,
    fetchEmployees,
    fetchUsers,
    fetchInitialData,
    refreshAllData,
  };
});
