<template>
  <v-app>
    <!-- Modern Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail && !isMobile"
      :permanent="!isMobile"
      :temporary="isMobile"
      :class="drawerClasses"
      elevation="0"
      :width="isMobile ? 280 : 256"
    >
      <!-- Brand section -->
      <div class="brand-section">
        <v-avatar
          :size="rail ? 40 : 50"
          :class="brandAvatarClasses"
          class="mb-2"
          style="margin-left: -8px"
        >
          <v-icon :size="rail ? 20 : 25" color="white">
            {{ brandIcon }}
          </v-icon>
        </v-avatar>

        <v-expand-transition>
          <div v-show="!rail" class="brand-text">
            <div class="text-h6 font-weight-bold text-primary">
              {{ brandTitle }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ roleTitle }}
            </div>
          </div>
        </v-expand-transition>
      </div>

      <v-divider class="mx-3 mb-4"></v-divider>

      <!-- Navigation List -->
      <v-list density="comfortable" nav class="navigation-list">
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :value="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :subtitle="rail ? undefined : item.subtitle"
          class="nav-item"
          rounded="xl"
          exact
        >
          <template #append v-if="!rail && item.badge">
            <v-chip
              :color="item.badgeColor || 'primary'"
              variant="tonal"
              size="x-small"
            >
              {{ item.badge }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>

      <!-- Bottom section -->
      <template #append>
        <div class="bottom-section pa-3">
          <!-- Toggle rail button - Only for admin -->
          <v-btn
            v-if="role === 'admin'"
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            variant="text"
            size="small"
            @click="rail = !rail"
            class="mb-2"
            :class="{ 'mx-auto d-block': rail }"
          />

          <!-- User info -->
          <v-expand-transition>
            <v-card
              v-show="!rail"
              variant="tonal"
              color="primary"
              rounded="lg"
              class="pa-3 mb-3"
            >
              <div class="d-flex align-center">
                <v-avatar size="32" color="primary" variant="tonal">
                  <v-icon size="16">mdi-account</v-icon>
                </v-avatar>
                <div class="ml-3 flex-grow-1">
                  <div class="text-subtitle-2 font-weight-medium">
                    {{ userDisplayName }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ roleDisplayName }}
                  </div>
                </div>
              </div>
            </v-card>
          </v-expand-transition>

          <!-- Logout button -->
          <v-btn
            :icon="rail"
            :prepend-icon="rail ? undefined : 'mdi-logout'"
            :text="rail ? undefined : 'Logout'"
            variant="outlined"
            color="error"
            size="small"
            @click="handleLogout"
            :class="{ 'mx-auto d-block': rail }"
            :width="rail ? undefined : '100%'"
          >
            <v-icon v-if="rail">mdi-logout</v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar
      elevation="0"
      :class="appBarClasses"
      :color="themeStore.isDark ? '#1d2839' : '#ffffff'"
      :dark="themeStore.isDark"
      density="comfortable"
    >
      <template #prepend>
        <v-btn icon="mdi-menu" variant="text" @click="toggleDrawer" />
      </template>

      <v-app-bar-title class="text-h6 font-weight-medium">
        {{ currentPageTitle }}
      </v-app-bar-title>

      <v-spacer />

      <!-- Header actions -->
      <div class="header-actions d-flex align-center">
        <!-- Notifications - Only for admin -->
        <NotificationPanel v-if="role === 'admin'" />

        <!-- Theme toggle -->
        <v-btn
          :icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          variant="text"
          @click="themeStore.toggleTheme"
          class="mr-2"
        />

        <!-- User menu - Advanced for admin, simple for employee -->
        <template v-if="role === 'admin'">
          <!-- Admin user menu - Hidden on mobile -->
          <v-menu v-if="!isMobile">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" class="user-menu-btn">
                <v-avatar size="32" color="primary">
                  <v-icon size="16">mdi-account</v-icon>
                </v-avatar>
                <v-icon class="ml-1">mdi-chevron-down</v-icon>
              </v-btn>
            </template>

            <v-list min-width="200">
              <v-list-item
                prepend-icon="mdi-cog-outline"
                title="Settings"
                subtitle="App preferences"
                @click="router.push('/admin/settings')"
              />
              <v-divider />
              <v-list-item
                prepend-icon="mdi-logout"
                title="Logout"
                @click="handleLogout"
              />
            </v-list>
          </v-menu>

          <!-- Mobile user menu -->
          <v-menu v-if="isMobile">
            <template #activator="{ props }">
              <v-avatar
                v-bind="props"
                size="32"
                color="primary"
                class="cursor-pointer"
              >
                <v-icon size="16">mdi-account</v-icon>
              </v-avatar>
            </template>

            <v-list min-width="200">
              <v-list-item
                prepend-icon="mdi-cog-outline"
                title="Settings"
                subtitle="App preferences"
                @click="router.push('/admin/settings')"
              />
              <v-divider />
              <v-list-item
                prepend-icon="mdi-logout"
                title="Logout"
                @click="handleLogout"
              />
            </v-list>
          </v-menu>
        </template>
      </div>
    </v-app-bar>

    <!-- Main Content -->
    <v-main :class="mainClasses">
      <div
        class="content-wrapper pa-6"
        :class="{ 'pb-20': isMobile && role === 'admin' }"
      >
        <router-view />
      </div>
    </v-main>

    <!-- Bottom Navigation for Mobile (Admin only) -->
    <v-bottom-navigation
      v-if="isMobile && role === 'admin'"
      v-model="bottomNav"
      color="primary"
      grow
      class="mobile-bottom-nav"
      height="64"
      elevation="8"
    >
      <v-btn
        v-for="item in primaryMenuItems"
        :key="item.title"
        :value="item.to"
        :to="item.to"
        stacked
        class="bottom-nav-btn"
      >
        <v-icon size="20">{{ item.icon }}</v-icon>
        <span class="text-caption mt-1">{{
          item.shortTitle || item.title
        }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { useNotificationStore } from "@/stores/notifications";
import { useDataStore } from "@/stores/data";
import NotificationPanel from "@/components/NotificationPanel.vue";

// Props
const props = defineProps({
  role: {
    type: String,
    required: true,
    validator: (value) => ["admin", "employee"].includes(value),
  },
  menuItems: {
    type: Array,
    required: true,
  },
  brandTitle: {
    type: String,
    default: "Mega Teknik Elektronik",
  },
  brandIcon: {
    type: String,
    default: "mdi-storefront-outline",
  },
});

// Composables
const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const notificationStore = useNotificationStore();
const dataStore = useDataStore();

// Reactive state
const drawer = ref(true);
const rail = ref(false);
const bottomNav = ref(route.path);

// Computed properties
const isMobile = computed(() => mobile.value);

const roleTitle = computed(() => {
  return props.role === "admin" ? "Admin Panel" : "Employee Panel";
});

const roleDisplayName = computed(() => {
  return props.role === "admin" ? "Administrator" : "Employee";
});

const userDisplayName = computed(() => {
  return authStore.user?.email?.split("@")[0] || "User";
});

const currentPageTitle = computed(() => {
  const item = props.menuItems.find((item) => item.to === route.path);
  return item?.title || roleTitle.value;
});

// Primary menu items for bottom navigation (admin only)
const primaryMenuItems = computed(() => {
  if (props.role !== "admin") return [];
  return props.menuItems.slice(0, 5); // Take first 5 items
});

// CSS Classes
const drawerClasses = computed(() => ({
  "modern-drawer": true,
  "employee-drawer": props.role === "employee",
}));

const brandAvatarClasses = computed(() => ({
  "brand-avatar": true,
  "employee-brand": props.role === "employee",
}));

const appBarClasses = computed(() => ({
  "modern-appbar": props.role === "admin",
  "employee-appbar": props.role === "employee",
}));

const mainClasses = computed(() => ({
  "modern-main": props.role === "admin",
  "employee-main": props.role === "employee",
}));

// Methods
const initializeDrawerState = () => {
  if (isMobile.value) {
    drawer.value = false;
    rail.value = false;
  } else {
    // For admin on desktop, start with drawer open but in rail mode
    if (props.role === "admin") {
      drawer.value = true;
      rail.value = true; // Start in rail mode (closed)
    } else {
      drawer.value = true;
      rail.value = false;
    }
  }
};

const toggleDrawer = () => {
  if (isMobile.value) {
    drawer.value = !drawer.value;
  } else if (props.role === "admin") {
    rail.value = !rail.value;
  } else {
    drawer.value = !drawer.value;
  }
};

const handleLogout = async () => {
  const result = await authStore.signOut();
  if (result.success) {
    router.push("/");
  }
};

// Watchers
let unwatchRoute;
let notificationInterval;

// Lifecycle
onMounted(async () => {
  // Initialize drawer state
  initializeDrawerState();

  // Route watcher
  unwatchRoute = router.afterEach((to) => {
    bottomNav.value = to.path;

    // Auto-close drawer on mobile after navigation
    if (isMobile.value) {
      drawer.value = false;
    }
  });

  // Admin-specific initialization
  if (props.role === "admin") {
    // Load data first
    await Promise.all([
      dataStore.fetchItems(),
      dataStore.fetchSales(),
      dataStore.fetchCategories(),
      dataStore.fetchEmployees(),
    ]);

    // Initialize notifications with data
    notificationStore.initializeNotifications(dataStore.items, dataStore.sales);

    // Set up periodic check for notifications (every 5 minutes)
    notificationInterval = setInterval(() => {
      notificationStore.checkLowStock(dataStore.items);
      notificationStore.checkRecentSales(dataStore.sales);
    }, 5 * 60 * 1000);
  }
});

onUnmounted(() => {
  // Cleanup
  if (unwatchRoute) unwatchRoute();
  if (notificationInterval) clearInterval(notificationInterval);
});

// Responsive watcher
watch(isMobile, (newVal) => {
  if (newVal) {
    rail.value = false;
  }
});
</script>

<style scoped>
/* Modern drawer styling */
.modern-drawer {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 1005;
}

.employee-drawer {
  background: rgba(255, 255, 255, 0.95);
}

.v-theme--dark .modern-drawer {
  background: rgba(30, 41, 59, 0.98);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.v-theme--dark .employee-drawer {
  background: rgba(30, 41, 59, 0.95);
}

/* Brand section */
.brand-section {
  text-align: center;
  padding-top: 24px !important;
}

.brand-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.employee-brand {
  background: linear-gradient(
    135deg,
    #1d283a 0%,
    rgb(7, 68, 138) 100%
  ) !important;
  box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
}

.brand-text {
  margin-top: 12px;
}

/* Navigation styling */
.navigation-list {
  padding: 0 12px;
}

.nav-item {
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  transform: translateX(4px);
}

.nav-item.v-list-item--active {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  border: 1px solid rgba(102, 126, 234, 0.2);
}

/* Bottom section */
.bottom-section {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.v-theme--dark .bottom-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Modern app bar */
.modern-appbar {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-theme--dark .modern-appbar {
  background: rgba(30, 41, 59, 0.95) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Header actions */
.header-actions .v-btn {
  transition: all 0.3s ease;
}

.header-actions .v-btn:hover {
  transform: scale(1.05);
}

.user-menu-btn {
  border-radius: 20px;
  padding: 8px 12px;
}

/* Main content */
.modern-main {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.employee-main {
  background: #f5f5f5;
}

.v-theme--dark .modern-main {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.v-theme--dark .employee-main {
  background: #121212;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
}

/* Responsive design */
@media (max-width: 1280px) {
  .content-wrapper {
    padding: 16px !important;
  }
}

@media (max-width: 960px) {
  .brand-section {
    text-align: left;
    padding: 16px !important;
  }

  .nav-item:hover {
    transform: none;
  }

  .content-wrapper {
    padding: 12px !important;
  }

  .header-actions .v-btn:not(.user-menu-btn) {
    min-width: auto !important;
    width: 40px;
    height: 40px;
    padding: 0;
  }

  .modern-drawer {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
}

/* Bottom Navigation Styling */
.mobile-bottom-nav {
  position: fixed !important;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.v-theme--dark .mobile-bottom-nav {
  background: rgba(30, 41, 59, 0.95) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.bottom-nav-btn {
  min-width: auto !important;
  border-radius: 12px !important;
  margin: 4px 2px !important;
  transition: all 0.3s ease !important;
}

.bottom-nav-btn.v-btn--active {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  transform: translateY(-2px);
}

.bottom-nav-btn .v-btn__content {
  flex-direction: column;
  height: auto;
}

/* Cursor pointer for clickable elements */
.cursor-pointer {
  cursor: pointer;
}
/* Adjust icon positioning in rail mode */
.v-navigation-drawer--rail .nav-item {
  padding-left: 4px !important;
}

/* Active indicator as perfect circle in rail mode */
.v-navigation-drawer--rail .navigation-list .v-list-item--active.nav-item {
  margin: 8px auto !important;
}
.v-navigation-drawer--rail
  .navigation-list
  .v-list-item--active.nav-item
  .v-list-item__prepend-icon {
  color: var(--v-theme-primary) !important;
}
</style>
