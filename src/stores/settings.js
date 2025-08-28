import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getSettings, getSetting, updateSetting } from "@/utils/supabase";

export const useSettingsStore = defineStore("settings", () => {
  // State
  const settings = ref({
    minSaleAmount: 1000,
    lowStockThreshold: 5,
    hideStock: false,
    stockManagementEnabled: true,
  });

  const loading = ref(false);
  const dbSettings = ref({});

  // Computed
  const isStockHidden = computed(() => settings.value.hideStock);
  const isStockManagementEnabled = computed(
    () => settings.value.stockManagementEnabled
  );
  const lowStockThreshold = computed(() => settings.value.lowStockThreshold);
  const minSaleAmount = computed(() => settings.value.minSaleAmount);

  // Actions
  const loadLocalSettings = () => {
    const saved = localStorage.getItem("appSettings");
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        settings.value = { ...settings.value, ...parsedSettings };
      } catch (error) {
        console.error("Error loading local settings:", error);
      }
    }
  };

  const loadDatabaseSettings = async () => {
    loading.value = true;
    try {
      const dbSettingsData = await getSettings();

      // Convert database settings to usable format
      const settingsMap = {};
      dbSettingsData.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      dbSettings.value = settingsMap;

      // Apply database settings to local settings
      if (settingsMap.stock_management_enabled) {
        settings.value.stockManagementEnabled =
          settingsMap.stock_management_enabled.enabled;
      }

      console.log("Database settings loaded:", settingsMap);
    } catch (error) {
      console.error("Error loading database settings:", error);
      // Fall back to local settings if database fails
      loadLocalSettings();
    } finally {
      loading.value = false;
    }
  };

  const saveLocalSettings = () => {
    try {
      localStorage.setItem("appSettings", JSON.stringify(settings.value));
      return true;
    } catch (error) {
      console.error("Error saving local settings:", error);
      return false;
    }
  };

  const saveDatabaseSetting = async (key, value) => {
    try {
      console.log("saveDatabaseSetting called with:", { key, value });
      await updateSetting(key, value);

      // Update local cache
      dbSettings.value[key] = value;

      console.log("saveDatabaseSetting success");
      return true;
    } catch (error) {
      console.error("Error saving database setting:", error);
      return false;
    }
  };

  const updateLocalSetting = (key, value) => {
    settings.value[key] = value;
    saveLocalSettings();
  };

  const updateStockManagement = async (enabled) => {
    // Update database setting
    const success = await saveDatabaseSetting("stock_management_enabled", {
      enabled,
    });

    if (success) {
      // Update local setting
      settings.value.stockManagementEnabled = enabled;
      saveLocalSettings();
    }

    return success;
  };

  const toggleStockVisibility = () => {
    settings.value.hideStock = !settings.value.hideStock;
    saveLocalSettings();
  };

  const resetSettings = async () => {
    // Reset local settings
    settings.value = {
      minSaleAmount: 1000,
      lowStockThreshold: 5,
      hideStock: false,
      stockManagementEnabled: true,
    };
    saveLocalSettings();

    // Reset database settings
    await saveDatabaseSetting("stock_management_enabled", { enabled: true });
  };

  // Initialize settings on store creation
  const initializeSettings = async () => {
    loadLocalSettings();
    await loadDatabaseSettings();
  };

  return {
    // State
    settings,
    loading,
    dbSettings,

    // Computed
    isStockHidden,
    isStockManagementEnabled,
    lowStockThreshold,
    minSaleAmount,

    // Actions
    loadLocalSettings,
    loadDatabaseSettings,
    saveLocalSettings,
    saveDatabaseSetting,
    updateLocalSetting,
    updateStockManagement,
    toggleStockVisibility,
    resetSettings,
    initializeSettings,
  };
});
