<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">Pengaturan</h2>
      </v-col>
    </v-row>

    <!-- Theme Settings -->
    <v-card class="mb-4">
      <v-card-title>Pengaturan Tema</v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-switch
              v-model="themeStore.isDark"
              @change="themeStore.setTheme($event)"
              color="primary"
              label="Mode Gelap"
              :prepend-icon="
                themeStore.isDark ? 'mdi-weather-night' : 'mdi-weather-sunny'
              "
            />
            <div class="text-caption text-medium-emphasis">
              Mengaktifkan tema gelap untuk mengurangi kelelahan mata
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Application Settings -->
    <v-card class="mb-4">
      <v-card-title>Pengaturan Aplikasi</v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.minSaleAmount"
              label="Minimal Penjualan (Rp)"
              type="number"
              variant="outlined"
              prefix="Rp"
              :rules="[validateInput.required, validateInput.positiveNumber]"
            />
            <div class="text-caption text-medium-emphasis">
              Jumlah minimal untuk penjualan yang valid
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="settings.lowStockThreshold"
              label="Batas Stok Menipis"
              type="number"
              variant="outlined"
              :rules="[validateInput.required, validateInput.integer]"
            />
            <div class="text-caption text-medium-emphasis">
              Stok di bawah angka ini akan ditandai sebagai menipis
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-btn
              color="primary"
              @click="saveSettings"
              :loading="savingSettings"
              prepend-icon="mdi-content-save"
            >
              Simpan Pengaturan
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Backup & Restore -->
    <v-card class="mb-4">
      <v-card-title>Backup & Restore</v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-btn
              color="info"
              @click="exportAllData"
              :loading="exporting"
              prepend-icon="mdi-download"
              block
            >
              Export Semua Data
            </v-btn>
            <div class="text-caption text-medium-emphasis mt-2">
              Download backup semua data dalam format Excel
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <v-file-input
              v-model="importFile"
              label="Import Data"
              accept=".xlsx,.csv"
              variant="outlined"
              prepend-icon="mdi-upload"
              @change="handleFileImport"
            />
            <div class="text-caption text-medium-emphasis">
              Restore data dari file backup
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- System Information -->
    <v-card class="mb-4">
      <v-card-title>Informasi Sistem</v-card-title>

      <v-card-text>
        <v-list density="compact">
          <v-list-item>
            <v-list-item-title>Versi Aplikasi</v-list-item-title>
            <v-list-item-subtitle>v1.0.0</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Total Pengguna</v-list-item-title>
            <v-list-item-subtitle>{{
              systemInfo.totalUsers
            }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Total Barang</v-list-item-title>
            <v-list-item-subtitle>{{
              systemInfo.totalItems
            }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Total Penjualan</v-list-item-title>
            <v-list-item-subtitle>{{
              systemInfo.totalSales
            }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>Database</v-list-item-title>
            <v-list-item-subtitle>Supabase PostgreSQL</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Danger Zone -->
    <v-card color="error" variant="tonal">
      <v-card-title class="text-error">Zona Bahaya</v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-btn
              color="error"
              @click="confirmClearSales"
              prepend-icon="mdi-delete-sweep"
              block
            >
              Hapus Semua Data Penjualan
            </v-btn>
            <div class="text-caption text-medium-emphasis mt-2">
              Menghapus semua data penjualan secara permanen
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <v-btn
              color="error"
              @click="confirmResetApp"
              prepend-icon="mdi-restore"
              block
            >
              Reset Aplikasi
            </v-btn>
            <div class="text-caption text-medium-emphasis mt-2">
              Reset semua data dan kembali ke pengaturan awal
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Confirmation Dialogs -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title>{{ confirmTitle }}</v-card-title>
        <v-card-text>{{ confirmMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">Batal</v-btn>
          <v-btn
            color="error"
            :loading="confirmLoading"
            @click="executeConfirmAction"
          >
            {{ confirmAction }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useThemeStore } from "@/stores/theme";
import { useDataStore } from "@/stores/data";
import { supabase } from "@/utils/supabase";
import { validateInput } from "@/utils/helpers";
import * as XLSX from "xlsx";

const themeStore = useThemeStore();
const dataStore = useDataStore();

const savingSettings = ref(false);
const exporting = ref(false);
const confirmDialog = ref(false);
const confirmLoading = ref(false);
const importFile = ref(null);

const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmAction = ref("");
const confirmCallback = ref(null);

const settings = ref({
  minSaleAmount: 1000,
  lowStockThreshold: 5,
});

const systemInfo = computed(() => ({
  totalUsers: dataStore.employees.length + 1, // +1 for admin
  totalItems: dataStore.items.length,
  totalSales: dataStore.sales.filter((sale) => !sale.is_deleted).length,
}));

const saveSettings = () => {
  savingSettings.value = true;

  // Save to localStorage for now (in real app, save to database)
  localStorage.setItem("appSettings", JSON.stringify(settings.value));

  setTimeout(() => {
    savingSettings.value = false;
    alert("Pengaturan berhasil disimpan");
  }, 1000);
};

const exportAllData = async () => {
  exporting.value = true;

  try {
    // Prepare data for export
    const exportData = {
      categories: dataStore.categories,
      items: dataStore.items,
      sales: dataStore.sales,
      employees: dataStore.employees,
    };

    // Create separate sheets for each data type
    const workbook = XLSX.utils.book_new();

    // Categories sheet
    const categoriesWS = XLSX.utils.json_to_sheet(dataStore.categories);
    XLSX.utils.book_append_sheet(workbook, categoriesWS, "Kategori");

    // Items sheet
    const itemsData = dataStore.items.map((item) => ({
      Nama: item.name,
      Kategori: item.categories?.name,
      Merek: item.brand,
      Model: item.model,
      Harga: item.price,
      Stok: item.stock,
    }));
    const itemsWS = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsWS, "Barang");

    // Sales sheet
    const salesData = dataStore.sales.map((sale) => ({
      Karyawan: sale.users?.email,
      Total: sale.total,
      Tanggal: new Date(sale.created_at).toLocaleDateString("id-ID"),
      Status: sale.is_deleted ? "Dihapus" : "Aktif",
    }));
    const salesWS = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesWS, "Penjualan");

    // Export file
    XLSX.writeFile(
      workbook,
      `backup-catatan-toko-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  } catch (error) {
    console.error("Error exporting data:", error);
    alert("Terjadi kesalahan saat export data");
  } finally {
    exporting.value = false;
  }
};

const handleFileImport = (event) => {
  // This would handle file import in a real application
  alert("Fitur import akan tersedia di versi mendatang");
};

const confirmClearSales = () => {
  confirmTitle.value = "Hapus Semua Data Penjualan";
  confirmMessage.value =
    "Yakin ingin menghapus semua data penjualan? Tindakan ini tidak dapat dibatalkan.";
  confirmAction.value = "Hapus";
  confirmCallback.value = clearAllSales;
  confirmDialog.value = true;
};

const confirmResetApp = () => {
  confirmTitle.value = "Reset Aplikasi";
  confirmMessage.value =
    "Yakin ingin mereset seluruh aplikasi? Semua data akan hilang.";
  confirmAction.value = "Reset";
  confirmCallback.value = resetApplication;
  confirmDialog.value = true;
};

const executeConfirmAction = async () => {
  confirmLoading.value = true;

  try {
    if (confirmCallback.value) {
      await confirmCallback.value();
    }
    confirmDialog.value = false;
  } catch (error) {
    console.error("Error executing action:", error);
    alert("Terjadi kesalahan");
  } finally {
    confirmLoading.value = false;
  }
};

const clearAllSales = async () => {
  const { error } = await supabase
    .from("sales")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (error) throw error;

  await dataStore.fetchSales();
  alert("Semua data penjualan berhasil dihapus");
};

const resetApplication = async () => {
  // This would reset the entire application
  alert("Fitur reset akan tersedia di versi mendatang");
};

const loadSettings = () => {
  const saved = localStorage.getItem("appSettings");
  if (saved) {
    settings.value = { ...settings.value, ...JSON.parse(saved) };
  }
};

onMounted(async () => {
  loadSettings();

  try {
    await Promise.all([
      dataStore.fetchItems(),
      dataStore.fetchSales({ hideDeleted: true }),
      dataStore.fetchEmployees(),
    ]);
  } catch (error) {
    console.error("Error loading system info:", error);
  }
});
</script>
