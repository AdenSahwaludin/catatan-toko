import { computed } from "vue";
import { useDataStore } from "@/stores/data";

/**
 * Layout configuration composable
 * Provides menu items and navigation config for different user roles
 */
export function useLayoutConfig(role) {
  const dataStore = useDataStore();

  // Admin menu items
  const adminMenuItems = computed(() => [
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
      title: "Input Sales",
      shortTitle: "Input",
      icon: "mdi-cash-register",
      to: "/admin/input-sales",
      subtitle: "Create New Sales",
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

  // Employee menu items
  const employeeMenuItems = computed(() => [
    {
      title: "Dashboard",
      icon: "mdi-view-dashboard",
      to: "/employee",
      subtitle: "Overview",
    },
    {
      title: "Daftar Barang",
      icon: "mdi-package-variant",
      to: "/employee/items",
      subtitle: "Browse Products",
    },
    {
      title: "Input Penjualan",
      icon: "mdi-cash-plus",
      to: "/employee/input-sales",
      subtitle: "Create Sales",
    },
    {
      title: "Riwayat Penjualan",
      icon: "mdi-history",
      to: "/employee/sales",
      subtitle: "Sales History",
    },
  ]);

  // Get menu items based on role
  const menuItems = computed(() => {
    return role === "admin" ? adminMenuItems.value : employeeMenuItems.value;
  });

  // Layout configuration
  const layoutConfig = computed(() => ({
    role,
    menuItems: menuItems.value,
    brandTitle: "Mega Teknik Elektronik",
    brandIcon: "mdi-storefront-outline",
    supportsBigNavigation: role === "admin",
    supportsBottomNav: role === "admin",
    supportsRailMode: role === "admin",
    supportsNotifications: role === "admin",
    supportsAdvancedUserMenu: role === "admin",
  }));

  return {
    menuItems,
    layoutConfig,
  };
}
