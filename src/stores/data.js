import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getItems,
  getCategories,
  getSales,
  getUsers,
  getSettings,
} from "@/utils/supabase";

export const useDataStore = defineStore("data", () => {
  const items = ref([]);
  const categories = ref([]);
  const sales = ref([]);
  const employees = ref([]);
  const users = ref([]); // Added for all users (admin + employee)
  const settings = ref([]);
  const loading = ref(false);

  // Cache status untuk mendeteksi apakah data sudah dimuat
  const cacheStatus = ref({
    items: false,
    categories: false,
    sales: false,
    employees: false,
    users: false,
    settings: false,
  });

  // Cache invalidation - untuk memaksa fetch ulang setelah operasi CRUD
  const invalidateCache = (type) => {
    if (type) {
      cacheStatus.value[type] = false;
      console.log(`Cache invalidated for: ${type}`);
    } else {
      // Invalidate all cache
      Object.keys(cacheStatus.value).forEach((key) => {
        cacheStatus.value[key] = false;
      });
      console.log("All cache invalidated");
    }
  };

  const fetchSettings = async (forceRefresh = false) => {
    // Jika cache masih valid dan tidak ada force refresh, gunakan cache
    if (
      !forceRefresh &&
      cacheStatus.value.settings &&
      settings.value.length > 0
    ) {
      console.log("Using cached settings data");
      return;
    }

    try {
      loading.value = true;
      settings.value = await getSettings();
      cacheStatus.value.settings = true;
      console.log("Settings data fetched from database");
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchCategories = async (forceRefresh = false) => {
    // Jika cache masih valid dan tidak ada force refresh, gunakan cache
    if (
      !forceRefresh &&
      cacheStatus.value.categories &&
      categories.value.length > 0
    ) {
      console.log("Using cached categories data");
      return;
    }

    try {
      loading.value = true;
      categories.value = await getCategories();
      cacheStatus.value.categories = true;
      console.log("Categories data fetched from database");
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchItems = async (filters = {}, forceRefresh = false) => {
    // Jika ada filter, selalu fetch ulang
    const hasFilters = Object.keys(filters).length > 0;

    // Jika cache masih valid dan tidak ada force refresh atau filter, gunakan cache
    if (
      !forceRefresh &&
      !hasFilters &&
      cacheStatus.value.items &&
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

      // Update cache status hanya jika tidak ada filter
      if (!hasFilters) {
        cacheStatus.value.items = true;
      }

      console.log("Items data fetched from database");
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchSales = async (filters = {}, forceRefresh = false) => {
    // Jika ada filter, selalu fetch ulang
    const hasFilters = Object.keys(filters).length > 0;

    // Jika cache masih valid dan tidak ada force refresh atau filter, gunakan cache
    if (
      !forceRefresh &&
      !hasFilters &&
      cacheStatus.value.sales &&
      sales.value.length > 0
    ) {
      console.log("Using cached sales data");
      return;
    }

    try {
      loading.value = true;
      sales.value = await getSales(filters);

      // Update cache status hanya jika tidak ada filter
      if (!hasFilters) {
        cacheStatus.value.sales = true;
      }

      console.log("Sales data fetched from database");
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchEmployees = async (forceRefresh = false) => {
    // Jika cache masih valid dan tidak ada force refresh, gunakan cache
    if (
      !forceRefresh &&
      cacheStatus.value.employees &&
      employees.value.length > 0
    ) {
      console.log("Using cached employees data");
      return;
    }

    try {
      loading.value = true;
      employees.value = await getUsers("employee");
      cacheStatus.value.employees = true;
      console.log("Employees data fetched from database");
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchUsers = async (forceRefresh = false) => {
    // Jika cache masih valid dan tidak ada force refresh, gunakan cache
    if (!forceRefresh && cacheStatus.value.users && users.value.length > 0) {
      console.log("Using cached users data");
      return;
    }

    try {
      loading.value = true;
      users.value = await getUsers(); // Get all users
      cacheStatus.value.users = true;
      console.log("Users data fetched from database");
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
      await Promise.all([
        fetchCategories(),
        fetchUsers(),
        fetchItems(),
        fetchSettings(),
      ]);

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
        fetchSettings(true),
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
    settings,
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
    fetchSettings,
    fetchInitialData,
    refreshAllData,
    invalidateCache,
  };
});
