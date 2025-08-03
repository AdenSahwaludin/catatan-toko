<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold">Input Penjualan</h2>
      </v-col>
    </v-row>

    <!-- Input Mode Selection -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-btn-toggle
              v-model="inputMode"
              color="primary"
              mandatory
              variant="outlined"
              divided
            >
              <v-btn value="manual">
                <v-icon start>mdi-calculator</v-icon>
                Input Manual
              </v-btn>
              <v-btn value="items">
                <v-icon start>mdi-package-variant</v-icon>
                Berdasarkan Barang
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Manual Input Mode -->
    <v-card v-if="inputMode === 'manual'" class="mb-4">
      <v-card-title>Input Manual - Nominal Saja</v-card-title>

      <v-card-text>
        <v-form ref="manualForm" @submit.prevent="submitManualSale">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="manualAmount"
                label="Total Penjualan"
                type="number"
                variant="outlined"
                prefix="Rp"
                :rules="[validateInput.required, validateInput.minAmount]"
                required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-textarea
                v-model="manualNotes"
                label="Catatan (opsional)"
                variant="outlined"
                rows="3"
              />
            </v-col>
          </v-row>

          <v-btn
            type="submit"
            color="primary"
            size="large"
            :loading="saving"
            prepend-icon="mdi-content-save"
          >
            Simpan Penjualan
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Items Input Mode -->
    <div v-else>
      <!-- Item Selection -->
      <v-card class="mb-4">
        <v-card-title>Pilih Barang</v-card-title>

        <v-card-text>
          <!-- Search and Filters -->
          <v-row class="mb-4">
            <v-col cols="12" md="5">
              <v-text-field
                v-model="itemSearch"
                label="Cari barang..."
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="selectedCategory"
                :items="categoryOptions"
                label="Kategori"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-switch
                v-model="showAvailableOnly"
                label="Stok tersedia"
                color="primary"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-btn
                @click="refreshItems"
                :loading="loadingItems"
                color="primary"
                variant="outlined"
                prepend-icon="mdi-refresh"
                block
              >
                Refresh
              </v-btn>
            </v-col>
          </v-row>

          <!-- Items List -->
          <v-data-table
            :headers="itemHeaders"
            :items="filteredItems"
            :loading="loadingItems"
            item-value="id"
            density="compact"
          >
            <template #item.price="{ item }">
              {{ formatCurrency(item.price) }}
            </template>

            <template #item.stock="{ item }">
              <v-chip
                :color="
                  item.stock < 5
                    ? 'error'
                    : item.stock < 10
                    ? 'warning'
                    : 'success'
                "
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
                @click="addToCart(item)"
                :disabled="item.stock === 0"
              >
                Tambah
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>

      <!-- Cart -->
      <v-card class="mb-4">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Keranjang Penjualan</span>
          <v-chip color="primary" v-if="cart.length">
            {{ cart.length }} item
          </v-chip>
        </v-card-title>

        <v-card-text>
          <div
            v-if="cart.length === 0"
            class="text-center text-medium-emphasis py-8"
          >
            <v-icon size="48" class="mb-2">mdi-cart-outline</v-icon>
            <div>Belum ada barang di keranjang</div>
          </div>

          <div v-else>
            <v-list>
              <v-list-item
                v-for="(cartItem, index) in cart"
                :key="cartItem.id"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar color="primary" size="32">
                    <v-icon size="16">mdi-package</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>{{ cartItem.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatCurrency(cartItem.price) }} x {{ cartItem.quantity }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex align-center">
                    <v-btn
                      icon="mdi-minus"
                      size="small"
                      variant="text"
                      @click="updateCartQuantity(index, cartItem.quantity - 1)"
                    />
                    <span class="mx-2 font-weight-bold">{{
                      cartItem.quantity
                    }}</span>
                    <v-btn
                      icon="mdi-plus"
                      size="small"
                      variant="text"
                      @click="updateCartQuantity(index, cartItem.quantity + 1)"
                      :disabled="cartItem.quantity >= cartItem.stock"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeFromCart(index)"
                      class="ml-2"
                    />
                  </div>
                </template>
              </v-list-item>
            </v-list>

            <v-divider class="my-4" />

            <!-- Total -->
            <div class="d-flex justify-space-between align-center mb-4">
              <span class="text-h6">Total:</span>
              <span class="text-h5 font-weight-bold text-primary">
                {{ formatCurrency(cartTotal) }}
              </span>
            </div>

            <!-- Submit Button -->
            <v-btn
              color="primary"
              size="large"
              block
              :loading="saving"
              @click="submitItemsSale"
              prepend-icon="mdi-content-save"
            >
              Simpan Penjualan
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="400px">
      <v-card>
        <v-card-text class="text-center py-6">
          <v-icon size="64" color="success" class="mb-4"
            >mdi-check-circle</v-icon
          >
          <div class="text-h6 mb-2">Penjualan Berhasil Disimpan!</div>
          <div class="text-body-2 text-medium-emphasis">
            Total: {{ formatCurrency(lastSaleAmount) }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="successDialog = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDataStore } from "@/stores/data";
import { createSale, updateItemStock } from "@/utils/supabase";
import { formatCurrency, validateInput } from "@/utils/helpers";

const authStore = useAuthStore();
const dataStore = useDataStore();

const inputMode = ref("manual");
const saving = ref(false);
const loadingItems = ref(false);
const successDialog = ref(false);
const lastSaleAmount = ref(0);

// Manual input
const manualAmount = ref("");
const manualNotes = ref("");
const manualForm = ref();

// Items input
const itemSearch = ref("");
const selectedCategory = ref("");
const showAvailableOnly = ref(true);
const cart = ref([]);

const itemHeaders = [
  { title: "Nama", key: "name", sortable: true },
  { title: "Kategori", key: "categories.name", sortable: true },
  { title: "Merek", key: "brand", sortable: true },
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
  if (itemSearch.value) {
    const searchLower = itemSearch.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower)
    );
  }

  // Category filter
  if (selectedCategory.value) {
    items = items.filter((item) => item.category_id === selectedCategory.value);
  }

  // Stock filter
  if (showAvailableOnly.value) {
    items = items.filter((item) => item.stock > 0);
  }

  return items;
});

const cartTotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const addToCart = (item) => {
  const existingIndex = cart.value.findIndex(
    (cartItem) => cartItem.id === item.id
  );

  if (existingIndex >= 0) {
    // Check if we can increase quantity
    const currentCartItem = cart.value[existingIndex];
    const newQuantity = currentCartItem.quantity + 1;
    
    if (newQuantity > item.stock) {
      alert(`Stok "${item.name}" tidak mencukupi. Maksimal: ${item.stock}`);
      return;
    }
    
    // Increase quantity if item already in cart
    updateCartQuantity(existingIndex, newQuantity);
  } else {
    // Check stock before adding new item
    if (item.stock <= 0) {
      alert(`Barang "${item.name}" sedang habis stok`);
      return;
    }
    
    // Add new item to cart
    cart.value.push({
      ...item,
      quantity: 1,
    });
  }
};

const updateCartQuantity = (index, newQuantity) => {
  if (newQuantity <= 0) {
    removeFromCart(index);
    return;
  }

  const cartItem = cart.value[index];
  
  // Validate against available stock
  if (newQuantity > cartItem.stock) {
    alert(`Stok "${cartItem.name}" tidak mencukupi. Maksimal: ${cartItem.stock}`);
    return;
  }
  
  cartItem.quantity = newQuantity;
};

const removeFromCart = (index) => {
  cart.value.splice(index, 1);
};

const submitManualSale = async () => {
  const { valid } = await manualForm.value.validate();
  if (!valid) return;

  saving.value = true;

  try {
    const saleData = {
      employee_id: authStore.user.id,
      total: Number(manualAmount.value),
      details: {
        type: "manual",
        notes: manualNotes.value || null,
      },
      created_at: new Date().toISOString(),
      edited_by_admin: false,
      edit_log: {},
      is_deleted: false,
    };

    await createSale(saleData);

    lastSaleAmount.value = Number(manualAmount.value);
    successDialog.value = true;

    // Reset form
    manualAmount.value = "";
    manualNotes.value = "";
    manualForm.value.reset();
  } catch (error) {
    console.error("Error saving manual sale:", error);
    alert("Terjadi kesalahan saat menyimpan penjualan");
  } finally {
    saving.value = false;
  }
};

const submitItemsSale = async () => {
  if (cart.value.length === 0) return;

  saving.value = true;

  try {
    // Validate stock availability before processing sale
    const stockErrors = [];
    
    for (const cartItem of cart.value) {
      // Find current item data to check stock
      const currentItem = dataStore.items.find(item => item.id === cartItem.id);
      
      if (!currentItem) {
        stockErrors.push(`Barang "${cartItem.name}" tidak ditemukan`);
        continue;
      }
      
      if (currentItem.stock < cartItem.quantity) {
        stockErrors.push(
          `Stok "${cartItem.name}" tidak mencukupi. Tersedia: ${currentItem.stock}, Diminta: ${cartItem.quantity}`
        );
      }
    }
    
    // If there are stock errors, show them and stop
    if (stockErrors.length > 0) {
      alert(`Gagal menyimpan penjualan:\n\n${stockErrors.join('\n')}`);
      return;
    }

    const saleData = {
      employee_id: authStore.user.id,
      total: cartTotal.value,
      details: {
        type: "items",
        items: cart.value.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
      },
      created_at: new Date().toISOString(),
      edited_by_admin: false,
      edit_log: {},
      is_deleted: false,
    };

    // Save the sale first
    await createSale(saleData);

    // Update stock for each item
    for (const cartItem of cart.value) {
      await updateItemStock(cartItem.id, cartItem.quantity);
    }

    lastSaleAmount.value = cartTotal.value;
    successDialog.value = true;

    // Reset cart
    cart.value = [];

    // Refresh items data to get updated stock
    await dataStore.fetchItems();
  } catch (error) {
    console.error("Error saving items sale:", error);
    
    // Show more specific error message
    let errorMessage = "Terjadi kesalahan saat menyimpan penjualan";
    
    if (error.message && error.message.includes("Stok tidak mencukupi")) {
      errorMessage = "Stok barang tidak mencukupi atau barang tidak ditemukan. Silakan refresh halaman dan coba lagi.";
    } else if (error.code === "P0001") {
      errorMessage = error.message || "Validasi database gagal";
    }
    
    alert(errorMessage);
  } finally {
    saving.value = false;
  }
};

const refreshItems = async () => {
  loadingItems.value = true;
  try {
    await dataStore.fetchItems();
    console.log("Items data refreshed");
  } catch (error) {
    console.error("Error refreshing items:", error);
    alert("Gagal memuat ulang data barang");
  } finally {
    loadingItems.value = false;
  }
};

onMounted(async () => {
  // Load cart from session storage if available
  const savedCart = sessionStorage.getItem("quickCart");
  if (savedCart) {
    try {
      cart.value = JSON.parse(savedCart);
      sessionStorage.removeItem("quickCart");
      inputMode.value = "items"; // Switch to items mode if cart exists
    } catch (error) {
      console.error("Error loading cart from session:", error);
    }
  }

  loadingItems.value = true;
  try {
    await Promise.all([dataStore.fetchItems(), dataStore.fetchCategories()]);
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    loadingItems.value = false;
  }
});
</script>
