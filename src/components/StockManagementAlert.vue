<template>
  <v-alert
    v-if="!settingsStore.isStockManagementEnabled"
    type="info"
    variant="tonal"
    class="mb-4"
    icon="mdi-information-outline"
  >
    <div class="d-flex align-center justify-space-between">
      <div>
        <div class="text-subtitle-2 font-weight-bold">
          Manajemen Stok Dinonaktifkan
        </div>
        <div class="text-body-2">
          Fitur manajemen stok saat ini dinonaktifkan. Operasi terkait stok
          tidak akan berjalan.
        </div>
      </div>
      <v-btn
        v-if="showEnableButton"
        color="primary"
        size="small"
        variant="outlined"
        @click="$emit('enable-stock-management')"
        prepend-icon="mdi-cog"
      >
        Aktifkan
      </v-btn>
    </div>
  </v-alert>
</template>

<script setup>
import { useSettingsStore } from "@/stores/settings";

const settingsStore = useSettingsStore();

defineProps({
  showEnableButton: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["enable-stock-management"]);
</script>
