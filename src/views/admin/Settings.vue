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
              label="Import Data dari File"
              accept=".xlsx,.csv"
              variant="outlined"
              prepend-icon="mdi-upload"
              @change="handleFileImport"
            />
            <div class="text-caption text-medium-emphasis">
              Restore data dari file backup Excel/CSV
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- JSON Import -->
    <v-card class="mb-4">
      <v-card-title>Import Data JSON</v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-textarea
              v-model="jsonImportData"
              label="Data JSON Barang"
              variant="outlined"
              rows="8"
              placeholder='[
  {
    "nama": "Vanbelt A 21",
    "kategori": "Vanbelt", 
    "merek": "",
    "model": "21",
    "harga": 22000,
    "stok": 100
  },
  {
    "nama": "Vanbelt A 22",
    "kategori": "Vanbelt",
    "merek": "",
    "model": "22", 
    "harga": 23000,
    "stok": 100
  }
]'
              hint="Masukkan data dalam format JSON array. Kategori akan dibuat otomatis jika belum ada."
              persistent-hint
            />
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12" md="4">
            <v-btn
              color="success"
              @click="validateJsonData"
              prepend-icon="mdi-check"
              block
              :disabled="!jsonImportData"
            >
              Validasi Data
            </v-btn>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn
              color="primary"
              @click="importJsonData"
              :loading="importing"
              prepend-icon="mdi-import"
              block
              :disabled="!isJsonValid || !jsonImportData"
            >
              Import Data
            </v-btn>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn
              color="warning"
              @click="clearJsonData"
              prepend-icon="mdi-refresh"
              block
              :disabled="!jsonImportData && !validationMessage"
              variant="outlined"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>

        <!-- Validation Results -->
        <v-alert
          v-if="validationMessage"
          :type="isJsonValid ? 'success' : 'error'"
          class="mt-4"
          variant="tonal"
        >
          {{ validationMessage }}
        </v-alert>

        <!-- Preview Data -->
        <v-expansion-panels v-if="parsedJsonData.length > 0" class="mt-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start>mdi-eye</v-icon>
              Preview Data ({{ parsedJsonData.length }} item)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-data-table
                :headers="previewHeaders"
                :items="parsedJsonData"
                density="compact"
                :items-per-page="5"
              >
                <template #item.harga="{ item }">
                  {{ formatCurrency(item.harga) }}
                </template>
              </v-data-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Import Instructions -->
        <v-card variant="outlined" color="info" class="mt-4">
          <v-card-text>
            <div class="text-subtitle-2 mb-2">
              <v-icon start>mdi-information</v-icon>
              Format Data JSON
            </div>
            <div class="text-body-2">
              <strong>Field yang diperlukan:</strong>
              <ul class="ml-4 mt-2">
                <li><code>nama</code> - Nama barang (wajib)</li>
                <li>
                  <code>kategori</code> - Nama kategori (wajib, akan dibuat
                  otomatis jika belum ada)
                </li>
                <li><code>merek</code> - Merek barang (opsional)</li>
                <li><code>model</code> - Model barang (opsional)</li>
                <li><code>harga</code> - Harga dalam angka (wajib)</li>
                <li><code>stok</code> - Jumlah stok dalam angka (wajib)</li>
              </ul>

              <div class="d-flex align-center mt-3">
                <v-btn
                  color="primary"
                  size="small"
                  variant="outlined"
                  @click="copyExampleJson"
                  prepend-icon="mdi-content-copy"
                >
                  Copy Contoh Data
                </v-btn>
                <v-btn
                  color="secondary"
                  size="small"
                  variant="text"
                  @click="useExampleJson"
                  prepend-icon="mdi-auto-fix"
                  class="ml-2"
                >
                  Gunakan Contoh
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- System Information -->
    <v-card class="mb-4">
      <v-card-title>Informasi Sistem</v-card-title>

      <v-card-text>
        <v-list density="compact">
          <v-list-item>
            <v-list-item-title>Versi Aplikasi</v-list-item-title>
            <v-list-item-subtitle>v1.2.2</v-list-item-subtitle>
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
import { useNotificationStore } from "@/stores/notifications";
import { supabase } from "@/utils/supabase";
import { validateInput, formatCurrency } from "@/utils/helpers";
import { createCategory, createItem } from "@/utils/supabase";
import * as XLSX from "xlsx";

const themeStore = useThemeStore();
const dataStore = useDataStore();
const notificationStore = useNotificationStore();

const savingSettings = ref(false);
const exporting = ref(false);
const importing = ref(false);
const confirmDialog = ref(false);
const confirmLoading = ref(false);
const importFile = ref(null);

