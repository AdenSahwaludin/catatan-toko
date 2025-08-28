<template>
  <div>
    <!-- Header dengan SmartCard -->
    <SmartCard
      title="Manajemen Kategori"
      icon="mdi-tag-multiple-outline"
      :badge="filteredCategories.length"
      badge-color="info"
      class="mb-4"
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
          Tambah Kategori
        </v-btn>
      </template>
    </SmartCard>

    <!-- Smart Data Table -->
    <SmartDataTable
      :items="filteredCategories"
      :headers="headers"
      :loading="loading"
      :search-value="search"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      search-label="Cari kategori..."
      search-placeholder="Nama kategori"
      :show-filters="false"
      :default-actions="tableActions"
      empty-title="Belum Ada Kategori"
      empty-text="Mulai tambahkan kategori untuk mengelompokkan barang"
      :empty-action="{
        text: 'Tambah Kategori',
        icon: 'mdi-plus',
        handler: () => openDialog(),
      }"
      @update:search="search = $event"
      @update:page="currentPage = $event"
      @update:items-per-page="itemsPerPage = $event"
    >
      <!-- Custom slots -->
      <template #item.name="{ item }">
        <div class="d-flex align-center">
          <v-avatar color="info" size="32" class="mr-3">
            <v-icon size="16">mdi-tag</v-icon>
          </v-avatar>
          <div class="font-weight-medium">{{ item.name }}</div>
        </div>
      </template>

      <template #item.item_count="{ item }">
        <v-chip
          :color="getItemCount(item.id) > 0 ? 'success' : 'grey'"
          size="small"
          variant="tonal"
        >
          {{ getItemCount(item.id) }} barang
        </v-chip>
      </template>
    </SmartDataTable>

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
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">Batal</v-btn>
          <v-btn color="primary" @click="saveCategory" :loading="saving">
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
          <p>Yakin ingin menghapus kategori "{{ categoryToDelete?.name }}"?</p>
          <v-alert
            v-if="getItemCount(categoryToDelete?.id) > 0"
            type="warning"
            variant="tonal"
            class="mt-3"
          >
            Kategori ini memiliki
            {{ getItemCount(categoryToDelete?.id) }} barang. Barang-barang
            tersebut akan menjadi tanpa kategori.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Batal</v-btn>
          <v-btn color="error" @click="deleteCategory" :loading="deleting">
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
import { validateInput } from "@/utils/helpers";
import SmartCard from "@/components/ui/SmartCard.vue";
import SmartDataTable from "@/components/ui/SmartDataTable.vue";

const dataStore = useDataStore();

const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const search = ref("");

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

const editingCategory = ref(null);
const categoryToDelete = ref(null);
const form = ref();

const formData = ref({
  name: "",
});

const headers = [
  { title: "Nama Kategori", key: "name", sortable: true },
  { title: "Jumlah Barang", key: "item_count", sortable: false },
];

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
    condition: (item) => getItemCount(item.id) === 0, // Only allow delete if no items
  },
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
    formData.value = {
      name: "",
    };
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
  if (!form.value) return;

  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;

  try {
    const categoryData = {
      name: formData.value.name.trim(),
    };

    if (editingCategory.value) {
      const { error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", editingCategory.value.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("categories")
        .insert([categoryData]);

      if (error) throw error;
    }

    // Invalidate cache after create/update
    dataStore.invalidateCache("categories");
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

    // Invalidate cache after delete
    dataStore.invalidateCache("categories");
    dataStore.invalidateCache("items"); // Also invalidate items since category relationships changed

    await dataStore.fetchCategories();
    await dataStore.fetchItems(); // Refresh items to update category relationships
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

// Watcher untuk reset pagination
watch(search, () => {
  currentPage.value = 1;
});
</script>

<style scoped>
/* Custom styles handled by SmartCard and SmartDataTable */
</style>
