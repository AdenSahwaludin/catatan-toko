<template>
  <div>
    <!-- Header Card -->
    <SmartCard
      title="Manajemen Penjualan"
      icon="mdi-cash-register"
      :badge="filteredSales.length"
      badge-color="success"
      class="mb-4"
    >
      <template #subtitle>
        Total penjualan: {{ formatCurrency(totalSales) }}
      </template>
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          variant="tonal"
          @click="$router.push('/admin/input-sales')"
          class="me-2"
        >
          Input Penjualan
        </v-btn>
        <v-btn
          color="info"
          prepend-icon="mdi-file-excel"
          variant="tonal"
          @click="exportData"
          :loading="exporting"
        >
          Export
        </v-btn>
      </template>
    </SmartCard>

    <!-- Sales Data Table -->
    <SmartDataTable
      :items="filteredSales"
      :headers="headers"
      :loading="loading"
      :search-value="search"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      search-label="Cari penjualan..."
      search-placeholder="ID, employee, atau total"
      :filters="filters"
      :filter-options="filterOptions"
      :default-actions="tableActions"
      empty-title="Belum Ada Data Penjualan"
      empty-text="Data penjualan akan tampil di sini"
      :empty-action="{
        text: 'Input Penjualan',
        icon: 'mdi-plus',
        handler: () => $router.push('/admin/input-sales'),
      }"
      @update:search="search = $event"
      @update:page="currentPage = $event"
      @update:items-per-page="itemsPerPage = $event"
      @update:filters="filters = $event"
    >
      <!-- Custom item slots -->
      <template #item.employee_email="{ item }">
        <div class="d-flex align-center">
          <v-avatar color="info" size="32" class="mr-3">
            <v-icon size="16">mdi-account</v-icon>
          </v-avatar>
          <div>
            <div class="font-weight-medium">
              {{ employeeNames[item.employee_id] || 'Loading...' }}
            </div>
          </div>
        </div>
      </template>

      <template #item.total="{ item }">
        <v-chip color="success" variant="tonal" size="small">
          {{ formatCurrency(item.total) }}
        </v-chip>
      </template>

      <template #item.created_at="{ item }">
        <div>
          <div>{{ formatDate(item.created_at) }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ formatTime(item.created_at) }}
          </div>
        </div>
      </template>

      <template #item.edit_status="{ item }">
        <v-chip
          :color="item.edited_by_admin ? 'warning' : 'success'"
          variant="tonal"
          size="small"
        >
          {{ item.edited_by_admin ? "Diedit Admin" : "Original" }}
        </v-chip>
      </template>
    </SmartDataTable>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="600px">
      <v-card v-if="selectedSale">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-receipt</v-icon>
          Detail Penjualan #{{ selectedSale.id }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-list-item>
                <v-list-item-title>Employee</v-list-item-title>
                <v-list-item-subtitle>{{
                  getEmployeeName(selectedSale.employee_id)
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col cols="12" md="6">
              <v-list-item>
                <v-list-item-title>Total</v-list-item-title>
                <v-list-item-subtitle>{{
                  formatCurrency(selectedSale.total)
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col cols="12" md="6">
              <v-list-item>
                <v-list-item-title>Tanggal</v-list-item-title>
                <v-list-item-subtitle>{{
                  formatDateTime(selectedSale.created_at)
                }}</v-list-item-subtitle>
              </v-list-item>
            </v-col>
            <v-col cols="12" md="6">
              <v-list-item>
                <v-list-item-title>Status</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip
                    :color="
                      selectedSale.edited_by_admin ? 'warning' : 'success'
                    "
                    size="small"
                    variant="tonal"
                  >
                    {{
                      selectedSale.edited_by_admin ? "Diedit Admin" : "Original"
                    }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <h3 class="mb-3">Item yang Dijual</h3>
          <v-table v-if="selectedSale.details && selectedSale.details.length">
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="detail in selectedSale.details" :key="detail.name">
                <td>{{ detail.name }}</td>
                <td>{{ detail.quantity }}</td>
                <td>{{ formatCurrency(detail.price) }}</td>
                <td>{{ formatCurrency(detail.quantity * detail.price) }}</td>
              </tr>
            </tbody>
          </v-table>

          <!-- Edit Log -->
          <div
            v-if="selectedSale.edit_log && selectedSale.edit_log.length"
            class="mt-4"
          >
            <v-divider class="mb-3" />
            <h3 class="mb-3">Riwayat Perubahan</h3>
            <v-timeline density="compact" align="start">
              <v-timeline-item
                v-for="(log, index) in selectedSale.edit_log"
                :key="index"
                dot-color="warning"
                size="small"
              >
                <div>
                  <div class="text-body-2 font-weight-medium">
                    {{ log.action }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDateTime(log.timestamp) }} - {{ log.admin_email }}
                  </div>
                  <div v-if="log.changes" class="text-caption mt-1">
                    {{ log.changes }}
                  </div>
                </div>
              </v-timeline-item>
            </v-timeline>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500px" persistent>
      <v-card v-if="editingSale">
        <v-card-title>Edit Total Penjualan</v-card-title>

        <v-card-text>
          <v-form ref="editForm" @submit.prevent="saveSale">
            <v-text-field
              v-model.number="editForm.total"
              label="Total Penjualan"
              type="number"
              variant="outlined"
              prefix="Rp"
              :rules="[validateInput.required, validateInput.positiveNumber]"
              required
            />
            <v-textarea
              v-model="editForm.reason"
              label="Alasan Perubahan"
              variant="outlined"
              rows="3"
              :rules="[validateInput.required]"
              required
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeEditDialog">Batal</v-btn>
          <v-btn color="primary" @click="saveSale" :loading="saving">
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Konfirmasi Hapus</v-card-title>
        <v-card-text>
          <p>Yakin ingin menghapus penjualan ini?</p>
          <v-alert type="warning" variant="tonal" class="mt-3">
            Data yang dihapus tidak dapat dikembalikan.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Batal</v-btn>
          <v-btn color="error" @click="deleteSale" :loading="deleting">
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDataStore } from "@/stores/data";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/utils/supabase";
import {
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  validateInput,
} from "@/utils/helpers";
import SmartCard from "@/components/ui/SmartCard.vue";
import SmartDataTable from "@/components/ui/SmartDataTable.vue";

const dataStore = useDataStore();
const authStore = useAuthStore();

const loading = ref(false);
const exporting = ref(false);
const saving = ref(false);
const deleting = ref(false);
const search = ref("");
const filters = ref({});

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(15);

// Dialogs
const detailDialog = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);

// Selected items
const selectedSale = ref(null);
const editingSale = ref(null);
const saleToDelete = ref(null);

// Forms
const editForm = ref({
  total: 0,
  reason: "",
});
const editFormRef = ref();

const headers = [
  { title: "Employee", key: "employee_email", sortable: true },
  { title: "Total", key: "total", sortable: true },
  { title: "Status", key: "edit_status", sortable: false },
  { title: "Tanggal", key: "created_at", sortable: true },
];

const filterOptions = computed(() => ({
  status: [
    { title: "Original", value: "original" },
    { title: "Diedit Admin", value: "edited" },
  ],
  employee: dataStore.users && Array.isArray(dataStore.users) 
    ? dataStore.users.map((user) => ({
        title: user.email,
        value: user.id,
      }))
    : [],
}));

const tableActions = [
  {
    key: "view",
    icon: "mdi-eye",
    color: "primary",
    handler: (item) => showDetails(item),
  },
  {
    key: "edit",
    icon: "mdi-pencil",
    color: "warning",
    handler: (item) => openEditDialog(item),
  },
  {
    key: "delete",
    icon: "mdi-delete",
    color: "error",
    handler: (item) => confirmDelete(item),
  },
];

const filteredSales = computed(() => {
  if (!dataStore.sales || !Array.isArray(dataStore.sales)) {
    return [];
  }
  
  let sales = dataStore.sales.filter((sale) => !sale.is_deleted);

  // Apply filters
  if (filters.value.status) {
    if (filters.value.status === "edited") {
      sales = sales.filter((sale) => sale.edited_by_admin);
    } else if (filters.value.status === "original") {
      sales = sales.filter((sale) => !sale.edited_by_admin);
    }
  }

  if (filters.value.employee) {
    sales = sales.filter((sale) => sale.employee_id === filters.value.employee);
  }

  // Apply search
  if (!search.value) return sales;

  const searchLower = search.value.toLowerCase();
  return sales.filter(
    (sale) =>
      sale.id.toString().includes(searchLower) ||
      getEmployeeName(sale.employee_id).toLowerCase().includes(searchLower) ||
      sale.total.toString().includes(searchLower)
  );
});

const totalSales = computed(() => {
  return filteredSales.value.reduce((sum, sale) => sum + sale.total, 0);
});

const getEmployeeName = (employeeId) => {
  if (!dataStore.users || !Array.isArray(dataStore.users) || dataStore.users.length === 0) {
    return "Loading...";
  }
  const user = dataStore.users.find((u) => u.id === employeeId);
  return user ? user.email : "Employee tidak ditemukan";
};

// Computed property untuk memastikan reaktivitas
const employeeNames = computed(() => {
  const names = {};
  if (dataStore.users && Array.isArray(dataStore.users)) {
    dataStore.users.forEach(user => {
      names[user.id] = user.email;
    });
  }
  return names;
});

const showDetails = (sale) => {
  selectedSale.value = sale;
  detailDialog.value = true;
};

const openEditDialog = (sale) => {
  editingSale.value = sale;
  editForm.value = {
    total: sale.total,
    reason: "",
  };
  editDialog.value = true;
};

const closeEditDialog = () => {
  editDialog.value = false;
  editingSale.value = null;
  if (editFormRef.value) {
    editFormRef.value.reset();
  }
};

const saveSale = async () => {
  if (!editFormRef.value) return;

  const { valid } = await editFormRef.value.validate();
  if (!valid) return;

  saving.value = true;

  try {
    const now = new Date().toISOString();
    const editLog = editingSale.value.edit_log || [];

    editLog.push({
      action: "Edit total penjualan",
      admin_email: authStore.user.email,
      timestamp: now,
      changes: `Total diubah dari ${formatCurrency(
        editingSale.value.total
      )} ke ${formatCurrency(editForm.value.total)}`,
      reason: editForm.value.reason,
    });

    const { error } = await supabase
      .from("sales")
      .update({
        total: editForm.value.total,
        edited_by_admin: true,
        edit_log: editLog,
      })
      .eq("id", editingSale.value.id);

    if (error) throw error;

    await dataStore.fetchSales();
    closeEditDialog();
  } catch (error) {
    console.error("Error updating sale:", error);
    alert("Terjadi kesalahan saat menyimpan data");
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
    const { error } = await supabase
      .from("sales")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", saleToDelete.value.id);

    if (error) throw error;

    await dataStore.fetchSales();
    deleteDialog.value = false;
    saleToDelete.value = null;
  } catch (error) {
    console.error("Error deleting sale:", error);
    alert("Terjadi kesalahan saat menghapus data");
  } finally {
    deleting.value = false;
  }
};

const exportData = async () => {
  exporting.value = true;

  try {
    const { utils, writeFile } = await import("xlsx");

    const exportData = filteredSales.value.map((sale) => ({
      ID: sale.id,
      Employee: getEmployeeName(sale.employee_id),
      Total: sale.total,
      "Items Count": sale.details ? sale.details.length : 0,
      Tanggal: formatDateTime(sale.created_at),
      Status: sale.edited_by_admin ? "Diedit Admin" : "Original",
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sales Data");

    writeFile(wb, `sales_${new Date().toISOString().split("T")[0]}.xlsx`);
  } catch (error) {
    console.error("Error exporting data:", error);
    alert("Terjadi kesalahan saat export data");
  } finally {
    exporting.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    // Gunakan fetchInitialData untuk loading yang optimal dengan caching
    await dataStore.fetchInitialData();
    
    // Fetch sales secara terpisah jika belum ada data
    if (dataStore.sales.length === 0) {
      await dataStore.fetchSales();
    }
    
    console.log('Users loaded:', dataStore.users?.length, dataStore.users);
    console.log('Sales loaded:', dataStore.sales?.length);
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    loading.value = false;
  }
});

// Watcher untuk reset pagination
watch([search, filters], () => {
  currentPage.value = 1;
}, { deep: true });

// Watcher untuk memastikan data users ter-load
watch(() => dataStore.users, (newUsers) => {
  console.log('Users data changed:', newUsers?.length);
}, { immediate: true, deep: true });
</script>

<style scoped>
/* Custom styles handled by SmartCard and SmartDataTable */
</style>
