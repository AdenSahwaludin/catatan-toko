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
              v-if="!settingsStore.isStockHidden"
              v-model="showLowStock"
              label="Stok menipis"
              color="warning"
              density="compact"
            />
          </v-col>
        </v-row>

        <!-- Action Buttons -->
        <v-row class="mt-2">
          <v-col cols="12" class="d-flex gap-2">
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="refreshData"
              :loading="loading"
            >
              Refresh Data
            </v-btn>

            <v-btn
              color="warning"
              variant="outlined"
              prepend-icon="mdi-filter-remove"
              @click="clearFilters"
              v-if="hasActiveFilters"
            >
              Hapus Filter
            </v-btn>

            <v-spacer />

            <v-chip
              v-if="hasActiveFilters"
              color="info"
              variant="tonal"
              prepend-icon="mdi-filter"
            >
              Filter Aktif
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Items Grid/List -->
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center mb-2">
        <div class="d-flex align-center">
          <v-chip color="info" variant="tonal" class="mr-2">
            Total: {{ totalItems }} item
          </v-chip>
          <v-chip
            color="primary"
            variant="tonal"
            v-if="filteredCount !== totalItems"
          >
            Ditampilkan: {{ filteredCount }} item
          </v-chip>
        </div>

        <div class="d-flex align-center">
          <v-select
            v-model="itemsPerPage"
            :items="[12, 24, 48, 96]"
            label="Per halaman"
            density="compact"
            variant="outlined"
            hide-details
            class="mr-3"
            style="width: 120px"
          />
          <v-btn-toggle
            v-model="viewMode"
            mandatory
            variant="outlined"
            density="compact"
          >
            <v-btn value="grid" icon="mdi-view-grid" />
            <v-btn value="list" icon="mdi-view-list" />
          </v-btn-toggle>
        </div>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading" class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="text-h6 mt-3">Memuat data barang...</div>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="totalItems === 0" class="justify-center">
      <v-col cols="12" md="6" class="text-center">
        <v-icon size="120" color="grey-lighten-2"
          >mdi-package-variant-closed</v-icon
        >
        <div class="text-h5 mt-4 mb-2">Belum Ada Data Barang</div>
        <div class="text-body-1 text-medium-emphasis mb-4">
          Silakan tambahkan barang terlebih dahulu melalui admin panel
        </div>
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="refreshData">
          Refresh Data
        </v-btn>
      </v-col>
    </v-row>

    <!-- No Results State -->
    <v-row v-else-if="filteredCount === 0" class="justify-center">
      <v-col cols="12" md="6" class="text-center">
        <v-icon size="120" color="grey-lighten-2">mdi-magnify</v-icon>
        <div class="text-h5 mt-4 mb-2">Tidak Ada Hasil</div>
        <div class="text-body-1 text-medium-emphasis mb-4">
          Tidak ditemukan barang yang sesuai dengan filter Anda
        </div>
        <v-btn
          color="warning"
          variant="outlined"
          prepend-icon="mdi-filter-remove"
          @click="clearFilters"
        >
          Hapus Semua Filter
        </v-btn>
      </v-col>
    </v-row>

    <!-- Grid View with Pagination -->
    <div v-else-if="viewMode === 'grid' && filteredCount > 0">
      <v-row>
        <v-col
          v-for="item in paginatedItems"
          :key="item.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card class="h-100" elevation="2" hover>
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
                  v-if="!settingsStore.isStockHidden"
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
                :disabled="!settingsStore.isStockHidden && item.stock === 0"
                prepend-icon="mdi-cart-plus"
              >
                Tambah ke Penjualan
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Grid Pagination -->
      <v-row class="mt-4" v-if="totalPages > 1">
        <v-col cols="12" class="d-flex justify-center">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            color="primary"
            rounded="circle"
          />
        </v-col>
      </v-row>
    </div>

    <!-- List View with Built-in Pagination -->
    <v-card v-else-if="filteredCount > 0">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        item-value="id"
        density="compact"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        @update:page="currentPage = $event"
        @update:items-per-page="itemsPerPage = $event"
        :items-per-page-options="[
          { value: 12, title: '12' },
          { value: 24, title: '24' },
          { value: 48, title: '48' },
          { value: 96, title: '96' },
          { value: -1, title: 'Semua' },
        ]"
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
            v-if="!settingsStore.isStockHidden"
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
            :disabled="!settingsStore.isStockHidden && item.stock === 0"
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
            :max="settingsStore.isStockHidden ? undefined : selectedItem.stock"
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
            v-if="!settingsStore.isStockHidden && quickSaleQuantity > selectedItem.stock"
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
              !quickSaleQuantity || (!settingsStore.isStockHidden && quickSaleQuantity > selectedItem.stock)
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useDataStore } from "@/stores/data";
import { useSettingsStore } from "@/stores/settings";
import { formatCurrency, validateInput } from "@/utils/helpers";