// JSON Import variables
const jsonImportData = ref("");
const parsedJsonData = ref([]);
const isJsonValid = ref(false);
const validationMessage = ref("");

const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmAction = ref("");
const confirmCallback = ref(null);

const previewHeaders = [
  { title: "Nama", key: "nama" },
  { title: "Kategori", key: "kategori" },
  { title: "Merek", key: "merek" },
  { title: "Model", key: "model" },
  { title: "Harga", key: "harga" },
  { title: "Stok", key: "stok" },
];

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
  notificationStore.addNotification({
    type: "info",
    message: "Fitur import file akan tersedia di versi mendatang",
  });
};

const validateJsonData = () => {
  try {
    if (!jsonImportData.value.trim()) {
      validationMessage.value = "Data JSON kosong";
      isJsonValid.value = false;
      parsedJsonData.value = [];
      return;
    }

    const data = JSON.parse(jsonImportData.value);

    if (!Array.isArray(data)) {
      validationMessage.value = "Data harus berupa array JSON";
      isJsonValid.value = false;
      parsedJsonData.value = [];
      return;
    }

    if (data.length === 0) {
      validationMessage.value = "Array tidak boleh kosong";
      isJsonValid.value = false;
      parsedJsonData.value = [];
      return;
    }

    // Validate each item
    const errors = [];
    const validatedData = [];

    data.forEach((item, index) => {
      const itemErrors = [];

      // Required fields validation
      if (!item.nama || typeof item.nama !== "string") {
        itemErrors.push(
          `Item ${index + 1}: 'nama' wajib diisi dan harus berupa text`
        );
      }

      if (!item.kategori || typeof item.kategori !== "string") {
        itemErrors.push(
          `Item ${index + 1}: 'kategori' wajib diisi dan harus berupa text`
        );
      }

      if (!item.harga || typeof item.harga !== "number" || item.harga <= 0) {
        itemErrors.push(
          `Item ${
            index + 1
          }: 'harga' wajib diisi dan harus berupa angka positif`
        );
      }

      if (
        item.stok === undefined ||
        typeof item.stok !== "number" ||
        item.stok < 0
      ) {
        itemErrors.push(
          `Item ${index + 1}: 'stok' wajib diisi dan harus berupa angka >= 0`
        );
      }

      if (itemErrors.length > 0) {
        errors.push(...itemErrors);
      } else {
        // Create validated item
        validatedData.push({
          nama: item.nama.trim(),
          kategori: item.kategori.trim(),
          merek: item.merek || "",
          model: item.model || "",
          harga: item.harga,
          stok: item.stok,
        });
      }
    });

    if (errors.length > 0) {
      validationMessage.value = `Ditemukan ${errors.length} error:\n\n${errors
        .slice(0, 5)
        .join("\n")}${
        errors.length > 5
          ? "\n... dan " + (errors.length - 5) + " error lainnya"
          : ""
      }`;
      isJsonValid.value = false;
      parsedJsonData.value = [];
    } else {
      validationMessage.value = `Data valid! ${validatedData.length} item siap diimport`;
      isJsonValid.value = true;
      parsedJsonData.value = validatedData;
    }
  } catch (error) {
    validationMessage.value = `JSON tidak valid: ${error.message}`;
    isJsonValid.value = false;
    parsedJsonData.value = [];
  }
};

