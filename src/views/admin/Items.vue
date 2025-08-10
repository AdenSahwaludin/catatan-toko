<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <h2 class="text-h5 font-weight-bold">Manajemen Barang</h2>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
          Tambah Barang
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="search"
              label="Cari barang..."
              placeholder="Contoh: philips 5 watt atau lampu 5"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hint="Gunakan beberapa kata kunci untuk pencarian lebih akurat"
              persistent-hint
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              label="Kategori"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="brandFilter"
              label="Merek"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-switch
              v-if="!settingsStore.isStockHidden"
              v-model="showLowStock"
              label="Stok menipis"
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
        :items="filteredItems"
        :loading="loading"
        item-value="id"
      >
        <template #item.categories.name="{ item }">
          <v-chip size="small" variant="tonal">
            {{ item.categories?.name }}
          </v-chip>
        </template>

        <template #item.price="{ item }">
          {{ formatCurrency(item.price) }}
        </template>

        <template #item.stock="{ item }">
          <v-chip
            v-if="!settingsStore.isStockHidden"
            :color="
              item.stock < 5 ? 'error' : item.stock < 10 ? 'warning' : 'success'
            "
            size="small"
            variant="tonal"
          >
            {{ item.stock }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openDialog(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title>
          {{ editingItem ? "Edit Barang" : "Tambah Barang" }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" @submit.prevent="saveItem">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  label="Nama Barang"
                  variant="outlined"
                  :rules="[validateInput.required]"
                  required
                />
              </v-col>

              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="formData.barcode"
                  label="Barcode (EAN-13)"
                  variant="outlined"
                  placeholder="Masukkan atau scan barcode EAN-13"
                  :rules="[validateBarcode]"
                  clearable
                >
                  <template #append-inner>
                    <v-btn
                      icon="mdi-qrcode-scan"
                      variant="text"
                      size="small"
                      @click="openBarcodeScanner"
                      :disabled="saving"
                    />
                  </template>
                </v-text-field>
              </v-col>

              <v-col cols="12" sm="4" class="d-flex align-center">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-qrcode-scan"
                  @click="openBarcodeScanner"
                  :disabled="saving"
                  block
                >
                  Scan Barcode
                </v-btn>
              </v-col>

              <v-col cols="12" sm="6">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-subtitle-2">Kategori</span>
                  <v-btn
                    size="x-small"
                    variant="text"
                    prepend-icon="mdi-plus"
                    @click="showNewCategory = !showNewCategory"
                  >
                    Buat kategori
                  </v-btn>
                </div>

                <!-- Select kategori yang sudah ada -->
                <v-select
                  v-model="formData.category_id"
                  :items="categoryOptionsForForm"
                  label="Kategori"
                  variant="outlined"
                  :rules="[validateInput.required]"
                  required
                />

                <!-- Input kategori baru -->
                <v-expand-transition>
                  <div v-if="showNewCategory" class="mt-2">
                    <v-text-field
                      v-model="newCategoryName"
                      label="Nama kategori baru"
                      variant="outlined"
                      density="compact"
                      :rules="[validateInput.required]"
                    />
                    <div class="d-flex ga-2">
                      <v-btn
                        size="small"
                        color="primary"
                        :loading="creatingCategory"
                        @click="createCategory"
                      >
                        Simpan kategori
                      </v-btn>
                      <v-btn
                        size="small"
                        variant="text"
                        @click="cancelCreateCategory"
                      >
                        Batal
                      </v-btn>
                    </div>
                  </div>
                </v-expand-transition>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.brand"
                  label="Merek"
                  variant="outlined"
                  required
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.model"
                  label="Model"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.price"
                  label="Harga"
                  type="number"
                  variant="outlined"
                  :rules="[
                    validateInput.required,
                    validateInput.positiveNumber,
                  ]"
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-if="!settingsStore.isStockHidden"
                  v-model="formData.stock"
                  label="Stok"
                  type="number"
                  variant="outlined"
                  :rules="[validateInput.required, validateInput.integer]"
                  required
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Batal</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveItem">
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Hapus Barang</v-card-title>
        <v-card-text>
          Yakin ingin menghapus barang "{{ itemToDelete?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Batal</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteItem">
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Barcode Scanner -->
    <BarcodeScanner v-model="barcodeScanner" @detected="onBarcodeDetected" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import { supabase } from "@/utils/supabase";
import { formatCurrency, validateInput } from "@/utils/helpers";
import BarcodeScanner from "@/components/BarcodeScanner2.vue";

const dataStore = useDataStore();
const settingsStore = useSettingsStore();

const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const barcodeScanner = ref(false);

const search = ref("");
const selectedCategory = ref("");
const brandFilter = ref("");
const showLowStock = ref(false);

const editingItem = ref(null);
const itemToDelete = ref(null);
const form = ref();

const formData = ref({
  name: "",
  category_id: "",
  brand: "",
  model: "",
  price: "",
  stock: "",
  barcode: "",
});

const headers = computed(() => [
  { title: "Nama", key: "name", sortable: true },
  { title: "Barcode", key: "barcode", sortable: true },
  { title: "Kategori", key: "categories.name", sortable: true },
  { title: "Merek", key: "brand", sortable: true },
  { title: "Model", key: "model", sortable: true },
  { title: "Harga", key: "price", sortable: true },
  ...(settingsStore.isStockHidden
    ? []
    : [{ title: "Stok", key: "stock", sortable: true }]),
  { title: "Aksi", key: "actions", sortable: false, width: 120 },
]);

const categoryOptions = computed(() => [
  { title: "Semua Kategori", value: "" },
  ...dataStore.categories.map((cat) => ({
    title: cat.name,
    value: cat.id,
  })),
]);

const filteredItems = computed(() => {
  let items = [...dataStore.items];

  // Enhanced search filter - dynamic keyword matching
  if (search.value) {
    const searchKeywords = search.value
      .toLowerCase()
      .split(" ")
      .filter((keyword) => keyword.length > 0);

    items = items.filter((item) => {
      // Create searchable text from all relevant fields
      const searchableText = [
        item.name,
        item.brand,
        item.model || "",
        item.categories?.name || "",
      ]
        .join(" ")
        .toLowerCase();

      // Check if ALL keywords are found in the searchable text
      // Also check for partial matches (minimum 3 characters)
      return searchKeywords.every((keyword) => {
        if (keyword.length >= 3) {
          return searchableText.includes(keyword);
        } else {
          // For short keywords, require exact word match
          const words = searchableText.split(" ");
          return words.some((word) => word.includes(keyword));
        }
      });
    });
  }

  // Category filter
  if (selectedCategory.value) {
    items = items.filter((item) => item.category_id === selectedCategory.value);
  }

  // Brand filter
  if (brandFilter.value) {
    const brandLower = brandFilter.value.toLowerCase();
    items = items.filter((item) =>
      item.brand.toLowerCase().includes(brandLower)
    );
  }

  // Low stock filter
  if (showLowStock.value) {
    items = items.filter((item) => item.stock < 5);
  }

  return items;
});

const openDialog = (item = null) => {
  editingItem.value = item;
  if (item) {
    formData.value = { ...item };
  } else {
    formData.value = {
      name: "",
      category_id: "",
      brand: "",
      model: "",
      price: "",
      stock: "",
      barcode: "",
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingItem.value = null;
  if (form.value) {
    form.value.reset();
  }
};

const saveItem = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;

  try {
    const itemData = {
      name: formData.value.name,
      category_id: formData.value.category_id,
      brand: formData.value.brand,
      model: formData.value.model,
      price: Number(formData.value.price),
      stock: Number(formData.value.stock),
      barcode: formData.value.barcode || null,
    };

    if (editingItem.value) {
      // Update
      const { error } = await supabase
        .from("items")
        .update(itemData)
        .eq("id", editingItem.value.id);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase.from("items").insert([itemData]);

      if (error) throw error;
    }

    await dataStore.fetchItems();
    closeDialog();
  } catch (error) {
    console.error("Error saving item:", error);
    alert("Terjadi kesalahan saat menyimpan data");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const deleteItem = async () => {
  deleting.value = true;

  try {
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", itemToDelete.value.id);

    if (error) throw error;

    await dataStore.fetchItems();
    deleteDialog.value = false;
    itemToDelete.value = null;
  } catch (error) {
    console.error("Error deleting item:", error);
    alert("Terjadi kesalahan saat menghapus data");
  } finally {
    deleting.value = false;
  }
};

const showNewCategory = ref(false);
const newCategoryName = ref("");
const creatingCategory = ref(false);

const categoryOptionsForForm = computed(() =>
  dataStore.categories.map((cat) => ({ title: cat.name, value: cat.id }))
);

const existingCategoryNamesLower = computed(() =>
  dataStore.categories.map((c) => c.name.trim().toLowerCase())
);

const createCategory = async () => {
  const name = newCategoryName.value.trim();
  if (!name) return;

  // Jika nama kategori sudah ada, auto-pilih yang existing
  const idx = existingCategoryNamesLower.value.indexOf(name.toLowerCase());
  if (idx !== -1) {
    const existing = dataStore.categories[idx];
    formData.value.category_id = existing.id;
    showNewCategory.value = false;
    newCategoryName.value = "";
    return;
  }

  creatingCategory.value = true;
  try {
    // Insert ke supabase
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;

    // Refresh store dan auto-pilih kategori baru
    await dataStore.fetchCategories();
    formData.value.category_id = data.id;

    // Bereskan UI
    showNewCategory.value = false;
    newCategoryName.value = "";
  } catch (err) {
    console.error("Error creating category:", err);
    alert("Gagal membuat kategori baru");
  } finally {
    creatingCategory.value = false;
  }
};

const cancelCreateCategory = () => {
  showNewCategory.value = false;
  newCategoryName.value = "";
};

// Barcode validation
const validateBarcode = (code) => {
  if (!code) return true; // Optional field

  // Basic validation - should be 13 digits
  const cleanCode = code.toString().replace(/\D/g, "");
  if (cleanCode.length !== 13) return "Barcode harus 13 digit (EAN-13)";

  // EAN-13 checksum validation
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleanCode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  if (parseInt(cleanCode[12]) !== checkDigit) {
    return "Checksum barcode EAN-13 tidak valid";
  }

  return true;
};

// Barcode scanner functions
const openBarcodeScanner = () => {
  barcodeScanner.value = true;
};

const onBarcodeDetected = async (barcode) => {
  console.log("Barcode detected:", barcode);

  // Check if barcode already exists in database
  try {
    const { data: existingItem, error } = await supabase
      .from("items")
      .select("id, name")
      .eq("barcode", barcode)
      .single();

    if (
      existingItem &&
      (!editingItem.value || existingItem.id !== editingItem.value.id)
    ) {
      alert(`Barcode sudah digunakan oleh barang: "${existingItem.name}"`);
      return;
    }
  } catch (error) {
    // If no existing item found, continue
    console.log("No existing barcode found, proceeding...");
  }

  formData.value.barcode = barcode;
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([dataStore.fetchItems(), dataStore.fetchCategories()]);
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    loading.value = false;
  }
});

watch([search, selectedCategory, brandFilter, showLowStock], () => {}, {
  debounce: 300,
});
</script>
