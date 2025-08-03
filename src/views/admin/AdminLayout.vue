<template>
  <v-app>
    <!-- Modern Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      class="modern-drawer"
      elevation="0"
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
              Catatan Toko
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
          @click="drawer = !drawer"
          class="d-lg-none"
        />
      </template>

      <v-app-bar-title class="text-h6 font-weight-medium">
        {{ currentPageTitle }}
      </v-app-bar-title>

      <v-spacer />

      <!-- Header actions -->
      <div class="header-actions d-flex align-center">
        <!-- Notifications -->
        <v-btn icon="mdi-bell-outline" variant="text" class="mr-2">
          <v-icon>mdi-bell-outline</v-icon>
          <v-badge color="error" content="3" floating />
        </v-btn>

        <!-- Theme toggle -->
        <v-btn
          :icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          variant="text"
          @click="themeStore.toggleTheme"
          class="mr-2"
        />

        <!-- User menu -->
        <v-menu>
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
      </div>
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="modern-main">
      <div class="content-wrapper pa-6">
        <router-view />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const drawer = ref(true);
const rail = ref(false);

const menuItems = [
  {
    title: "Dashboard",
    icon: "mdi-view-dashboard-outline",
    to: "/admin",
    subtitle: "Overview & Stats",
  },
  {
    title: "Items",
    icon: "mdi-package-variant-closed",
    to: "/admin/items",
    subtitle: "Product Management",
    badge: "125",
    badgeColor: "success",
  },
  {
    title: "Categories",
    icon: "mdi-tag-multiple-outline",
    to: "/admin/categories",
    subtitle: "Product Categories",
  },
  {
    title: "Employees",
    icon: "mdi-account-group-outline",
    to: "/admin/employees",
    subtitle: "Staff Management",
  },
  {
    title: "Sales",
    icon: "mdi-chart-line",
    to: "/admin/sales",
    subtitle: "Transaction History",
    badge: "New",
    badgeColor: "error",
  },
  {
    title: "Reports",
    icon: "mdi-chart-box-outline",
    to: "/admin/reports",
    subtitle: "Analytics & Reports",
  },
  {
    title: "Settings",
    icon: "mdi-cog-outline",
    to: "/admin/settings",
    subtitle: "App Configuration",
  },
];

const currentPageTitle = computed(() => {
  const item = menuItems.find((item) => item.to === route.path);
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
}

.v-theme--dark .modern-drawer {
  background: rgba(30, 41, 59, 0.98);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
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
  .modern-drawer {
    position: fixed !important;
  }
}
</style>