const importJsonData = async () => {
  if (!isJsonValid.value || parsedJsonData.value.length === 0) {
    return;
  }

  importing.value = true;

  try {
    // Get existing data
    await Promise.all([dataStore.fetchCategories(), dataStore.fetchItems()]);

    const existingCategories = new Map(
      dataStore.categories.map((cat) => [cat.name.toLowerCase(), cat])
    );

    const existingItems = new Set(
      dataStore.items.map((item) => item.name.toLowerCase())
    );

    // Track new categories to create
    const newCategories = new Set();
    const categoriesToCreate = [];

    // Check for duplicates and prepare data
    const duplicateItems = [];
    const validItems = [];

    parsedJsonData.value.forEach((item) => {
      // Check for duplicate item names
      if (existingItems.has(item.nama.toLowerCase())) {
        duplicateItems.push(item.nama);
      } else {
        validItems.push(item);
        // Track category
        const categoryName = item.kategori.toLowerCase();
        if (
          !existingCategories.has(categoryName) &&
          !newCategories.has(categoryName)
        ) {
          newCategories.add(categoryName);
          categoriesToCreate.push({
            name: item.kategori,
          });
        }
      }
    });

    // Show duplicate warning if any
    if (duplicateItems.length > 0) {
      const shouldContinue = confirm(
        `Ditemukan ${
          duplicateItems.length
        } barang dengan nama yang sudah ada:\n\n${duplicateItems
          .slice(0, 5)
          .join("\n")}${
          duplicateItems.length > 5
            ? "\n... dan " + (duplicateItems.length - 5) + " lainnya"
            : ""
        }\n\nBarang duplikat akan dilewati. Lanjutkan import?`
      );

      if (!shouldContinue) {
        importing.value = false;
        return;
      }
    }

    if (validItems.length === 0) {
      notificationStore.addNotification({
        type: "warning",
        message: "Semua barang sudah ada. Tidak ada yang diimport.",
      });
      importing.value = false;
      return;
    }

    // Create new categories
    const categoryMap = new Map(existingCategories);
    for (const categoryData of categoriesToCreate) {
      try {
        const newCategory = await createCategory(categoryData);
        categoryMap.set(categoryData.name.toLowerCase(), newCategory);
        console.log("Created category:", newCategory.name);
      } catch (error) {
        console.error("Error creating category:", categoryData.name, error);
        throw error;
      }
    }

    // Create items
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const item of validItems) {
      try {
        const category = categoryMap.get(item.kategori.toLowerCase());
        if (!category) {
          throw new Error(`Kategori "${item.kategori}" tidak ditemukan`);
        }

        const itemData = {
          name: item.nama,
          category_id: category.id,
          brand: item.merek || "",
          model: item.model || "",
          price: item.harga,
          stock: item.stok,
        };

        await createItem(itemData);
        successCount++;
        console.log("Created item:", item.nama);
      } catch (error) {
        errorCount++;
        errors.push(`${item.nama}: ${error.message}`);
        console.error("Error creating item:", item.nama, error);
      }
    }

    // Refresh data
    await Promise.all([dataStore.fetchCategories(), dataStore.fetchItems()]);

    // Show results
    let resultMessage = "";
    if (successCount > 0) {
      resultMessage = `Berhasil import ${successCount} item`;
      if (newCategories.size > 0) {
        resultMessage += ` dan ${newCategories.size} kategori baru`;
      }
      if (duplicateItems.length > 0) {
        resultMessage += ` (${duplicateItems.length} duplikat dilewati)`;
      }

      notificationStore.addNotification({
        type: "success",
        message: resultMessage,
      });
    }

    if (errorCount > 0) {
      notificationStore.addNotification({
        type: "warning",
        message: `${errorCount} item gagal diimport. Periksa console untuk detail.`,
      });
      console.warn("Import errors:", errors);
    }

    // Clear form if all successful
    if (errorCount === 0) {
      jsonImportData.value = "";
      parsedJsonData.value = [];
      isJsonValid.value = false;
      validationMessage.value = "";
    }
  } catch (error) {
    console.error("Error importing JSON data:", error);
    notificationStore.addNotification({
      type: "error",
      message: `Gagal import data: ${error.message}`,
    });
  } finally {
    importing.value = false;
  }
};

const clearJsonData = () => {
  jsonImportData.value = "";
  parsedJsonData.value = [];
  isJsonValid.value = false;
  validationMessage.value = "";
  notificationStore.addNotification({
    type: "info",
    message: "Data JSON telah direset",
  });
};

const exampleJsonData = `[
  {
    "nama": "Vanbelt A 21",
    "kategori": "Vanbelt",
    "merek": "Gates",
    "model": "21",
    "harga": 22000,
    "stok": 100
  },
  {
    "nama": "Vanbelt A 22",
    "kategori": "Vanbelt",
    "merek": "Gates",
    "model": "22",
    "harga": 23000,
    "stok": 100
  },
  {
    "nama": "Bearing 6200",
    "kategori": "Bearing",
    "merek": "SKF",
    "model": "6200",
    "harga": 15000,
    "stok": 50
  },
  {
    "nama": "Oli Mesin SAE 40",
    "kategori": "Oli",
    "merek": "Shell",
    "model": "SAE 40",
    "harga": 45000,
    "stok": 25
  }
]`;

const copyExampleJson = async () => {
  try {
    await navigator.clipboard.writeText(exampleJsonData);
    notificationStore.addNotification({
      type: "success",
      message: "Contoh data berhasil disalin ke clipboard",
    });
  } catch (error) {
    console.error("Failed to copy:", error);
    notificationStore.addNotification({
      type: "error",
      message: "Gagal menyalin data. Silakan copy manual.",
    });
  }
};

const useExampleJson = () => {
  jsonImportData.value = exampleJsonData;
  // Auto validate after setting example
  setTimeout(() => {
    validateJsonData();
  }, 100);
  notificationStore.addNotification({
    type: "info",
    message:
      'Contoh data telah dimasukkan. Klik "Validasi Data" untuk memeriksa.',
  });
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
