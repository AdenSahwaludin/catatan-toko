<template>
  <div>
    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col
        cols="12"
        sm="6"
        md="4"
        v-for="card in summaryCards"
        :key="card.title"
      >
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center">
            <v-avatar :color="card.color" size="48" class="mr-3">
              <v-icon :icon="card.icon" size="24" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ card.value }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ card.title }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Aksi Cepat</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-btn
                  color="primary"
                  size="large"
                  block
                  @click="$router.push('/employee/input-sales')"
                  prepend-icon="mdi-cash-plus"
                >
                  Input Penjualan
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-btn
                  color="secondary"
                  size="large"
                  block
                  @click="$router.push('/employee/items')"
                  prepend-icon="mdi-package-variant"
                >
                  Lihat Barang
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-btn
                  color="info"
                  size="large"
                  block
                  @click="$router.push('/employee/sales')"
                  prepend-icon="mdi-history"
                >
                  Riwayat Penjualan
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Sales -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Penjualan Terbaru Saya</v-card-title>

          <v-card-text>
            <v-data-table
              :headers="salesHeaders"
              :items="recentSales"
              :loading="loading"
              hide-default-footer
              density="compact"
            >
              <template #item.total="{ item }">
                {{ formatCurrency(item.total) }}
              </template>

              <template #item.created_at="{ item }">
                {{ formatDateTime(item.created_at) }}
              </template>

              <template #item.edited_by_admin="{ item }">
                <v-chip
                  v-if="item.edited_by_admin"
                  color="warning"
                  size="small"
                  variant="tonal"
                >
                  Diedit Admin
                </v-chip>
              </template>

              <template #no-data>
                <div class="text-center text-medium-emphasis py-4">
                  <v-icon size="48" class="mb-2">mdi-cash-register</v-icon>
                  <div>Belum ada penjualan</div>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDataStore } from "@/stores/data";
import { formatCurrency, formatDateTime } from "@/utils/helpers";

const authStore = useAuthStore();
const dataStore = useDataStore();
const loading = ref(false);

const salesHeaders = [
  { title: "Total", key: "total" },
  { title: "Tanggal", key: "created_at" },
  { title: "Status", key: "edited_by_admin" },
];

const recentSales = computed(() => {
  return dataStore.sales
    .filter(
      (sale) => sale.employee_id === authStore.user?.id && !sale.is_deleted
    )
    .slice(0, 5);
});

const summaryCards = computed(() => [
  {
    title: "Penjualan Hari Ini",
    value: formatCurrency(todaysSales.value),
    icon: "mdi-cash",
    color: "success",
  },
  {
    title: "Total Penjualan Saya",
    value: mySalesCount.value,
    icon: "mdi-cash-register",
    color: "primary",
  },
  {
    title: "Rata-rata Harian",
    value: formatCurrency(dailyAverage.value),
    icon: "mdi-chart-line",
    color: "info",
  },
]);

const todaysSales = computed(() => {
  const today = new Date().toISOString().split("T")[0];
  return dataStore.sales
    .filter(
      (sale) =>
        sale.employee_id === authStore.user?.id &&
        sale.created_at.startsWith(today) &&
        !sale.is_deleted
    )
    .reduce((sum, sale) => sum + sale.total, 0);
});

const mySalesCount = computed(() => {
  return dataStore.sales.filter(
    (sale) => sale.employee_id === authStore.user?.id && !sale.is_deleted
  ).length;
});

const dailyAverage = computed(() => {
  const mySales = dataStore.sales.filter(
    (sale) => sale.employee_id === authStore.user?.id && !sale.is_deleted
  );

  if (mySales.length === 0) return 0;

  const totalAmount = mySales.reduce((sum, sale) => sum + sale.total, 0);
  const uniqueDays = new Set(
    mySales.map((sale) => sale.created_at.split("T")[0])
  ).size;

  return uniqueDays > 0 ? totalAmount / uniqueDays : 0;
});

onMounted(async () => {
  loading.value = true;
  try {
    await dataStore.fetchSales({
      employee_id: authStore.user?.id,
      hideDeleted: true,
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  } finally {
    loading.value = false;
  }
});
</script>
