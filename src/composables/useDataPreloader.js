import { useDataStore } from '@/stores/data';

export function useDataPreloader() {
  const dataStore = useDataStore();
  
  // Preload data berdasarkan prioritas
  const preloadCriticalData = async () => {
    try {
      // Data penting yang dibutuhkan segera
      await Promise.all([
        dataStore.fetchUsers(),
        dataStore.fetchCategories(),
      ]);
      
      console.log('Critical data preloaded');
    } catch (error) {
      console.error('Error preloading critical data:', error);
    }
  };
  
  const preloadOptionalData = async () => {
    try {
      // Data yang bisa dimuat belakangan
      await Promise.all([
        dataStore.fetchItems({}),
        dataStore.fetchSales({}),
      ]);
      
      console.log('Optional data preloaded');
    } catch (error) {
      console.error('Error preloading optional data:', error);
    }
  };
  
  // Preload dengan prioritas
  const preloadData = async () => {
    // Load critical data first
    await preloadCriticalData();
    
    // Then load optional data in background
    setTimeout(() => {
      preloadOptionalData();
    }, 100);
  };
  
  // Background refresh untuk data yang berubah sering
  const backgroundRefresh = () => {
    setInterval(async () => {
      try {
        // Refresh sales data setiap 5 menit tanpa loading indicator
        await dataStore.fetchSales({}, false);
      } catch (error) {
        console.error('Background refresh error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  };
  
  return {
    preloadData,
    preloadCriticalData,
    preloadOptionalData,
    backgroundRefresh,
  };
}
