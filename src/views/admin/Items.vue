<template>
  <div>
    <!-- Header dengan SmartCard -->

    <SmartCard
      title="Manajemen Barang"
      icon="mdi-package-variant-closed"
      :badge="filteredItems.length"
      badge-color="success"
      class="mb-4"
    >
      <template #actions>
        <v-btn
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-qrcode-scan"
          @click="openBarcodeScanner"
          :disabled="loading"
          class="mr-2"
        >
          Scan Barcode
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
          Tambah Barang
        </v-btn>
      </template>
    </SmartCard>

    <!-- Smart Data Table -->
    <SmartDataTable
      :items="filteredItems"
      :headers="headers"
      :loading="loading"
      :search-value="search"
      :categories="dataStore.categories"
      :selected-category="selectedCategory"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      search-label="Cari barang..."
      search-placeholder="Nama, barcode, merek, atau model"
      :default-actions="tableActions"
      empty-title="Belum Ada Barang"
      empty-text="Mulai tambahkan barang pertama Anda"
      :empty-action="{
        text: 'Tambah Barang',
        icon: 'mdi-plus',
        handler: () => openDialog(),
      }"
      @update:search="search = $event"
      @update:category="selectedCategory = $event"
      @update:page="currentPage = $event"
      @update:items-per-page="itemsPerPage = $event"
      @refresh="loadItems"
    >
      <!-- Custom filters slot -->
      <template #filters>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="brandFilter"
              label="Merek"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3" v-if="!settingsStore.isStockHidden">
            <v-switch
              v-model="showLowStock"
              label="Stok menipis"
              color="warning"
              hide-details
              density="compact"
            />
          </v-col>
        </v-row>
      </template>

      <!-- Custom slots untuk kolom khusus -->
      <template #item.name="{ item }">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="32" class="mr-3">
            <v-icon size="16">mdi-package</v-icon>
          </v-avatar>
          <div>
            <div class="font-weight-bold">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.brand }} {{ item.model }}
            </div>
          </div>
        </div>
      </template>

      <template #item.price="{ item }">
        <span class="font-weight-bold text-primary">
          {{ formatCurrency(item.price) }}
        </span>
      </template>

      <template #item.stock="{ item }">
        <v-chip
          v-if="!settingsStore.isStockHidden"
          :color="getStockColor(item.stock)"
          size="small"
          variant="tonal"
        >
          {{ item.stock }}
        </v-chip>
      </template>

      <template #item.categories.name="{ item }">
        <v-chip size="small" variant="outlined">
          {{ item.categories?.name || "Uncategorized" }}
        </v-chip>
      </template>
    </SmartDataTable>

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

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.category_id"
                  :items="categoryOptionsForForm"
                  label="Kategori"
                  variant="outlined"
                  :rules="[validateInput.required]"
                  required
                >
                  <template #append-item>
                    <v-divider />
                    <v-list-item @click="showNewCategory = true">
                      <v-list-item-title>
                        <v-icon start>mdi-plus</v-icon>
                        Tambah kategori baru
                      </v-list-item-title>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- New Category Input -->
                <v-expand-transition>
                  <div v-show="showNewCategory" class="mt-3">
                    <v-text-field
                      v-model="newCategoryName"
                      label="Nama kategori baru"
                      variant="outlined"
                      density="compact"
                    >
                      <template #append-inner>
                        <v-btn
                          icon="mdi-check"
                          size="small"
                          variant="text"
                          color="success"
                          @click="createCategory"
                          :loading="creatingCategory"
                        />
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          @click="cancelCreateCategory"
                        />
                      </template>
                    </v-text-field>
                  </div>
                </v-expand-transition>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.brand"
                  label="Merek"
                  variant="outlined"
                  :rules="[validateInput.required]"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.model"
                  label="Model"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.price"
                  label="Harga"
                  type="number"
                  prefix="Rp"
                  variant="outlined"
                  :rules="[
                    validateInput.required,
                    validateInput.positiveNumber,
                  ]"
                  required
                />
              </v-col>

              <v-col cols="12" md="6" v-if="!settingsStore.isStockHidden">
                <v-text-field
                  v-model="formData.stock"
                  label="Stok"
                  type="number"
                  variant="outlined"
                  :rules="[
                    validateInput.required,
                    validateInput.positiveNumber,
                  ]"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.barcode"
                  label="Barcode (opsional)"
                  variant="outlined"
                  :rules="[validateBarcode]"
                >
                  <template #append-inner>
                    <v-btn
                      icon="mdi-qrcode-scan"
                      variant="text"
                      size="small"
                      color="primary"
                      @click="openBarcodeScanner"
                    >
                      <v-tooltip activator="parent" location="bottom">
                        Scan Barcode
                      </v-tooltip>
                    </v-btn>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">Batal</v-btn>
          <v-btn color="primary" @click="saveItem" :loading="saving">
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
          Yakin ingin menghapus barang "{{ itemToDelete?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Batal</v-btn>
          <v-btn color="error" @click="deleteItem" :loading="deleting">
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ZXing Barcode Scanner -->
    <ZXingBarcodeScanner
      v-model="barcodeScanner"
      mode="display"
      @scan-result="onBarcodeDetected"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import { supabase } from "@/utils/supabase";
import { formatCurrency, validateInput } from "@/utils/helpers";
import { useDebounce } from "@/composables/usePerformance";
import SmartCard from "@/components/ui/SmartCard.vue";
import SmartDataTable from "@/components/ui/SmartDataTable.vue";
import ZXingBarcodeScanner from "@/components/ZXingBarcodeScanner.vue";

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

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

