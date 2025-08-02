<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <h2 class="text-h5 font-weight-bold">Manajemen Kategori</h2>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
          Tambah Kategori
        </v-btn>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-card>
      <v-card-text>
        <v-text-field
          v-model="search"
          label="Cari kategori..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          class="mb-4"
        />
      </v-card-text>

      <v-data-table
        :headers="headers"
        :items="filteredCategories"
        :loading="loading"
        item-value="id"
      >
        <template #item.item_count="{ item }">
          <v-chip size="small" variant="tonal">
            {{ getItemCount(item.id) }} barang
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
            :disabled="getItemCount(item.id) > 0"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="400px" persistent>
      <v-card>
        <v-card-title>
          {{ editingCategory ? "Edit Kategori" : "Tambah Kategori" }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" @submit.prevent="saveCategory">
            <v-text-field
              v-model="formData.name"
              label="Nama Kategori"
              variant="outlined"
              :rules="[validateInput.required]"
              required
              autofocus
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Batal</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveCategory">
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Hapus Kategori</v-card-title>
        <v-card-text>
          Yakin ingin menghapus kategori "{{ categoryToDelete?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Batal</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteCategory">
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useDataStore } from "@/stores/data";
import { supabase } from "@/utils/supabase";
import { validateInput } from "@/utils/helpers";

const dataStore = useDataStore();

const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const search = ref("");

const editingCategory = ref(null);
const categoryToDelete = ref(null);
const form = ref();

const formData = ref({
  name: "",
});

const headers = [
  { title: "Nama Kategori", key: "name", sortable: true },
  { title: "Jumlah Barang", key: "item_count", sortable: false },
  { title: "Aksi", key: "actions", sortable: false, width: 120 },
];

const filteredCategories = computed(() => {
  if (!search.value) return dataStore.categories;

  const searchLower = search.value.toLowerCase();
  return dataStore.categories.filter((category) =>
    category.name.toLowerCase().includes(searchLower)
  );
});

const getItemCount = (categoryId) => {
  return dataStore.items.filter((item) => item.category_id === categoryId)
    .length;
};

const openDialog = (category = null) => {
  editingCategory.value = category;
  if (category) {
    formData.value = { ...category };
  } else {
    formData.value = { name: "" };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingCategory.value = null;
  if (form.value) {
    form.value.reset();
  }
};

const saveCategory = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;

  try {
    const categoryData = {
      name: formData.value.name.trim(),
    };

    if (editingCategory.value) {
      // Update
      const { error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", editingCategory.value.id);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from("categories")
        .insert([categoryData]);

      if (error) throw error;
    }

    await dataStore.fetchCategories();
    closeDialog();
  } catch (error) {
    console.error("Error saving category:", error);
    alert("Terjadi kesalahan saat menyimpan data");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (category) => {
  categoryToDelete.value = category;
  deleteDialog.value = true;
};

const deleteCategory = async () => {
  deleting.value = true;

  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryToDelete.value.id);

    if (error) throw error;

    await dataStore.fetchCategories();
    deleteDialog.value = false;
    categoryToDelete.value = null;
  } catch (error) {
    console.error("Error deleting category:", error);
    alert("Terjadi kesalahan saat menghapus data");
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([dataStore.fetchCategories(), dataStore.fetchItems()]);
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    loading.value = false;
  }
});
</script>
