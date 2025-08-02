import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { useAuthStore } from "./stores/auth";
import { useThemeStore } from "./stores/theme";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);

// Initialize stores
const authStore = useAuthStore();
const themeStore = useThemeStore();

// Check for existing user session
authStore.checkUser();

// Apply saved theme
vuetify.theme.global.name.value = themeStore.isDark ? "dark" : "light";

// Watch theme changes
themeStore.$subscribe(() => {
  vuetify.theme.global.name.value = themeStore.isDark ? "dark" : "light";
});

app.mount("#app");
