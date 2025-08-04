<template>
  <v-app>
    <!-- Modern Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      :permanent="!isMobile"
      :temporary="isMobile"
      class="modern-drawer"
      elevation="0"
      :width="isMobile ? 280 : 256"
    >
      <!-- Brand section -->
      <div class="brand-section pa-4">
        <v-avatar :size="rail ? 40 : 50" class="brand-avatar mb-2">
          <v-icon :size="rail ? 20 : 25" color="white">
            mdi-storefront-outline
          </v-icon>
        </v-avatar>

        <v-expand-transition>
          <div v-show="!rail" class="brand-text">
            <div class="text-h6 font-weight-bold text-primary">
              Mega Teknik Elektronik
            </div>
            <div class="text-caption text-medium-emphasis">Admin Panel</div>
          </div>
        </v-expand-transition>
      </div>

      <v-divider class="mx-3 mb-4"></v-divider>

      <!-- Navigation List -->
      <v-list density="comfortable" nav class="navigation-list">
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :value="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :subtitle="rail ? undefined : item.subtitle"
          class="nav-item"
          rounded="xl"
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
          <!-- Toggle rail button -->
          <v-btn
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
                    {{ authStore.user?.email?.split("@")[0] }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Administrator
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
    <v-app-bar elevation="0" class="modern-appbar" density="comfortable">
      <template #prepend>
        <v-btn
          icon="mdi-menu"
          variant="text"
          @click="toggleDrawer"
        />
      </template>

      <v-app-bar-title class="text-h6 font-weight-medium">
        {{ currentPageTitle }}
      </v-app-bar-title>

      <v-spacer />

      <!-- Header actions -->
      <div class="header-actions d-flex align-center">
        <!-- Notifications -->
        <NotificationPanel />

        <!-- Theme toggle -->
        <v-btn
          :icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          variant="text"
          @click="themeStore.toggleTheme"
          class="mr-2"
        />

        <!-- User menu - Hidden on mobile -->
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

        <!-- Mobile user avatar -->
        <v-avatar v-if="isMobile" size="32" color="primary" @click="handleLogout">
          <v-icon size="16">mdi-account</v-icon>
        </v-avatar>
      </div>
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="modern-main">
      <div class="content-wrapper pa-6" :class="{ 'pb-20': isMobile }">
        <router-view />
      </div>
    </v-main>

    <!-- Bottom Navigation for Mobile -->
    <v-bottom-navigation
      v-if="isMobile"
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
        <span class="text-caption mt-1">{{ item.shortTitle || item.title }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { useNotificationStore } from "@/stores/notifications";
import { useDataStore } from "@/stores/data";
import { useDisplay } from "vuetify";
import NotificationPanel from "@/components/NotificationPanel.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const notificationStore = useNotificationStore();
const dataStore = useDataStore();
const { mobile } = useDisplay();

const drawer = ref(true);
const rail = ref(false);
const bottomNav = ref(route.path);

// Reactive mobile detection
const isMobile = computed(() => mobile.value);

// Watch for route changes to update bottom nav
const unwatchRoute = router.afterEach((to) => {
  bottomNav.value = to.path;
  
  // Auto-close drawer on mobile after navigation
  if (isMobile.value) {
    drawer.value = false;
  }
});

// Initialize drawer state based on screen size
const initializeDrawerState = () => {
  if (isMobile.value) {
    drawer.value = false;
    rail.value = false;
  } else {
    drawer.value = true;
    rail.value = false;
  }
};

// Toggle drawer function
const toggleDrawer = () => {
  if (isMobile.value) {
    drawer.value = !drawer.value;
  } else {
    rail.value = !rail.value;
  }
};

// Initialize notifications when component mounts
onMounted(async () => {
  // Initialize drawer state
  initializeDrawerState();

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
  setInterval(() => {
    notificationStore.checkLowStock(dataStore.items);
    notificationStore.checkRecentSales(dataStore.sales);
  }, 5 * 60 * 1000);
});

// Cleanup on unmount
onUnmounted(() => {
  unwatchRoute();
});

const menuItems = computed(() => [
  {
    title: "Dashboard",
    shortTitle: "Home",
    icon: "mdi-view-dashboard-outline",
    to: "/admin",
    subtitle: "Overview & Stats",
  },
  {
    title: "Items",
    shortTitle: "Items",
    icon: "mdi-package-variant-closed",
    to: "/admin/items",
    subtitle: "Product Management",
    badge: dataStore.items.length.toString(),
    badgeColor: "success",
  },
  {
    title: "Categories",
    shortTitle: "Categories",
    icon: "mdi-tag-multiple-outline",
    to: "/admin/categories",
    subtitle: "Product Categories",
  },
  {
    title: "Employees",
    shortTitle: "Staff",
    icon: "mdi-account-group-outline",
    to: "/admin/employees",
    subtitle: "Staff Management",
  },
  {
    title: "Sales",
    shortTitle: "Sales",
    icon: "mdi-chart-line",
    to: "/admin/sales",
    subtitle: "Transaction History",
    badge:
      dataStore.sales.length > 0
        ? dataStore.sales.length.toString()
        : undefined,
    badgeColor: "error",
  },
  {
    title: "Reports",
    shortTitle: "Reports",
    icon: "mdi-chart-box-outline",
    to: "/admin/reports",
    subtitle: "Analytics & Reports",
  },
  {
    title: "Settings",
    shortTitle: "Settings",
    icon: "mdi-cog-outline",
    to: "/admin/settings",
    subtitle: "App Configuration",
  },
]);

// Primary menu items for bottom navigation (most important 5 items)
const primaryMenuItems = computed(() => [
  menuItems.value[0], // Dashboard
  menuItems.value[1], // Items
  menuItems.value[4], // Sales
  menuItems.value[5], // Reports
  menuItems.value[6], // Settings
]);

const currentPageTitle = computed(() => {
  const item = menuItems.value.find((item) => item.to === route.path);
  return item?.title || "Admin Panel";
});

const handleLogout = async () => {
  const result = await authStore.signOut();
  if (result.success) {
    router.push("/");
  }
};
</script>

<style scoped>
/* Modern drawer styling */
.modern-drawer {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 1005;
}

.v-theme--dark .modern-drawer {
  background: rgba(30, 41, 59, 0.98);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

/* Mobile drawer overlay */
@media (max-width: 960px) {
  .modern-drawer {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
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

.v-theme--dark .modern-main {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
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

/* Hide rail toggle on mobile */
@media (max-width: 960px) {
  .bottom-section .v-btn[class*="chevron"] {
    display: none !important;
  }
}
</style>
