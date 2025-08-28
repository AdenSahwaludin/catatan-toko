import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { useAuthStore } from "./stores/auth";
import { useThemeStore } from "./stores/theme";
import { useDataStore } from "./stores/data";
import { useSettingsStore } from "./stores/settings";
import { setupSessionMonitor } from "./utils/sessionMonitor";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);

// Initialize stores
const authStore = useAuthStore();
const themeStore = useThemeStore();
const dataStore = useDataStore();
const settingsStore = useSettingsStore();

// Initialize auth store with localStorage data
authStore.initAuth();

// Check for existing user session
authStore.checkUser();

// Setup session monitoring for auto-logout
setupSessionMonitor();

// Apply saved theme
vuetify.theme.global.name.value = themeStore.isDark ? "dark" : "light";

// Watch theme changes
themeStore.$subscribe(() => {
  vuetify.theme.global.name.value = themeStore.isDark ? "dark" : "light";
});

// Preload critical data jika user sudah login
if (authStore.isLoggedIn) {
  // Preload data penting tanpa blocking UI
  setTimeout(async () => {
    try {
      // Initialize settings first, then load other data
      await settingsStore.initializeSettings();
      await dataStore.fetchInitialData();
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }, 100);
}

app.mount("#app");