const editingItem = ref(null);
const itemToDelete = ref(null);
const form = ref();

// Debounced search for better performance
const debouncedSearch = useDebounce(search, 300);
const debouncedBrandFilter = useDebounce(brandFilter, 300);

const formData = ref({
  name: "",
  category_id: "",
  brand: "",
  model: "",
  price: "",
  stock: "",
  barcode: "",
});

// Table configuration
const headers = computed(() => [
  { title: "Nama", key: "name", sortable: true },
  { title: "Harga", key: "price", sortable: true },
  ...(settingsStore.isStockHidden
    ? []
    : [{ title: "Stok", key: "stock", sortable: true }]),
  { title: "Kategori", key: "categories.name", sortable: false },
]);

const tableActions = [
  {
    key: "edit",
    icon: "mdi-pencil",
    color: "primary",
    handler: (item) => openDialog(item),
  },
  {
    key: "delete",
    icon: "mdi-delete",
    color: "error",
    handler: (item) => confirmDelete(item),
  },
];

// Computed properties
const filteredItems = computed(() => {
  let items = [...dataStore.items];

  if (debouncedSearch.value) {
    const query = debouncedSearch.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query) ||
        item.barcode?.includes(query)
    );
  }

  if (selectedCategory.value) {
    items = items.filter((item) => item.category_id === selectedCategory.value);
  }

  if (debouncedBrandFilter.value) {
    const brand = debouncedBrandFilter.value.toLowerCase();
    items = items.filter((item) => item.brand.toLowerCase().includes(brand));
  }

  if (showLowStock.value && !settingsStore.isStockHidden) {
    items = items.filter((item) => item.stock < 10);
  }

  return items;
});

// Category management
const showNewCategory = ref(false);
const newCategoryName = ref("");
const creatingCategory = ref(false);

const categoryOptionsForForm = computed(() => {
  const options = [
    { title: "Pilih kategori...", value: "" },
    ...dataStore.categories.map((cat) => ({
      title: cat.name,
      value: cat.id,
    })),
  ];

  // Add new category if being created
  if (
    showNewCategory.value &&
    newCategoryName.value &&
    !existingCategoryNamesLower.value.includes(
      newCategoryName.value.toLowerCase()
    )
  ) {
    options.push({
      title: `+ ${newCategoryName.value}`,
      value: "new_category",
    });
  }

  return options;
});

const existingCategoryNamesLower = computed(() =>
  dataStore.categories.map((cat) => cat.name.toLowerCase())
);

// Methods
const loadItems = async () => {
  loading.value = true;
  try {
    await dataStore.fetchItems();
    await dataStore.fetchCategories();
  } catch (error) {
    console.error("Error loading items:", error);
  } finally {
    loading.value = false;
  }
};

const getStockColor = (stock) => {
  if (stock === 0) return "error";
  if (stock < 5) return "warning";
  return "success";
};

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
  showNewCategory.value = false;
  newCategoryName.value = "";
  if (form.value) {
    form.value.reset();
  }
};

const createCategory = async () => {
  if (!newCategoryName.value.trim()) return;

  if (
    existingCategoryNamesLower.value.includes(
      newCategoryName.value.toLowerCase()
    )
  ) {
    alert("Kategori sudah ada");
    return;
  }

  creatingCategory.value = true;
  try {
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: newCategoryName.value.trim() }])
      .select()
      .single();

    if (error) throw error;

    await dataStore.fetchCategories();
    formData.value.category_id = data.id;
    showNewCategory.value = false;
    newCategoryName.value = "";
  } catch (error) {
    console.error("Error creating category:", error);
    alert("Terjadi kesalahan saat membuat kategori");
  } finally {
    creatingCategory.value = false;
  }
};

const cancelCreateCategory = () => {
  showNewCategory.value = false;
  newCategoryName.value = "";
};

const saveItem = async () => {
  if (!form.value) return;

  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;

  try {
    const itemData = {
      name: formData.value.name.trim(),
      category_id: formData.value.category_id,
      brand: formData.value.brand.trim(),
      model: formData.value.model?.trim() || "",
      price: Number(formData.value.price),
      stock: settingsStore.isStockHidden ? 999 : Number(formData.value.stock),
      barcode: formData.value.barcode?.trim() || null,
    };

    if (editingItem.value) {
      const { error } = await supabase
        .from("items")
        .update(itemData)
        .eq("id", editingItem.value.id);

      if (error) throw error;
    } else {
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

// Barcode validation
const validateBarcode = (code) => {
  if (!code) return true;
  if (code.length !== 13) {
    return "Barcode harus 13 digit";
  }
  if (!/^\d+$/.test(code)) {
    return "Barcode hanya boleh berisi angka";
  }
  return true;
};

// Barcode scanner functions
const openBarcodeScanner = () => {
  barcodeScanner.value = true;
};

const onBarcodeDetected = async (barcode) => {
  if (dialog.value) {
    formData.value.barcode = barcode;
  } else {
    // Search for item with this barcode
    const existingItem = dataStore.items.find(
      (item) => item.barcode === barcode
    );
    if (existingItem) {
      openDialog(existingItem);
    } else {
      formData.value.barcode = barcode;
      openDialog();
    }
  }
  barcodeScanner.value = false;
};

// Lifecycle
onMounted(async () => {
  await loadItems();
});

// Watchers untuk reset pagination
watch([search, selectedCategory, brandFilter, showLowStock], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
/* Minimal custom styles since most styling is handled by SmartCard and SmartDataTable */
</style>
