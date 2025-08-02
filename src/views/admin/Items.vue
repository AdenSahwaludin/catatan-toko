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
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
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

              <v-col cols="12" sm="6">
                <v-select
                  v-model="formData.category_id"
                  :items="categoryOptions"
                  label="Kategori"
                  variant="outlined"
                  :rules="[validateInput.required]"
                  required
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.brand"
                  label="Merek"
                  variant="outlined"
                  :rules="[validateInput.required]"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useDataStore } from "@/stores/data";
import { supabase } from "@/utils/supabase";
import { formatCurrency, validateInput } from "@/utils/helpers";

const dataStore = useDataStore();

const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);

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
});

const headers = [
  { title: "Nama", key: "name", sortable: true },
  { title: "Kategori", key: "categories.name", sortable: true },
  { title: "Merek", key: "brand", sortable: true },
  { title: "Model", key: "model", sortable: true },
  { title: "Harga", key: "price", sortable: true },
  { title: "Stok", key: "stock", sortable: true },
  { title: "Aksi", key: "actions", sortable: false, width: 120 },
];

const categoryOptions = computed(() => [
  { title: "Semua Kategori", value: "" },
  ...dataStore.categories.map((cat) => ({
    title: cat.name,
    value: cat.id,
  })),
]);

const filteredItems = computed(() => {
  let items = [...dataStore.items];

  // Search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.model?.toLowerCase().includes(searchLower)
    );
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

// Watch for filter changes and refetch data
watch(
  [search, selectedCategory, brandFilter, showLowStock],
  () => {
    // Filters are computed, no need to refetch
  },
  { debounce: 300 }
);
</script>
