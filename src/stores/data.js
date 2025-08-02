import { defineStore } from "pinia";
import { ref } from "vue";
import { getItems, getCategories, getSales, getUsers } from "@/utils/supabase";

export const useDataStore = defineStore("data", () => {
  const items = ref([]);
  const categories = ref([]);
  const sales = ref([]);
  const employees = ref([]);
  const loading = ref(false);

  const fetchCategories = async () => {
    try {
      loading.value = true;
      categories.value = await getCategories();
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchItems = async (filters = {}) => {
    try {
      loading.value = true;
      items.value = await getItems(filters);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchSales = async (filters = {}) => {
    try {
      loading.value = true;
      sales.value = await getSales(filters);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      loading.value = false;
    }
  };

  const fetchEmployees = async () => {
    try {
      loading.value = true;
      employees.value = await getUsers("employee");
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      loading.value = false;
    }
  };

  return {
    items,
    categories,
    sales,
    employees,
    loading,
    fetchCategories,
    fetchItems,
    fetchSales,
    fetchEmployees,
  };
});
