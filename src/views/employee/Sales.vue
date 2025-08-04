<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <h2 class="text-h5 font-weight-bold">Riwayat Penjualan Saya</h2>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn
          color="primary"
          @click="$router.push('/employee/input-sales')"
          prepend-icon="mdi-plus"
        >
          Input Penjualan Baru
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="success" size="48" class="mr-3">
              <v-icon size="24">mdi-cash</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(todayTotal) }}
              </div>
              <div class="text-caption text-medium-emphasis">Hari Ini</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="48" class="mr-3">
              <v-icon size="24">mdi-calendar-week</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(weekTotal) }}
              </div>
              <div class="text-caption text-medium-emphasis">Minggu Ini</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="info" size="48" class="mr-3">
              <v-icon size="24">mdi-calendar-month</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ formatCurrency(monthTotal) }}
              </div>
              <div class="text-caption text-medium-emphasis">Bulan Ini</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="warning" size="48" class="mr-3">
              <v-icon size="24">mdi-chart-line</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ mySales.length }}</div>
              <div class="text-caption text-medium-emphasis">
                Total Transaksi
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="dateFrom"
              label="Dari Tanggal"
              type="date"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="dateTo"
              label="Sampai Tanggal"
              type="date"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Sales Table -->
    <v-card>
      <!-- Stats Summary -->
      <v-card-text class="pb-0">
        <v-row>
          <v-col cols="12" class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <v-chip color="info" variant="tonal" class="mr-2">
                Total: {{ totalSales }} transaksi
              </v-chip>
              <v-chip
                color="primary"
                variant="tonal"
                v-if="filteredCount !== totalSales"
              >
                Ditampilkan: {{ filteredCount }} transaksi
              </v-chip>
              <v-chip
                color="success"
                variant="tonal"
                class="ml-2"
                v-if="totalPages > 1"
              >
                Halaman {{ currentPage }} dari {{ totalPages }}
              </v-chip>
            </div>

            <div class="d-flex align-center">
              <v-select
                v-model="itemsPerPage"
                :items="[10, 25, 50, 100]"
                label="Per halaman"
                density="compact"
                variant="outlined"
                hide-details
                class="mr-3"
                style="width: 140px"
              />
              <v-btn
                color="primary"
                variant="outlined"
                prepend-icon="mdi-refresh"
                @click="refreshData"
                :loading="loading"
              >
                Refresh
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <!-- Clear Filters Button -->
        <v-row v-if="hasActiveFilters" class="mt-2">
          <v-col cols="12">
            <v-btn
              color="warning"
              variant="outlined"
              prepend-icon="mdi-filter-remove"
              @click="clearFilters"
              size="small"
            >
              Hapus Semua Filter
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="text-h6 mt-3">Memuat data penjualan...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="totalSales === 0" class="text-center py-12">
        <v-icon size="120" color="grey-lighten-2">mdi-cash-register</v-icon>
        <div class="text-h5 mt-4 mb-2">Belum Ada Penjualan</div>
        <div class="text-body-1 text-medium-emphasis mb-4">
          Mulai input penjualan pertama Anda
        </div>
        <v-btn
          color="primary"
          @click="$router.push('/employee/input-sales')"
          prepend-icon="mdi-plus"
          size="large"
        >
          Input Penjualan
        </v-btn>
      </div>

      <!-- No Results State -->
      <div v-else-if="filteredCount === 0" class="text-center py-12">
        <v-icon size="120" color="grey-lighten-2">mdi-magnify</v-icon>
        <div class="text-h5 mt-4 mb-2">Tidak Ada Hasil</div>
        <div class="text-body-1 text-medium-emphasis mb-4">
          Tidak ditemukan penjualan yang sesuai dengan filter Anda
        </div>
        <v-btn
          color="warning"
          variant="outlined"
          prepend-icon="mdi-filter-remove"
          @click="clearFilters"
        >
          Hapus Semua Filter
        </v-btn>
      </div>

      <!-- Data Table with Pagination -->
      <v-data-table
        v-else
        :headers="headers"
        :items="paginatedSales"
        :loading="loading"
        item-value="id"
        density="compact"
        hide-default-footer
      >
        <template #item.total="{ item }">
          <span :class="{ 'text-error': hasBeenEdited(item) }">
            {{ formatCurrency(item.total) }}
          </span>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>

        <template #item.status="{ item }">
          <div class="d-flex flex-column gap-1">
            <v-chip
              v-if="item.edited_by_admin"
              color="warning"
              size="small"
              variant="tonal"
            >
              Diedit Admin
            </v-chip>
            <v-chip
              v-if="hasEditHistory(item)"
              color="info"
              size="small"
              variant="tonal"
              @click="showEditHistory(item)"
              class="cursor-pointer"
            >
              Lihat Histori
            </v-chip>
          </div>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(item)"
            :disabled="!canEdit(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
            :disabled="!canEdit(item)"
          />
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="viewDetails(item)"
          />
        </template>

        <template #no-data>
          <div class="text-center text-medium-emphasis py-8">
            <v-icon size="64" class="mb-4">mdi-cash-register</v-icon>
            <div class="text-h6 mb-2">Belum Ada Penjualan</div>
            <div class="mb-4">Mulai input penjualan pertama Anda</div>
            <v-btn
              color="primary"
              @click="$router.push('/employee/input-sales')"
              prepend-icon="mdi-plus"
            >
              Input Penjualan
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- Custom Pagination -->
      <div
        v-if="totalPages > 1"
        class="d-flex justify-center align-center pa-4"
      >
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="comfortable"
          color="primary"
        />
      </div>
    </v-card>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>Edit Penjualan</v-card-title>

        <v-card-text>
          <v-form ref="editForm" @submit.prevent="saveSaleEdit">
            <v-text-field
              v-model="editData.total"
              label="Total Penjualan"
              type="number"
              variant="outlined"
              prefix="Rp"
              :rules="[validateInput.required, validateInput.minAmount]"
              required
            />

            <v-textarea
              v-model="editData.notes"
              label="Catatan"
              variant="outlined"
              rows="3"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">Batal</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveSaleEdit">
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Hapus Penjualan</v-card-title>
        <v-card-text>
          Yakin ingin menghapus penjualan sebesar
          {{ formatCurrency(saleToDelete?.total || 0) }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Batal</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteSale">
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600px">
      <v-card v-if="selectedSale">
        <v-card-title>Detail Penjualan</v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Total</v-list-item-title>
                  <v-list-item-subtitle>{{
                    formatCurrency(selectedSale.total)
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Tanggal</v-list-item-title>
                  <v-list-item-subtitle>{{
                    formatDateTime(selectedSale.created_at)
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedSale.edited_by_admin">
                  <v-list-item-title>Status</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip color="warning" size="small">Diedit Admin</v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" sm="6">
              <div v-if="selectedSale.details?.type === 'items'">
                <h4 class="mb-2">Barang yang Dijual:</h4>
                <v-list density="compact">
                  <v-list-item
                    v-for="item in selectedSale.details.items"
                    :key="item.id"
                  >
                    <v-list-item-title>{{ item.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatCurrency(item.price) }} x {{ item.quantity }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>

              <div v-else-if="selectedSale.details?.notes">
                <h4 class="mb-2">Catatan:</h4>
                <p>{{ selectedSale.details.notes }}</p>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailsDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit History Dialog -->
    <v-dialog v-model="historyDialog" max-width="600px">
      <v-card v-if="selectedSaleHistory">
        <v-card-title>Histori Perubahan</v-card-title>

        <v-card-text>
          <v-timeline density="compact">
            <v-timeline-item
              v-for="(log, timestamp) in selectedSaleHistory.edit_log"
              :key="timestamp"
              size="small"
            >
              <template #icon>
                <v-icon size="16">mdi-pencil</v-icon>
              </template>

              <div class="mb-2">
                <div class="text-caption text-medium-emphasis">
                  {{ formatDateTime(timestamp) }}
                </div>

                <div v-if="log.action === 'deleted'">
                  <span class="text-error">Dihapus</span>
                  oleh {{ log.is_admin ? "Admin" : "Anda" }}
                </div>

                <div v-else>
                  Total diubah dari
                  <span class="text-error">{{
                    formatCurrency(log.previous_total)
                  }}</span>
                  menjadi
                  <span class="text-success">{{
                    formatCurrency(log.new_total)
                  }}</span>
                  oleh {{ log.is_admin ? "Admin" : "Anda" }}
                </div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="historyDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDataStore } from "@/stores/data";
import { updateSale, deleteSale as deleteSaleAPI } from "@/utils/supabase";
import { formatCurrency, formatDateTime, validateInput } from "@/utils/helpers";

const authStore = useAuthStore();
const dataStore = useDataStore();

const loading = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);
const detailsDialog = ref(false);
const historyDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);

// Pagination variables
const currentPage = ref(1);
const itemsPerPage = ref(25);
const totalSales = ref(0);

// Filter variables
const dateFrom = ref("");
const dateTo = ref("");
const statusFilter = ref("");

const editingItem = ref(null);
const saleToDelete = ref(null);
const selectedSale = ref(null);
const selectedSaleHistory = ref(null);
const editForm = ref();

const editData = ref({
  total: "",
  notes: "",
});

const headers = [
  { title: "Total", key: "total", sortable: true },
  { title: "Tanggal", key: "created_at", sortable: true },
  { title: "Status", key: "status", sortable: false },
  { title: "Aksi", key: "actions", sortable: false, width: 150 },
];

const statusOptions = [
  { title: "Semua", value: "" },
  { title: "Normal", value: "normal" },
  { title: "Diedit Admin", value: "edited" },
];

const mySales = computed(() => {
  const allSales = dataStore.sales.filter(
    (sale) => sale.employee_id === authStore.user?.id && !sale.is_deleted
  );

  totalSales.value = allSales.length;
  return allSales;
});

const filteredSales = computed(() => {
  let sales = [...mySales.value];

  // Date filters
  if (dateFrom.value) {
    sales = sales.filter((sale) => sale.created_at >= dateFrom.value);
  }

  if (dateTo.value) {
    const endDate = new Date(dateTo.value);
    endDate.setHours(23, 59, 59, 999);
    sales = sales.filter((sale) => new Date(sale.created_at) <= endDate);
  }

  // Status filter
  if (statusFilter.value) {
    if (statusFilter.value === "edited") {
      sales = sales.filter((sale) => sale.edited_by_admin);
    } else if (statusFilter.value === "normal") {
      sales = sales.filter((sale) => !sale.edited_by_admin);
    }
  }

  return sales;
});

// Computed for pagination
const filteredCount = computed(() => filteredSales.value.length);

const totalPages = computed(() => {
  return Math.ceil(filteredCount.value / itemsPerPage.value);
});

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSales.value.slice(start, end);
});

const hasActiveFilters = computed(() => {
  return dateFrom.value || dateTo.value || statusFilter.value;
});

const todayTotal = computed(() => {
  const today = new Date().toISOString().split("T")[0];
  return mySales.value
    .filter((sale) => sale.created_at.startsWith(today))
    .reduce((sum, sale) => sum + sale.total, 0);
});

const weekTotal = computed(() => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  return mySales.value
    .filter((sale) => new Date(sale.created_at) >= weekStart)
    .reduce((sum, sale) => sum + sale.total, 0);
});

const monthTotal = computed(() => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return mySales.value
    .filter((sale) => new Date(sale.created_at) >= monthStart)
    .reduce((sum, sale) => sum + sale.total, 0);
});

