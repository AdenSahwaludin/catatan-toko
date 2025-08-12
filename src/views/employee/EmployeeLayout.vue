<template>
  <BaseLayout
    role="employee"
    :menu-items="menuItems"
    brand-title="Mega Teknik Elektronik"
    brand-icon="mdi-storefront-outline"
  />
</template>

<script setup>
import { useLayoutConfig } from "@/composables/useLayoutConfig";
import BaseLayout from "@/components/base/BaseLayout.vue";

// Get layout configuration for employee role
const { menuItems } = useLayoutConfig("employee");
</script>

<style scoped>
/* Employee-specific custom styles if needed */
</style>
