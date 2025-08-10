<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <h2 class="text-h5 font-weight-bold">Manajemen Penjualan</h2>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="dateFrom"
              label="Dari Tanggal"
              type="date"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="dateTo"
              label="Sampai Tanggal"
              type="date"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="selectedEmployee"
              :items="employeeOptions"
              label="Karyawan"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-switch
              v-model="showDeleted"
              label="Tampilkan yang dihapus"
              color="warning"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Data Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredSales"
        :loading="loading"
        item-value="id"
      >
        <template #item.users.email="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="24" class="mr-2">
              <v-icon size="16">mdi-account</v-icon>
            </v-avatar>
            {{ item.users?.email }}
          </div>
        </template>

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
              v-if="item.is_deleted"
              color="error"
              size="small"
              variant="tonal"
            >
              Dihapus
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
            :disabled="item.is_deleted"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
            :disabled="item.is_deleted"
          />
          <v-btn
            icon="mdi-printer"
            size="small"
            variant="text"
            color="primary"
            @click="printReceipt(item)"
          />
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="viewDetails(item)"
          />
        </template>
      </v-data-table>
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
              v-model="editData.adminNotes"
              label="Catatan Admin"
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
                  <v-list-item-title>Karyawan</v-list-item-title>
                  <v-list-item-subtitle>{{
                    selectedSale.users?.email
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Tanggal</v-list-item-title>
                  <v-list-item-subtitle>{{
                    formatDateTime(selectedSale.created_at)
                  }}</v-list-item-subtitle>
                </v-list-item>
                <!-- Payment Info -->
                <v-list-item v-if="selectedSale.paid !== null && selectedSale.paid !== undefined">
                  <v-list-item-title>Dibayar</v-list-item-title>
                  <v-list-item-subtitle>{{
                    formatCurrency(selectedSale.paid)
                  }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedSale.change !== null && selectedSale.change !== undefined">
                  <v-list-item-title>Kembalian</v-list-item-title>
                  <v-list-item-subtitle>{{
                    formatCurrency(selectedSale.change)
                  }}</v-list-item-subtitle>
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
                  oleh {{ log.is_admin ? "Admin" : "Karyawan" }}
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
                  oleh {{ log.is_admin ? "Admin" : "Karyawan" }}
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

    <!-- Receipt Modal using Nota Component -->
    <Nota 
      v-model="receiptDialog" 
      :sale-data="receiptSaleData"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDataStore } from "@/stores/data";
import { updateSale, deleteSale as deleteSaleAPI } from "@/utils/supabase";
import { formatCurrency, formatDateTime, validateInput } from "@/utils/helpers";
import Nota from "@/components/Nota.vue";

const authStore = useAuthStore();
const dataStore = useDataStore();

const loading = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);
const detailsDialog = ref(false);
const historyDialog = ref(false);
const receiptDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);

const dateFrom = ref("");
const dateTo = ref("");
const selectedEmployee = ref("");
const showDeleted = ref(false);

const editingItem = ref(null);
const saleToDelete = ref(null);
const selectedSale = ref(null);
const selectedSaleHistory = ref(null);
const editForm = ref();

const editData = ref({
  total: "",
  adminNotes: "",
});

const headers = [
  { title: "Karyawan", key: "users.email", sortable: true },
  { title: "Total", key: "total", sortable: true },
  { title: "Tanggal", key: "created_at", sortable: true },
  { title: "Status", key: "status", sortable: false },
  { title: "Aksi", key: "actions", sortable: false, width: 150 },
];

const employeeOptions = computed(() => [
  { title: "Semua Karyawan", value: "" },
  ...dataStore.employees.map((emp) => ({
    title: emp.email,
    value: emp.id,
  })),
]);

const receiptSaleData = computed(() => {
  if (!selectedSale.value) return {}
  
  // Enhance items data with complete information from database if available
  let enhancedSale = {
    ...selectedSale.value,
    kasir: selectedSale.value.users?.email?.split("@")[0] || "Admin"
  }
  
  // If this is an items sale, try to enhance the items data with current database info
  if (enhancedSale.details?.type === 'items' && enhancedSale.details?.items) {
    enhancedSale.details.items = enhancedSale.details.items.map(item => {
      // Find current item data from store to get complete brand info
      const currentItem = dataStore.items.find(dbItem => dbItem.id === item.id)
      
      return {
        ...item,
        // Use database info if available, otherwise fallback to stored data
        brand: currentItem?.brand || item.brand || (item.id && item.id.toString().startsWith('custom_') ? "Custom" : "Tanpa Merek"),
        model: currentItem?.model || item.model || "",
        isCustom: item.id && item.id.toString().startsWith('custom_'),
        type: item.type || (item.id && item.id.toString().startsWith('custom_') ? "Custom Item" : "")
      }
    })
  }
  
  return enhancedSale
});

const filteredSales = computed(() => {
  let sales = [...dataStore.sales];

  // Date filters
  if (dateFrom.value) {
    sales = sales.filter((sale) => sale.created_at >= dateFrom.value);
  }

  if (dateTo.value) {
    const endDate = new Date(dateTo.value);
    endDate.setHours(23, 59, 59, 999);
    sales = sales.filter((sale) => new Date(sale.created_at) <= endDate);
  }

  // Employee filter
  if (selectedEmployee.value) {
    sales = sales.filter((sale) => sale.employee_id === selectedEmployee.value);
  }

  // Show/hide deleted
  if (!showDeleted.value) {
    sales = sales.filter((sale) => !sale.is_deleted);
  }

  return sales;
});

const hasBeenEdited = (sale) => {
  return Object.keys(sale.edit_log || {}).length > 0;
};

const hasEditHistory = (sale) => {
  return Object.keys(sale.edit_log || {}).length > 0;
};

const openEditDialog = (sale) => {
  editingItem.value = sale;
  editData.value = {
    total: sale.total,
    adminNotes: "",
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
      { total: Number(editData.value.total) },
      authStore.user.id,
      true // isAdmin
    );

    await dataStore.fetchSales();
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
    await deleteSaleAPI(saleToDelete.value.id, authStore.user.id, true);

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

const viewDetails = (sale) => {
  selectedSale.value = sale;
  detailsDialog.value = true;
};

const showEditHistory = (sale) => {
  selectedSaleHistory.value = sale;
  historyDialog.value = true;
};

// Receipt functions
const printReceipt = (sale) => {
  selectedSale.value = sale;
  receiptDialog.value = true;
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([dataStore.fetchSales(), dataStore.fetchEmployees()]);
  } catch (error) {
    console.error("Error loading data:", error);
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