const hasBeenEdited = (sale) => {
  return Object.keys(sale.edit_log || {}).length > 0;
};

const hasEditHistory = (sale) => {
  return Object.keys(sale.edit_log || {}).length > 0;
};

const canEdit = (sale) => {
  // Employee can only edit their own sales within 24 hours
  const saleDate = new Date(sale.created_at);
  const now = new Date();
  const hoursDiff = (now - saleDate) / (1000 * 60 * 60);

  return sale.employee_id === authStore.user?.id && hoursDiff <= 24;
};

const openEditDialog = (sale) => {
  editingItem.value = sale;
  editData.value = {
    total: sale.total,
    notes: sale.details?.notes || "",
  };
  editDialog.value = true;
};

const saveSaleEdit = async () => {
  const { valid } = await editForm.value.validate();
  if (!valid) return;

  saving.value = true;

  try {
    await updateSale(
      editingItem.value.id,
      {
        total: Number(editData.value.total),
        details: {
          ...editingItem.value.details,
          notes: editData.value.notes,
        },
      },
      authStore.user.id,
      false // isAdmin
    );

    await dataStore.fetchSales({
      employee_id: authStore.user.id,
      hideDeleted: true,
    });
    editDialog.value = false;
  } catch (error) {
    console.error("Error updating sale:", error);
    alert("Terjadi kesalahan saat menyimpan perubahan");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (sale) => {
  saleToDelete.value = sale;
  deleteDialog.value = true;
};

const deleteSale = async () => {
  deleting.value = true;

  try {
    await deleteSaleAPI(saleToDelete.value.id, authStore.user.id, false);

    await dataStore.fetchSales({
      employee_id: authStore.user.id,
      hideDeleted: true,
    });
    deleteDialog.value = false;
    saleToDelete.value = null;
  } catch (error) {
    console.error("Error deleting sale:", error);
    alert("Terjadi kesalahan saat menghapus data");
  } finally {
    deleting.value = false;
  }
};

const viewDetails = (sale) => {
  selectedSale.value = sale;
  detailsDialog.value = true;
};

const showEditHistory = (sale) => {
  selectedSaleHistory.value = sale;
  historyDialog.value = true;
};

// Clear all filters
const clearFilters = () => {
  dateFrom.value = "";
  dateTo.value = "";
  statusFilter.value = "";
  currentPage.value = 1;
};

// Refresh data
const refreshData = async () => {
  loading.value = true;
  try {
    await dataStore.fetchSales({
      employee_id: authStore.user?.id,
      hideDeleted: true,
    });
  } catch (error) {
    console.error("Error refreshing sales:", error);
  } finally {
    loading.value = false;
  }
};

// Watch for filter changes and reset page
watch([dateFrom, dateTo, statusFilter], () => {
  currentPage.value = 1;
});

// Watch for items per page change and adjust current page
watch(itemsPerPage, () => {
  currentPage.value = 1;
});

onMounted(async () => {
  loading.value = true;
  try {
    // Load user's sales data
    await dataStore.fetchSales({
      employee_id: authStore.user?.id,
      hideDeleted: true,
    });
  } catch (error) {
    console.error("Error loading sales:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