const router = useRouter();
const dataStore = useDataStore();
const settingsStore = useSettingsStore();

const loading = ref(false);
const viewMode = ref("grid");
const search = ref("");
const selectedCategory = ref("");
const brandFilter = ref("");
const showLowStock = ref(false);

// Pagination variables
const currentPage = ref(1);
const itemsPerPage = ref(24);
const totalItems = ref(0);

const quickSaleDialog = ref(false);
const selectedItem = ref(null);
const quickSaleQuantity = ref(1);
const quickCart = ref([]);

// Debounce untuk search
const searchTimeout = ref(null);
const debouncedSearch = ref("");

const headers = computed(() => [
  { title: "Barang", key: "name", sortable: true },
  { title: "Kategori", key: "categories.name", sortable: true },
  { title: "Model", key: "model", sortable: true },
  { title: "Harga", key: "price", sortable: true },
  ...(settingsStore.isStockHidden ? [] : [{ title: "Stok", key: "stock", sortable: true }]),
  { title: "Aksi", key: "actions", sortable: false, width: 100 },
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

  // Enhanced search filter (menggunakan debounced search) - dynamic keyword matching
  if (debouncedSearch.value) {
    const searchKeywords = debouncedSearch.value
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

const filteredCount = computed(() => filteredItems.value.length);

const totalPages = computed(() => {
  if (itemsPerPage.value === -1) return 1;
  return Math.ceil(filteredCount.value / itemsPerPage.value);
});

const paginatedItems = computed(() => {
  if (itemsPerPage.value === -1) return filteredItems.value;

  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredItems.value.slice(start, end);
});

const hasActiveFilters = computed(() => {
  return (
    search.value ||
    selectedCategory.value ||
    brandFilter.value ||
    showLowStock.value
  );
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

// Watch untuk debounced search
watch(search, (newValue) => {
  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Set new timeout
  searchTimeout.value = setTimeout(() => {
    debouncedSearch.value = newValue;
    currentPage.value = 1; // Reset ke halaman pertama saat search
  }, 300);
});

// Watch untuk filter changes - reset page
watch([selectedCategory, brandFilter, showLowStock], () => {
  currentPage.value = 1;
});

// Watch untuk items per page change
watch(itemsPerPage, () => {
  currentPage.value = 1;
});

const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([dataStore.fetchItems(), dataStore.fetchCategories()]);
    totalItems.value = dataStore.items.length;
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  search.value = "";
  debouncedSearch.value = "";
  selectedCategory.value = "";
  brandFilter.value = "";
  showLowStock.value = false;
  currentPage.value = 1;

  // Clear search timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
    searchTimeout.value = null;
  }
};

onMounted(async () => {
  await refreshData();

  // Load quick cart from session storage if exists
  const savedCart = sessionStorage.getItem("quickCart");
  if (savedCart) {
    try {
      quickCart.value = JSON.parse(savedCart);
    } catch (error) {
      console.error("Error loading quick cart:", error);
    }
  }
});
</script>
