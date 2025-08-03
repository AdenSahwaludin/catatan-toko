<template>
  <div class="dashboard">
    <!-- Welcome Header -->
    <div class="welcome-section mb-8">
      <v-row align="center">
        <v-col cols="12" md="8">
          <h1 class="text-h3 font-weight-bold mb-2">Welcome back! 👋</h1>
          <p class="text-h6 text-medium-emphasis">
            Here's what's happening with your store today
          </p>
        </v-col>
        <v-col cols="12" md="4" class="text-right">
          <v-chip
            color="success"
            variant="tonal"
            size="large"
            prepend-icon="mdi-calendar-today"
          >
            {{ currentDate }}
          </v-chip>
        </v-col>
      </v-row>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-8">
      <v-col
        v-for="(stat, index) in statsCards"
        :key="index"
        cols="12"
        sm="6"
        lg="3"
      >
        <v-card
          class="stat-card"
          :color="stat.color"
          variant="tonal"
          rounded="xl"
          elevation="0"
          @click="handleStatClick(stat)"
          style="cursor: pointer"
        >
          <v-card-text class="pa-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <v-avatar :color="stat.color" size="48" variant="flat">
                <v-icon :icon="stat.icon" size="24" color="white" />
              </v-avatar>

              <v-chip
                :color="stat.trend === 'up' ? 'success' : 'error'"
                variant="tonal"
                size="small"
              >
                <v-icon
                  :icon="
                    stat.trend === 'up'
                      ? 'mdi-trending-up'
                      : 'mdi-trending-down'
                  "
                  size="16"
                  start
                />
                {{ stat.change }}
              </v-chip>
            </div>

            <div class="text-h4 font-weight-bold mb-1">
              {{ stat.value }}
            </div>
            <div class="text-subtitle-1 text-medium-emphasis">
              {{ stat.title }}
            </div>
            <div class="text-caption mt-2">
              {{ stat.subtitle }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts and Activities -->
    <v-row>
      <!-- Sales Chart -->
      <v-col cols="12" lg="8">
        <v-card rounded="xl" elevation="0" class="modern-card">
          <v-card-title class="d-flex align-center justify-space-between pa-6">
            <div>
              <h3 class="text-h5 font-weight-bold">Sales Overview</h3>
              <p class="text-subtitle-2 text-medium-emphasis mb-0">
                Monthly sales performance
              </p>
            </div>
            <v-btn-toggle
              v-model="chartPeriod"
              variant="outlined"
              size="small"
              rounded="lg"
            >
              <v-btn value="week">Week</v-btn>
              <v-btn value="month">Month</v-btn>
              <v-btn value="year">Year</v-btn>
            </v-btn-toggle>
          </v-card-title>

          <v-card-text class="pa-6 pt-0">
            <div class="chart-placeholder">
              <v-icon size="64" color="primary" class="mb-4">
                mdi-chart-line
              </v-icon>
              <p class="text-subtitle-1">
                Sales chart will be implemented here
              </p>
              <p class="text-caption">Using Chart.js or similar library</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Activities -->
      <v-col cols="12" lg="4">
        <v-card rounded="xl" elevation="0" class="modern-card h-100">
          <v-card-title class="pa-6">
            <h3 class="text-h5 font-weight-bold">Recent Activities</h3>
            <p class="text-subtitle-2 text-medium-emphasis mb-0">
              Latest store activities
            </p>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list>
              <v-list-item
                v-for="(activity, index) in recentActivities"
                :key="index"
                class="activity-item"
              >
                <template #prepend>
                  <v-avatar :color="activity.color" variant="tonal" size="40">
                    <v-icon :icon="activity.icon" size="20" />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ activity.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ activity.description }}
                </v-list-item-subtitle>

                <template #append>
                  <v-chip size="x-small" variant="text" color="medium-emphasis">
                    {{ activity.time }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-8">
      <v-col cols="12">
        <v-card rounded="xl" elevation="0" class="modern-card">
          <v-card-title class="pa-6">
            <h3 class="text-h5 font-weight-bold">Quick Actions</h3>
            <p class="text-subtitle-2 text-medium-emphasis mb-0">
              Frequently used actions
            </p>
          </v-card-title>

          <v-card-text class="pa-6 pt-0">
            <v-row>
              <v-col
                v-for="(action, index) in quickActions"
                :key="index"
                cols="12"
                sm="6"
                md="3"
              >
                <v-btn
                  :to="action.to"
                  variant="tonal"
                  :color="action.color"
                  size="large"
                  block
                  rounded="lg"
                  class="quick-action-btn"
                  @click="handleQuickAction(action)"
                >
                  <v-icon :icon="action.icon" start />
                  {{ action.title }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDataStore } from "@/stores/data";

const router = useRouter();
const dataStore = useDataStore();

const chartPeriod = ref("month");

const currentDate = computed(() => {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Calculate real-time stats from data store
const statsCards = computed(() => {
  const totalItems = dataStore.items.length;
  const totalSales = dataStore.sales.length;

  // Calculate total revenue from sales
  const totalRevenue = dataStore.sales.reduce((sum, sale) => {
    return sum + (sale.total || 0);
  }, 0);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Count low stock items (stock < 10)
  const lowStockItems = dataStore.items.filter(
    (item) => item.stock < 10
  ).length;

  return [
    {
      title: "Total Products",
      value: totalItems.toString(),
      subtitle:
        lowStockItems > 0
          ? `${lowStockItems} items low stock`
          : "Stock levels good",
      icon: "mdi-package-variant-closed",
      color: "primary",
      trend: lowStockItems > 0 ? "down" : "up",
      change: lowStockItems > 0 ? `${lowStockItems} low` : "Good",
    },
    {
      title: "Total Sales",
      value: totalSales.toString(),
      subtitle: "All time sales count",
      icon: "mdi-chart-line",
      color: "success",
      trend: "up",
      change: totalSales > 0 ? "Active" : "No sales",
    },
    {
      title: "Revenue",
      value: formatCurrency(totalRevenue),
      subtitle: "Total revenue earned",
      icon: "mdi-currency-usd",
      color: "info",
      trend: totalRevenue > 0 ? "up" : "neutral",
      change: totalRevenue > 0 ? "Earned" : "No revenue",
    },
    {
      title: "Active Staff",
      value: dataStore.employees.length.toString(),
      subtitle: "Registered employees",
      icon: "mdi-account-group",
      color: "warning",
      trend: "up",
      change: "Active",
    },
  ];
});

// Generate real recent activities from sales data
const recentActivities = computed(() => {
  const activities = [];

  // Get recent sales (last 5)
  const recentSales = dataStore.sales
    .slice(-5)
    .reverse()
    .map((sale) => ({
      title: "Sale Recorded",
      description: `Sale #${sale.id} - ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(sale.total)}`,
      time: new Date(sale.created_at).toLocaleString("id-ID"),
      icon: "mdi-cash-register",
      color: "success",
    }));

  activities.push(...recentSales);

  // Add low stock alerts
  const lowStockItems = dataStore.items.filter((item) => item.stock < 10);
  lowStockItems.slice(0, 2).forEach((item) => {
    activities.push({
      title: "Low Stock Alert",
      description: `${item.name} - Only ${item.stock} left`,
      time: "System Alert",
      icon: "mdi-alert-circle",
      color: "warning",
    });
  });

  // If no real activities, show system messages
  if (activities.length === 0) {
    activities.push({
      title: "System Ready",
      description: "Dashboard loaded successfully",
      time: new Date().toLocaleTimeString("id-ID"),
      icon: "mdi-check-circle",
      color: "success",
    });
  }

  return activities.slice(0, 5); // Limit to 5 activities
});

const quickActions = ref([
  {
    title: "Add Product",
    icon: "mdi-plus-circle",
    color: "primary",
    to: "/admin/items",
  },
  {
    title: "View Sales",
    icon: "mdi-chart-box",
    color: "success",
    to: "/admin/sales",
  },
  {
    title: "Generate Report",
    icon: "mdi-file-export",
    color: "info",
    to: "/admin/reports",
  },
  {
    title: "Manage Staff",
    icon: "mdi-account-cog",
    color: "warning",
    to: "/admin/employees",
  },
]);

const handleQuickAction = (action) => {
  console.log("Quick action clicked:", action);
  try {
    router.push(action.to);
  } catch (error) {
    console.error("Router navigation error:", error);
  }
};

const handleStatClick = (stat) => {
  console.log("Stat card clicked:", stat.title);
  // Navigate based on stat type
  switch (stat.title) {
    case "Total Products":
      router.push("/admin/items");
      break;
    case "Total Sales":
      router.push("/admin/sales");
      break;
    case "Revenue":
      router.push("/admin/reports");
      break;
    case "Active Staff":
      router.push("/admin/employees");
      break;
  }
};

onMounted(async () => {
  // Load all dashboard data
  await Promise.all([
    dataStore.fetchItems(),
    dataStore.fetchSales(),
    dataStore.fetchCategories(),
    dataStore.fetchEmployees(),
  ]);
});
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
}

.stat-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.modern-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.modern-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.v-theme--dark .modern-card {
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.v-theme--dark .modern-card:hover {
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
}

.v-theme--dark .welcome-section {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.15) 0%,
    rgba(118, 75, 162, 0.15) 100%
  );
  color: rgba(255, 255, 255, 0.9);
}

.v-theme--dark .stat-card:hover {
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.v-theme--dark .chart-placeholder {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
  color: rgba(255, 255, 255, 0.8);
}

.v-theme--dark .activity-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.chart-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  border: 2px dashed rgba(102, 126, 234, 0.2);
}

.activity-item {
  transition: all 0.3s ease;
  margin: 0 16px;
  border-radius: 12px;
}

.activity-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

.quick-action-btn {
  height: 80px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.quick-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .welcome-section {
    padding: 24px;
    text-align: center;
  }

  .welcome-section h1 {
    font-size: 2rem !important;
  }
}

@media (max-width: 600px) {
  .welcome-section {
    padding: 16px;
  }

  .welcome-section h1 {
    font-size: 1.5rem !important;
  }

  .stat-card .v-card-text {
    padding: 16px !important;
  }
}
</style>
