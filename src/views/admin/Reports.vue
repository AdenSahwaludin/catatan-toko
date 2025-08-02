<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">Laporan Penjualan</h2>
      </v-col>
    </v-row>

    <!-- Filter Controls -->
    <v-card class="mb-4">
      <v-card-title>Filter Laporan</v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.dateFrom"
              label="Dari Tanggal"
              type="date"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.dateTo"
              label="Sampai Tanggal"
              type="date"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.employee"
              :items="employeeOptions"
              label="Karyawan"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.groupBy"
              :items="groupByOptions"
              label="Kelompokkan"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" class="text-right">
            <v-btn
              color="primary"
              @click="generateReport"
              prepend-icon="mdi-refresh"
              class="mr-2"
            >
              Generate Laporan
            </v-btn>

            <v-btn
              color="success"
              @click="exportToPDF"
              prepend-icon="mdi-file-pdf-box"
              class="mr-2"
              :disabled="reportData.length === 0"
            >
              Export PDF
            </v-btn>

            <v-btn
              color="info"
              @click="exportToExcel"
              prepend-icon="mdi-file-excel"
              :disabled="reportData.length === 0"
            >
              Export Excel
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Summary Cards -->
    <v-row class="mb-4" v-if="reportSummary">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="success" size="48" class="mr-3">
              <v-icon size="24">mdi-cash</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(reportSummary.totalRevenue) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Total Pendapatan
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="48" class="mr-3">
              <v-icon size="24">mdi-cash-register</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ reportSummary.totalTransactions }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Total Transaksi
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="info" size="48" class="mr-3">
              <v-icon size="24">mdi-chart-line</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(reportSummary.averageTransaction) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Rata-rata per Transaksi
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="warning" size="48" class="mr-3">
              <v-icon size="24">mdi-calendar</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(reportSummary.dailyAverage) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Rata-rata Harian
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Report Table -->
    <v-card v-if="reportData.length > 0">
      <v-card-title>Data Laporan</v-card-title>

      <v-data-table
        :headers="reportHeaders"
        :items="reportData"
        :loading="loading"
        density="compact"
      >
        <template #item.total="{ item }">
          {{ formatCurrency(item.total) }}
        </template>

        <template #item.date="{ item }" v-if="filters.groupBy === 'date'">
          {{ formatDate(item.date) }}
        </template>

        <template #item.average="{ item }">
          {{ formatCurrency(item.average) }}
        </template>
      </v-data-table>
    </v-card>

    <!-- No Data State -->
    <v-card v-else-if="!loading" class="text-center pa-8">
      <v-icon size="64" class="mb-4" color="grey">mdi-chart-box-outline</v-icon>
      <h3 class="mb-2">Belum Ada Data</h3>
      <p class="text-medium-emphasis">
        Silakan atur filter dan klik "Generate Laporan"
      </p>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useDataStore } from "@/stores/data";
import {
  formatCurrency,
  formatDate,
  exportToPDF as exportPDF,
  exportToExcel as exportExcel,
} from "@/utils/helpers";

const dataStore = useDataStore();

const loading = ref(false);
const reportData = ref([]);
const reportSummary = ref(null);

const filters = ref({
  dateFrom: "",
  dateTo: "",
  employee: "",
  groupBy: "employee",
});

const groupByOptions = [
  { title: "Per Karyawan", value: "employee" },
  { title: "Per Tanggal", value: "date" },
  { title: "Per Bulan", value: "month" },
];

const employeeOptions = computed(() => [
  { title: "Semua Karyawan", value: "" },
  ...dataStore.employees.map((emp) => ({
    title: emp.email,
    value: emp.id,
  })),
]);

const reportHeaders = computed(() => {
  const baseHeaders = [
    { title: "Total Penjualan", key: "total", sortable: true },
    { title: "Jumlah Transaksi", key: "count", sortable: true },
    { title: "Rata-rata", key: "average", sortable: true },
  ];

  switch (filters.value.groupBy) {
    case "employee":
      return [
        { title: "Karyawan", key: "employee", sortable: true },
        ...baseHeaders,
      ];
    case "date":
      return [
        { title: "Tanggal", key: "date", sortable: true },
        ...baseHeaders,
      ];
    case "month":
      return [{ title: "Bulan", key: "month", sortable: true }, ...baseHeaders];
    default:
      return baseHeaders;
  }
});

