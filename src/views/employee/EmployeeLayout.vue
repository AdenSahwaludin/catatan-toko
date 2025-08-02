<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      :temporary="mobile"
      app
    >
      <v-list>
        <!-- Header -->
        <v-list-item class="px-4 py-3">
          <v-list-item-avatar>
            <v-icon size="40" color="primary">mdi-account</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-h6 font-weight-bold">
              Employee
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ authStore.user?.email }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-divider />

        <!-- Navigation Items -->
        <v-list nav>
          <v-list-item
            v-for="item in navigationItems"
            :key="item.title"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            exact
          />
        </v-list>
      </v-list>

      <template #append>
        <v-divider />
        <v-list nav>
          <v-list-item
            @click="handleLogout"
            prepend-icon="mdi-logout"
            title="Keluar"
            color="error"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>{{ currentPageTitle }}</v-toolbar-title>

      <v-spacer />

      <!-- Theme Toggle -->
      <v-btn icon @click="themeStore.toggleTheme()">
        <v-icon>{{
          themeStore.isDark ? "mdi-weather-sunny" : "mdi-weather-night"
        }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-4">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";

const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const drawer = ref(!mobile.value);

const navigationItems = [
  { title: "Dashboard", icon: "mdi-view-dashboard", to: "/employee" },
  {
    title: "Daftar Barang",
    icon: "mdi-package-variant",
    to: "/employee/items",
  },
  {
    title: "Input Penjualan",
    icon: "mdi-cash-plus",
    to: "/employee/input-sales",
  },
  { title: "Riwayat Penjualan", icon: "mdi-history", to: "/employee/sales" },
];

const currentPageTitle = computed(() => {
  const item = navigationItems.find((item) => item.to === route.path);
  return item?.title || "Employee Panel";
});

const handleLogout = async () => {
  const result = await authStore.signOut();
  if (result.success) {
    router.push("/");
  }
};
</script>
