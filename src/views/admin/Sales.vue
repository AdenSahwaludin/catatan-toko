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

    <!-- Receipt Modal -->
    <v-dialog v-model="receiptDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-center py-3">
          <v-icon class="mr-2">mdi-receipt</v-icon>
          Struk Penjualan
        </v-card-title>
        <v-divider />

        <!-- Receipt Content -->
        <div
          id="receipt-content"
          class="pa-4"
          style="
            background: white;
            color: black;
            font-family: 'Courier New', monospace;
          "
        >
          <!-- Header -->
          <div class="text-center mb-3">
            <!-- Logo -->
            <div style="margin-bottom: 10px;">
              <img 
                src="/logo.jpg" 
                alt="Mega Teknik Logo" 
                style="max-width: 80px; max-height: 80px; object-fit: contain;"
                onerror="this.style.display='none'"
              />
            </div>
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px">
              MEGA TEKNIK
            </div>
            <div style="font-size: 12px; line-height: 1.3">
              Peralatan Teknik & Elektronik<br />
              Jl. Contoh No. 123, Kota<br />
              Telp: (021) 12345678
            </div>
            <div style="border-top: 1px dashed black; margin: 10px 0"></div>
          </div>

          <!-- Sale Info -->
          <div style="font-size: 12px; margin-bottom: 15px">
            <div style="display: flex; justify-content: space-between">
              <span>Tanggal:</span>
              <span>{{ selectedSale ? formatDate(new Date(selectedSale.created_at)) : '' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between">
              <span>Kasir:</span>
              <span>{{ selectedSale?.users?.email?.split("@")[0] || "Admin" }}</span>
            </div>
            <div style="border-top: 1px dashed black; margin: 10px 0"></div>
          </div>

          <!-- Items -->
          <div style="font-size: 12px; margin-bottom: 15px" v-if="selectedSale">
            <template v-if="selectedSale.details?.type === 'manual'">
              <div style="margin-bottom: 8px">
                <div style="display: flex; justify-content: space-between">
                  <span style="font-weight: bold">Penjualan Manual</span>
                </div>
                <div v-if="selectedSale.details?.notes" style="font-size: 10px; color: #666; margin: 5px 0;">
                  Catatan: {{ selectedSale.details.notes }}
                </div>
                <div style="display: flex; justify-content: space-between">
                  <span>1 x {{ formatCurrency(selectedSale.total) }}</span>
                  <span>{{ formatCurrency(selectedSale.total) }}</span>
                </div>
              </div>
            </template>

            <template v-else-if="selectedSale.details?.items">
              <!-- Items Count Summary -->
              <div style="font-size: 11px; color: #666; margin-bottom: 8px; text-align: center;">
                {{ selectedSale.details.items.length }} item{{ selectedSale.details.items.length > 1 ? 's' : '' }} dibeli
              </div>
              
              <div
                v-for="(item, index) in selectedSale.details.items"
                :key="index"
                style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dotted #ccc;"
              >
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span style="font-weight: bold; font-size: 13px;">{{ item.name }}</span>
                </div>
                <div style="font-size: 10px; color: #666; margin-bottom: 3px;">
                  <div v-if="item.id && item.id.toString().startsWith('custom_')">Custom Item</div>
                  <div v-else>ID: {{ item.id || 'N/A' }}</div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                  <span>{{ item.quantity }} x {{ formatCurrency(item.price) }}</span>
                  <span style="font-weight: bold;">{{ formatCurrency(item.quantity * item.price) }}</span>
                </div>
              </div>
            </template>

            <div style="border-top: 1px dashed black; margin: 10px 0"></div>
          </div>

          <!-- Total -->
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 15px">
            <div style="display: flex; justify-content: space-between">
              <span>TOTAL:</span>
              <span>{{ selectedSale ? formatCurrency(selectedSale.total) : 'Rp 0' }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="font-size: 11px; text-align: center; margin-top: 20px">
            <div
              style="border-top: 1px dashed black; margin-bottom: 10px"
            ></div>
            <div>Terima kasih atas kunjungan Anda!</div>
            <div>Barang yang sudah dibeli tidak dapat ditukar</div>
          </div>
        </div>

        <v-card-actions class="px-6 pb-6">
          <v-btn
            color="secondary"
            variant="outlined"
            @click="receiptDialog = false"
            class="flex-1"
          >
            Tutup
          </v-btn>
          <v-btn color="primary" @click="downloadReceipt" class="flex-1 ml-3">
            <v-icon class="mr-2">mdi-download</v-icon>
            Unduh Struk
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
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

const formatDate = (date) => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const downloadReceipt = () => {
  const receiptContent = document.getElementById("receipt-content");

  // Create a new window for printing
  const printWindow = window.open("", "_blank", "width=400,height=600");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Penjualan</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Courier New', monospace;
          background: white;
          color: black;
        }
        @media print {
          body { margin: 0; padding: 10px; }
        }
        .logo {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      ${receiptContent.innerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Auto print after a short delay
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);

  receiptDialog.value = false;
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