const generateReport = async () => {
  loading.value = true;

  try {
    // Fetch fresh sales data with filters
    const salesFilters = {
      hideDeleted: true,
    };

    if (filters.value.dateFrom) {
      salesFilters.start_date = filters.value.dateFrom;
    }

    if (filters.value.dateTo) {
      const endDate = new Date(filters.value.dateTo);
      endDate.setHours(23, 59, 59, 999);
      salesFilters.end_date = endDate.toISOString();
    }

    if (filters.value.employee) {
      salesFilters.employee_id = filters.value.employee;
    }

    await dataStore.fetchSales(salesFilters);

    // Process data based on groupBy
    const processedData = processReportData(dataStore.sales);
    reportData.value = processedData;

    // Calculate summary
    reportSummary.value = calculateSummary(dataStore.sales);
  } catch (error) {
    console.error("Error generating report:", error);
    alert("Terjadi kesalahan saat membuat laporan");
  } finally {
    loading.value = false;
  }
};

const processReportData = (sales) => {
  const groupedData = {};

  sales.forEach((sale) => {
    let key;

    switch (filters.value.groupBy) {
      case "employee":
        key = sale.users?.email || "Unknown";
        break;
      case "date":
        key = sale.created_at.split("T")[0];
        break;
      case "month":
        const date = new Date(sale.created_at);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        break;
      default:
        key = "all";
    }

    if (!groupedData[key]) {
      groupedData[key] = {
        total: 0,
        count: 0,
        sales: [],
      };
    }

    groupedData[key].total += sale.total;
    groupedData[key].count += 1;
    groupedData[key].sales.push(sale);
  });

  // Convert to array and add computed fields
  return Object.entries(groupedData)
    .map(([key, data]) => {
      const result = {
        total: data.total,
        count: data.count,
        average: data.count > 0 ? data.total / data.count : 0,
      };

      switch (filters.value.groupBy) {
        case "employee":
          result.employee = key;
          break;
        case "date":
          result.date = key;
          break;
        case "month":
          const [year, month] = key.split("-");
          const monthNames = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
          ];
          result.month = `${monthNames[parseInt(month) - 1]} ${year}`;
          break;
      }

      return result;
    })
    .sort((a, b) => b.total - a.total);
};

const calculateSummary = (sales) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const averageTransaction =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Calculate daily average
  const uniqueDates = [
    ...new Set(sales.map((sale) => sale.created_at.split("T")[0])),
  ];
  const dailyAverage =
    uniqueDates.length > 0 ? totalRevenue / uniqueDates.length : 0;

  return {
    totalRevenue,
    totalTransactions,
    averageTransaction,
    dailyAverage,
  };
};

const exportToPDF = () => {
  const title = `Laporan Penjualan - ${
    filters.value.groupBy === "employee"
      ? "Per Karyawan"
      : filters.value.groupBy === "date"
      ? "Per Tanggal"
      : "Per Bulan"
  }`;

  const columns = reportHeaders.value.map((header) => ({
    title: header.title,
    key: header.key,
    format:
      header.key === "total" || header.key === "average" ? "currency" : null,
  }));

  exportPDF(reportData.value, title, columns);
};

const exportToExcel = () => {
  const title = `Laporan Penjualan - ${
    filters.value.groupBy === "employee"
      ? "Per Karyawan"
      : filters.value.groupBy === "date"
      ? "Per Tanggal"
      : "Per Bulan"
  }`;

  const columns = reportHeaders.value.map((header) => ({
    title: header.title,
    key: header.key,
    format:
      header.key === "total" || header.key === "average" ? "currency" : null,
  }));

  exportExcel(reportData.value, title, columns);
};

onMounted(async () => {
  // Set default date range (last 30 days)
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setDate(today.getDate() - 30);

  filters.value.dateTo = today.toISOString().split("T")[0];
  filters.value.dateFrom = lastMonth.toISOString().split("T")[0];

  // Load initial data
  try {
    await dataStore.fetchEmployees();
  } catch (error) {
    console.error("Error loading employees:", error);
  }
});
</script>
