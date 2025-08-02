<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">Daftar Barang</h2>
      </v-col>
    </v-row>

    <!-- Search and Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="4">
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

          <v-col cols="12" sm="6" md="2">
            <v-switch
              v-model="showLowStock"
              label="Stok menipis"
              color="warning"
              density="compact"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Items Grid/List -->
    <v-row>
      <v-col cols="12" class="d-flex justify-end mb-2">
        <v-btn-toggle
          v-model="viewMode"
          mandatory
          variant="outlined"
          density="compact"
        >
          <v-btn value="grid" icon="mdi-view-grid" />
          <v-btn value="list" icon="mdi-view-list" />
        </v-btn-toggle>
      </v-col>
    </v-row>

    <!-- Grid View -->
    <v-row v-if="viewMode === 'grid'">
      <v-col
        v-for="item in filteredItems"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="h-100" elevation="2">
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="32" class="mr-2">
                <v-icon size="16">mdi-package</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-bold">
                  {{ item.name }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.brand }}
                </div>
              </div>
              <v-chip
                :color="getStockColor(item.stock)"
                size="small"
                variant="tonal"
              >
                {{ item.stock }}
              </v-chip>
            </div>

            <v-divider class="my-2" />

            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-caption">Kategori:</span>
              <v-chip size="small" variant="tonal">
                {{ item.categories?.name }}
              </v-chip>
            </div>

            <div
              class="d-flex justify-space-between align-center mb-2"
              v-if="item.model"
            >
              <span class="text-caption">Model:</span>
              <span class="text-caption">{{ item.model }}</span>
            </div>

            <div class="d-flex justify-space-between align-center">
              <span class="text-subtitle-2 font-weight-bold">Harga:</span>
              <span class="text-subtitle-2 font-weight-bold text-primary">
                {{ formatCurrency(item.price) }}
              </span>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              color="primary"
              variant="text"
              size="small"
              @click="addToQuickSale(item)"
              :disabled="item.stock === 0"
              prepend-icon="mdi-cart-plus"
            >
              Tambah ke Penjualan
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- List View -->
    <v-card v-else>
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        item-value="id"
        density="compact"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="32" class="mr-3">
              <v-icon size="16">mdi-package</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-bold">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ item.brand }}
              </div>
            </div>
          </div>
        </template>

        <template #item.categories.name="{ item }">
          <v-chip size="small" variant="tonal">
            {{ item.categories?.name }}
          </v-chip>
        </template>

        <template #item.price="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.price) }}</span>
        </template>

        <template #item.stock="{ item }">
          <v-chip
            :color="getStockColor(item.stock)"
            size="small"
            variant="tonal"
          >
            {{ item.stock }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            color="primary"
            size="small"
            @click="addToQuickSale(item)"
            :disabled="item.stock === 0"
          >
            Tambah
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Quick Sale Dialog -->
    <v-dialog v-model="quickSaleDialog" max-width="400px" persistent>
      <v-card v-if="selectedItem">
        <v-card-title>Tambah ke Penjualan Cepat</v-card-title>

        <v-card-text>
          <div class="mb-4">
            <div class="font-weight-bold">{{ selectedItem.name }}</div>
            <div class="text-caption">
              {{ selectedItem.brand }} {{ selectedItem.model }}
            </div>
            <div class="text-subtitle-2 text-primary">
              {{ formatCurrency(selectedItem.price) }}
            </div>
          </div>

          <v-text-field
            v-model="quickSaleQuantity"
            label="Jumlah"
            type="number"
            variant="outlined"
            :max="selectedItem.stock"
            :rules="[validateInput.required, validateInput.positiveNumber]"
            required
          />

          <div class="text-subtitle-2 mb-2">
            Total:
            <span class="font-weight-bold text-primary">
              {{
                formatCurrency(selectedItem.price * (quickSaleQuantity || 0))
              }}
            </span>
          </div>

          <v-alert
            v-if="quickSaleQuantity > selectedItem.stock"
            type="error"
            variant="tonal"
            text
          >
            Jumlah melebihi stok yang tersedia ({{ selectedItem.stock }})
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="quickSaleDialog = false">Batal</v-btn>
          <v-btn
            color="primary"
            @click="addToCart"
            :disabled="
              !quickSaleQuantity || quickSaleQuantity > selectedItem.stock
            "
          >
            Tambah ke Keranjang
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Floating Action Button for Quick Sale -->
    <v-fab
      v-if="quickCart.length > 0"
      color="primary"
      icon="mdi-cart"
      location="bottom end"
      @click="goToInputSales"
    >
      <template #badge>
        <v-badge :content="quickCart.length" color="error" />
      </template>
    </v-fab>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDataStore } from "@/stores/data";
import { formatCurrency, validateInput } from "@/utils/helpers";

const router = useRouter();
const dataStore = useDataStore();

const loading = ref(false);
const viewMode = ref("grid");
const search = ref("");
const selectedCategory = ref("");
const brandFilter = ref("");
const showLowStock = ref(false);

const quickSaleDialog = ref(false);
const selectedItem = ref(null);
const quickSaleQuantity = ref(1);
const quickCart = ref([]);

const headers = [
  { title: "Barang", key: "name", sortable: true },
  { title: "Kategori", key: "categories.name", sortable: true },
  { title: "Model", key: "model", sortable: true },
  { title: "Harga", key: "price", sortable: true },
  { title: "Stok", key: "stock", sortable: true },
  { title: "Aksi", key: "actions", sortable: false, width: 100 },
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

const getStockColor = (stock) => {
  if (stock === 0) return "error";
  if (stock < 5) return "warning";
  return "success";
};

const addToQuickSale = (item) => {
  selectedItem.value = item;
  quickSaleQuantity.value = 1;
  quickSaleDialog.value = true;
};

const addToCart = () => {
  const existingIndex = quickCart.value.findIndex(
    (cartItem) => cartItem.id === selectedItem.value.id
  );

  if (existingIndex >= 0) {
    quickCart.value[existingIndex].quantity += quickSaleQuantity.value;
  } else {
    quickCart.value.push({
      ...selectedItem.value,
      quantity: quickSaleQuantity.value,
    });
  }

  quickSaleDialog.value = false;
  selectedItem.value = null;
};

const goToInputSales = () => {
  // Store cart in session storage for use in input sales page
  sessionStorage.setItem("quickCart", JSON.stringify(quickCart.value));
  router.push("/employee/input-sales");
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
</script>
