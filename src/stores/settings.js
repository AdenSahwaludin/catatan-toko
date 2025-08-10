import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref({
    minSaleAmount: 1000,
    lowStockThreshold: 5,
    hideStock: false,
  });

  // Computed
  const isStockHidden = computed(() => settings.value.hideStock);
  const lowStockThreshold = computed(() => settings.value.lowStockThreshold);
  const minSaleAmount = computed(() => settings.value.minSaleAmount);

  // Actions
  const loadSettings = () => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        settings.value = { ...settings.value, ...parsedSettings };
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings.value));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  };

  const updateSetting = (key, value) => {
    settings.value[key] = value;
    saveSettings();
  };

  const toggleStockVisibility = () => {
    settings.value.hideStock = !settings.value.hideStock;
    saveSettings();
  };

  const resetSettings = () => {
    settings.value = {
      minSaleAmount: 1000,
      lowStockThreshold: 5,
      hideStock: false,
    };
    saveSettings();
  };

  // Initialize settings on store creation
  loadSettings();

  return {
    // State
    settings,
    
    // Computed
    isStockHidden,
    lowStockThreshold,
    minSaleAmount,
    
    // Actions
    loadSettings,
    saveSettings,
    updateSetting,
    toggleStockVisibility,
    resetSettings,
  };
});
