<template>
  <BaseLayout
    role="admin"
    :menu-items="menuItems"
    brand-title="Mega Teknik Elektronik"
    brand-icon="mdi-storefront-outline"
  />
</template>

<script setup>
import { useLayoutConfig } from "@/composables/useLayoutConfig";
import BaseLayout from "@/components/base/BaseLayout.vue";

// Get layout configuration for admin role
const { menuItems } = useLayoutConfig("admin");
</script>

<style scoped></style>
