// Emergency fix untuk masalah data kosong
// Paste script ini ke browser console saat membuka aplikasi

console.log("🚨 Emergency Data Fix Script Running...");

// 1. Check localStorage
console.log("📦 LocalStorage Check:");
console.log("User:", JSON.parse(localStorage.getItem("user") || "null"));
console.log("Last Login:", localStorage.getItem("lastLoginTime"));

// 2. Force reload from Supabase
async function forceReloadData() {
  try {
    console.log("🔄 Force reloading data from Supabase...");

    // Get the data store from window if available
    const app = document.querySelector("#app").__vueParentComponent;
    const stores = app?.appContext?.app?.config?.globalProperties?.$pinia?._s;

    if (!stores) {
      console.error("❌ Cannot access Pinia stores");
      return;
    }

    // Find data store
    const dataStore = Array.from(stores.values()).find(
      (store) => store.items && store.categories
    );

    if (dataStore) {
      console.log("📊 Found data store, refreshing...");
      await dataStore.fetchCategories();
      await dataStore.fetchItems();
      console.log("✅ Data refreshed");
      console.log("Categories:", dataStore.categories.length);
      console.log("Items:", dataStore.items.length);
    } else {
      console.error("❌ Data store not found");
    }
  } catch (error) {
    console.error("❌ Force reload failed:", error);
  }
}

// 3. Test direct Supabase connection
async function testDirectConnection() {
  try {
    console.log("🔗 Testing direct Supabase connection...");

    // Import Supabase
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );
    const supabase = createClient(
      "https://mjxhddjoaoekdlhnqbhy.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qeGhkZGpvYW9la2RsaG5xYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTgxMTQsImV4cCI6MjA2OTczNDExNH0.XyPUtr2KgiZwMqbz_2hS0e-UTVqhS-ucZedo0pT9Qss"
    );

    // Test each table
    const tables = ["categories", "items", "sales", "users"];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*").limit(5);
      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${data.length} records found`);
      }
    }
  } catch (error) {
    console.error("❌ Direct connection test failed:", error);
  }
}

// 4. Clear and reset localStorage
function resetLocalStorage() {
  console.log("🧹 Clearing localStorage...");
  localStorage.removeItem("user");
  localStorage.removeItem("lastLoginTime");
  console.log("✅ LocalStorage cleared");
}

// 5. Force re-authentication
function forceReauth() {
  console.log("🔑 Forcing re-authentication...");
  resetLocalStorage();
  window.location.href = "/login";
}

// Run the checks
console.log("Running emergency diagnostics...");
setTimeout(testDirectConnection, 1000);
setTimeout(forceReloadData, 2000);

// Expose functions for manual use
window.forceReloadData = forceReloadData;
window.testDirectConnection = testDirectConnection;
window.resetLocalStorage = resetLocalStorage;
window.forceReauth = forceReauth;

console.log("💡 Available functions:");
console.log("  - forceReloadData() - Force reload data from Supabase");
console.log("  - testDirectConnection() - Test Supabase connection");
console.log("  - resetLocalStorage() - Clear saved user data");
console.log("  - forceReauth() - Force re-login");
