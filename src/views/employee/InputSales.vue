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
          <v-col cols="12">
            <v-btn-toggle
              v-model="inputMode"
              color="primary"
              mandatory
              variant="outlined"
              divided
              class="w-100"
            >
              <v-btn value="manual" class="flex-grow-1">
                <v-icon start class="d-none d-sm-inline">mdi-calculator</v-icon>
                <v-icon start class="d-inline d-sm-none">mdi-calculator</v-icon>
                <span class="d-none d-sm-inline">Input Manual</span>
                <span class="d-inline d-sm-none">Manual</span>
              </v-btn>
              <v-btn value="items" class="flex-grow-1">
                <v-icon start class="d-none d-sm-inline"
                  >mdi-package-variant</v-icon
                >
                <v-icon start class="d-inline d-sm-none"
                  >mdi-package-variant</v-icon
                >
                <span class="d-none d-sm-inline">Berdasarkan Barang</span>
                <span class="d-inline d-sm-none">Barang</span>
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
            <v-col cols="12" md="4">
              <v-text-field
                v-model="itemSearch"
                label="Cari barang..."
                placeholder="Contoh: philips 5 watt atau lampu 5"
                prepend-inner-icon="mdi-magnify"
                hint="Ketik beberapa kata kunci untuk pencarian yang lebih akurat"
                persistent-hint
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
            <v-col cols="12" md="1" class="d-block d-md-none">
              <v-select
                v-model="itemsPerPage"
                :items="[12, 24, 48, 96]"
                label="Per halaman"
                variant="outlined"
                density="compact"
                hide-details
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

          <!-- Stats and Clear Filters -->
          <v-row class="mb-2">
            <v-col cols="12">
              <div class="d-flex justify-space-between align-center">
                <div class="d-flex align-center flex-wrap">
                  <v-chip color="info" variant="tonal" class="mr-2 mb-1">
                    Total: {{ filteredItems.length }} barang
                  </v-chip>
                  <v-chip
                    color="primary"
                    variant="tonal"
                    class="mr-2 mb-1"
                    v-if="filteredItems.length !== totalItems"
                  >
                    Ditampilkan:
                    {{ Math.min(paginatedItems.length, itemsPerPage) }}
                  </v-chip>
                  <v-chip
                    color="success"
                    variant="tonal"
                    class="mb-1"
                    v-if="totalPages > 1"
                  >
                    Halaman {{ currentPage }} dari {{ totalPages }}
                  </v-chip>
                </div>

                <v-btn
                  v-if="hasActiveFilters"
                  color="warning"
                  variant="outlined"
                  prepend-icon="mdi-filter-remove"
                  @click="clearFilters"
                  size="small"
                  class="mb-1"
                >
                  Hapus Filter
                </v-btn>
              </div>
            </v-col>
          </v-row>

          <!-- Cart Summary Mobile -->
          <div class="d-block d-md-none mb-4" v-if="cart.length > 0">
            <v-card color="primary" variant="tonal">
              <v-card-text class="pa-3">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-caption">
                      {{ cart.length }} item dalam keranjang
                    </div>
                    <div class="text-h6 font-weight-bold">
                      {{ formatCurrency(cartTotal) }}
                    </div>
                  </div>
                  <v-btn
                    color="primary"
                    size="small"
                    variant="flat"
                    @click="scrollToCart"
                    append-icon="mdi-arrow-down"
                  >
                    Lihat
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <!-- Filter Summary Mobile -->
          <div
            class="d-block d-md-none mb-3"
            v-if="itemSearch || selectedCategory || !showAvailableOnly"
          >
            <v-card variant="outlined" color="info">
              <v-card-text class="pa-2">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-caption">
                    <span v-if="itemSearch">Pencarian: "{{ itemSearch }}"</span>
                    <span v-if="selectedCategory">
                      • {{ getCategoryName(selectedCategory) }}</span
                    >
                    <span v-if="!showAvailableOnly">
                      • Termasuk habis stok</span
                    >
                  </div>
                  <v-btn
                    size="x-small"
                    variant="text"
                    icon="mdi-close"
                    @click="clearFilters"
                  />
                </div>
              </v-card-text>
            </v-card>
          </div>
          <div class="d-block d-md-none">
            <!-- Loading State Mobile -->
            <div v-if="loadingItems" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64" />
              <div class="text-h6 mt-3">Memuat barang...</div>
            </div>

            <!-- Empty State Mobile -->
            <div
              v-else-if="filteredItems.length === 0"
              class="text-center py-8"
            >
              <v-icon size="80" color="grey-lighten-2"
                >mdi-package-variant-closed</v-icon
              >
              <div class="text-h6 mt-3 mb-2">Tidak Ada Barang</div>
              <div class="text-body-2 text-medium-emphasis">
                {{
                  hasActiveFilters
                    ? "Coba ubah filter pencarian"
                    : "Belum ada barang yang tersedia"
                }}
              </div>
            </div>

            <!-- Items Grid Mobile -->
            <v-row v-else>
              <v-col
                v-for="item in paginatedItems"
                :key="item.id"
                cols="6"
                sm="4"
                md="3"
              >
                <v-card
                  :ripple="true"
                  hover
                  :disabled="item.stock === 0"
                  :class="{
                    'item-card': true,
                    'item-in-cart': isInCart(item.id),
                    'item-out-of-stock': item.stock === 0,
                  }"
                  @click="handleItemClick(item)"
                >
                  <v-card-text class="pa-3">
                    <!-- Stock indicator -->
                    <div class="d-flex justify-end mb-2">
                      <v-chip
                        :color="
                          item.stock < 5
                            ? 'error'
                            : item.stock < 10
                            ? 'warning'
                            : 'success'
                        "
                        size="x-small"
                        variant="tonal"
                      >
                        {{ item.stock }}
                      </v-chip>
                    </div>

                    <!-- Item name -->
                    <div
                      class="text-subtitle-2 font-weight-bold mb-1 text-truncate"
                    >
                      {{ item.name }}
                    </div>

                    <!-- Brand -->
                    <div class="text-caption text-medium-emphasis mb-2">
                      {{ item.brand }}
                    </div>

                    <!-- Price -->
                    <div class="text-h6 font-weight-bold text-primary mb-2">
                      {{ item.price ? formatCurrency(item.price) : "Rp 0" }}
                    </div>

                    <!-- Cart status -->
                    <div v-if="isInCart(item.id)" class="text-center">
                      <v-chip
                        color="success"
                        size="x-small"
                        variant="flat"
                        prepend-icon="mdi-cart"
                      >
                        {{ getCartQuantity(item.id) }}
                      </v-chip>
                    </div>
                    <div v-else-if="item.stock > 0" class="text-center">
                      <v-icon
                        size="small"
                        color="primary"
                        class="cart-hint-icon"
                      >
                        mdi-plus-circle-outline
                      </v-icon>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Mobile Pagination -->
            <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="5"
                density="compact"
                color="primary"
              />
            </div>
          </div>

          <!-- Items List Desktop -->
          <div class="d-none d-md-block">
            <!-- Loading State Desktop -->
            <div v-if="loadingItems" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64" />
              <div class="text-h6 mt-3">Memuat barang...</div>
            </div>

            <!-- Empty State Desktop -->
            <div
              v-else-if="filteredItems.length === 0"
              class="text-center py-8"
            >
              <v-icon size="80" color="grey-lighten-2"
                >mdi-package-variant-closed</v-icon
              >
              <div class="text-h6 mt-3 mb-2">Tidak Ada Barang</div>
              <div class="text-body-2 text-medium-emphasis">
                {{
                  hasActiveFilters
                    ? "Coba ubah filter pencarian"
                    : "Belum ada barang yang tersedia"
                }}
              </div>
            </div>

            <!-- Data Table Desktop -->
            <v-data-table
              v-else
              :headers="itemHeaders"
              :items="paginatedItems"
              :loading="loadingItems"
              item-value="id"
              density="compact"
              @click:row="handleRowClick"
              class="clickable-table"
              hide-default-footer
            >
              <template #item.price="{ item }">
                {{ item.price ? formatCurrency(item.price) : "Rp 0" }}
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
                <div @click.stop>
                  <v-chip
                    v-if="isInCart(item.id)"
                    color="success"
                    size="small"
                    variant="flat"
                    prepend-icon="mdi-cart"
                  >
                    {{ getCartQuantity(item.id) }}
                  </v-chip>
                  <v-icon
                    v-else-if="item.stock > 0"
                    color="primary"
                    size="small"
                  >
                    mdi-plus-circle-outline
                  </v-icon>
                  <v-icon v-else color="error" size="small">
                    mdi-close-circle-outline
                  </v-icon>
                </div>
              </template>
            </v-data-table>

            <!-- Desktop Pagination -->
            <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                density="comfortable"
                color="primary"
              />
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Cart -->
      <v-card id="cart-section" class="mb-4">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Keranjang Penjualan</span>
          <div class="d-flex align-center gap-2">
            <v-chip color="primary" v-if="cart.length">
              {{ cart.length }} item
            </v-chip>
            <v-btn
              color="info"
              size="small"
              variant="outlined"
              @click="customItemDialog = true"
              prepend-icon="mdi-plus-circle"
              class="d-none d-md-flex"
            >
              Tambah Custom
            </v-btn>
            <v-btn
              color="info"
              size="small"
              variant="text"
              icon="mdi-plus-circle"
              @click="customItemDialog = true"
              class="d-flex d-md-none"
            />
            <v-btn
              v-if="cart.length > 0"
              color="warning"
              size="small"
              variant="outlined"
              @click="clearCart"
              prepend-icon="mdi-cart-remove"
              class="d-none d-md-flex"
            >
              Clear
            </v-btn>
            <v-btn
              v-if="cart.length > 0"
              color="warning"
              size="small"
              variant="text"
              icon="mdi-cart-remove"
              @click="clearCart"
              class="d-flex d-md-none"
            />
          </div>
        </v-card-title>

        <v-card-text>
          <div
            v-if="cart.length === 0"
            class="text-center text-medium-emphasis py-8"
          >
            <v-icon size="48" class="mb-2">mdi-cart-outline</v-icon>
            <div>Belum ada barang di keranjang</div>
            <div class="text-caption mt-1">
              Tap barang untuk menambah ke keranjang
            </div>
          </div>

          <div v-else>
            <!-- Mobile Cart List -->
            <div class="d-block d-md-none">
              <v-row>
                <v-col
                  v-for="(cartItem, index) in cart"
                  :key="cartItem.id"
                  cols="12"
                >
                  <v-card variant="outlined" class="cart-item-mobile">
                    <v-card-text class="pa-3">
                      <div class="d-flex align-center">
                        <v-avatar color="primary" size="40" class="mr-3">
                          <v-icon size="20">mdi-package</v-icon>
                        </v-avatar>

                        <div class="flex-grow-1">
                          <div class="text-subtitle-2 font-weight-bold">
                            {{ cartItem.name }}
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            <template v-if="cartItem.isCustom">
                              <v-chip
                                size="x-small"
                                color="info"
                                variant="tonal"
                              >
                                {{ cartItem.type }}
                              </v-chip>
                            </template>
                            <template v-else>
                              {{ cartItem.brand }}
                            </template>
                          </div>
                          <div
                            class="text-body-2 font-weight-bold text-primary"
                          >
                            {{
                              cartItem.price
                                ? formatCurrency(cartItem.price)
                                : "Rp 0"
                            }}
                            x {{ cartItem.quantity }}
                          </div>
                        </div>

                        <div class="d-flex flex-column align-center ml-3">
                          <!-- Quantity controls -->
                          <div class="d-flex align-center mb-1">
                            <v-btn
                              icon="mdi-minus"
                              size="small"
                              variant="outlined"
                              @click="
                                updateCartQuantity(index, cartItem.quantity - 1)
                              "
                              density="compact"
                            />
                            <span class="mx-3 font-weight-bold text-h6">{{
                              cartItem.quantity
                            }}</span>
                            <v-btn
                              icon="mdi-plus"
                              size="small"
                              variant="outlined"
                              @click="
                                updateCartQuantity(index, cartItem.quantity + 1)
                              "
                              :disabled="
                                !cartItem.isCustom &&
                                cartItem.quantity >= cartItem.stock
                              "
                              density="compact"
                            />
                          </div>

                          <!-- Remove button -->
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            @click="removeFromCart(index)"
                          />
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Desktop Cart List -->
            <div class="d-none d-md-block">
              <v-list>
                <v-list-item
                  v-for="(cartItem, index) in cart"
                  :key="cartItem.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar
                      :color="cartItem.isCustom ? 'info' : 'primary'"
                      size="32"
                    >
                      <v-icon size="16">
                        {{
                          cartItem.isCustom ? "mdi-plus-circle" : "mdi-package"
                        }}
                      </v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title>
                    {{ cartItem.name }}
                    <v-chip
                      v-if="cartItem.isCustom"
                      size="x-small"
                      color="info"
                      variant="tonal"
                      class="ml-2"
                    >
                      Custom
                    </v-chip>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <template v-if="cartItem.isCustom">
                      {{ cartItem.type }} •
                    </template>
                    {{
                      cartItem.price ? formatCurrency(cartItem.price) : "Rp 0"
                    }}
                    x {{ cartItem.quantity }}
                  </v-list-item-subtitle>

                  <template #append>
                    <div class="d-flex align-center">
                      <v-btn
                        icon="mdi-minus"
                        size="small"
                        variant="text"
                        @click="
                          updateCartQuantity(index, cartItem.quantity - 1)
                        "
                      />
                      <span class="mx-2 font-weight-bold">{{
                        cartItem.quantity
                      }}</span>
                      <v-btn
                        icon="mdi-plus"
                        size="small"
                        variant="text"
                        @click="
                          updateCartQuantity(index, cartItem.quantity + 1)
                        "
                        :disabled="
                          !cartItem.isCustom &&
                          cartItem.quantity >= cartItem.stock
                        "
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
            </div>

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
        <v-card-actions class="px-6 pb-6">
          <v-btn
            color="secondary"
            variant="outlined"
            @click="successDialog = false"
            class="flex-1"
          >
            Tutup
          </v-btn>
          <v-btn color="primary" @click="printReceipt" class="flex-1 ml-3">
            <v-icon class="mr-2">mdi-printer</v-icon>
            Cetak Struk
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Receipt Modal -->
    <v-dialog v-model="receiptDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-center py-3">
          <v-icon class="mr-2">mdi-receipt</v-icon>
          Struk Penjualan
        </v-card-title>
        <v-divider />

        <!-- Receipt Content -->
        <div
          id="receipt-content"
          class="pa-4"
          style="
            background: white;
            color: black;
            font-family: 'Courier New', monospace;
          "
        >
          <!-- Header -->
          <div class="text-center mb-3">
            <!-- Logo -->
            <div style="margin-bottom: 10px">
              <img
                src="/logo.jpg"
                alt="Mega Teknik Logo"
                style="max-width: 80px; max-height: 80px; object-fit: contain"
                onerror="this.style.display='none'"
              />
            </div>
            <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px">
              MEGA TEKNIK
            </div>
            <div style="font-size: 12px; line-height: 1.3">
              Peralatan Teknik & Elektronik<br />
              Jl. Contoh No. 123, Kota<br />
              Telp: (021) 12345678
            </div>
            <div style="border-top: 1px dashed black; margin: 10px 0"></div>
          </div>

          <!-- Sale Info -->
          <div style="font-size: 12px; margin-bottom: 15px">
            <div style="display: flex; justify-content: space-between">
              <span>Tanggal:</span>
              <span>{{ formatDate(new Date()) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between">
              <span>Kasir:</span>
              <span>{{ authStore.user?.email?.split("@")[0] || "Admin" }}</span>
            </div>
            <div style="border-top: 1px dashed black; margin: 10px 0"></div>
          </div>

          <!-- Items -->
          <div style="font-size: 12px; margin-bottom: 15px">
            <template v-if="inputMode === 'manual'">
              <div
                v-for="(item, index) in manualItems"
                :key="index"
                style="margin-bottom: 8px"
              >
                <div style="display: flex; justify-content: space-between">
                  <span style="font-weight: bold">{{ item.name }}</span>
                </div>
                <div style="display: flex; justify-content: space-between">
                  <span>{{ item.qty }} x {{ formatCurrency(item.price) }}</span>
                  <span>{{ formatCurrency(item.qty * item.price) }}</span>
                </div>
              </div>
            </template>

            <template v-else>
              <!-- Items Count Summary -->
              <div
                style="
                  font-size: 11px;
                  color: #666;
                  margin-bottom: 8px;
                  text-align: center;
                "
              >
                {{ lastSaleCart.length }} item{{ lastSaleCart.length > 1 ? "s" : "" }} dibeli
              </div>

              <div
                v-for="(item, index) in lastSaleCart"
                :key="index"
                style="
                  margin-bottom: 12px;
                  padding-bottom: 8px;
                  border-bottom: 1px dotted #ccc;
                "
              >
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2px;
                  "
                >
                  <span style="font-weight: bold; font-size: 13px">{{
                    item.name
                  }}</span>
                </div>
                <div style="font-size: 10px; color: #666; margin-bottom: 3px">
                  <template v-if="item.isCustom">
                    <span>{{ item.type || "Custom Item" }}</span>
                  </template>
                  <template v-else>
                    <div>ID: {{ item.id }}</div>
                    <div>
                      {{ item.brand || "No Brand"
                      }}<span v-if="item.model"> - {{ item.model }}</span>
                    </div>
                    <!-- Category info -->
                    <template v-if="item.category_id">
                      <div>
                        Kategori:
                        {{
                          dataStore.categories.find(
                            (cat) => cat.id === item.category_id
                          )?.name || "Uncategorized"
                        }}
                      </div>
                    </template>
                  </template>
                </div>
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                  "
                >
                  <span
                    >{{ item.quantity }} x
                    {{ formatCurrency(item.price) }}</span
                  >
                  <span style="font-weight: bold">{{
                    formatCurrency(item.quantity * item.price)
                  }}</span>
                </div>
              </div>
            </template>

            <div style="border-top: 1px dashed black; margin: 10px 0"></div>
          </div>

          <!-- Total -->
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 15px">
            <div style="display: flex; justify-content: space-between">
              <span>TOTAL:</span>
              <span>{{ formatCurrency(lastSaleAmount) }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="font-size: 11px; text-align: center; margin-top: 20px">
            <div
              style="border-top: 1px dashed black; margin-bottom: 10px"
            ></div>
            <div>Terima kasih atas kunjungan Anda!</div>
            <div>Barang yang sudah dibeli tidak dapat ditukar</div>
          </div>
        </div>

        <v-card-actions class="px-6 pb-6">
          <v-btn
            color="secondary"
            variant="outlined"
            @click="receiptDialog = false"
            class="flex-1"
          >
            Batal
          </v-btn>
          <v-btn color="primary" @click="downloadReceipt" class="flex-1 ml-3">
            <v-icon class="mr-2">mdi-download</v-icon>
            Unduh Struk
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Custom Item Dialog -->
    <v-dialog v-model="customItemDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          Tambah Barang Custom
        </v-card-title>
        <v-divider />

        <v-card-text class="pt-4">
          <v-form ref="customItemForm" @submit.prevent="addCustomItem">
            <v-text-field
              v-model="customItem.name"
              label="Nama Barang *"
              variant="outlined"
              :rules="[(v) => !!v || 'Nama barang wajib diisi']"
              class="mb-3"
            />

            <v-text-field
              v-model="customItem.price"
              label="Harga Satuan *"
              variant="outlined"
              type="number"
              prefix="Rp"
              :rules="[
                (v) => !!v || 'Harga wajib diisi',
                (v) => v > 0 || 'Harga harus lebih dari 0',
              ]"
              class="mb-3"
            />

            <v-text-field
              v-model="customItem.quantity"
              label="Jumlah *"
              variant="outlined"
              type="number"
              :rules="[
                (v) => !!v || 'Jumlah wajib diisi',
                (v) => v > 0 || 'Jumlah harus lebih dari 0',
              ]"
              class="mb-3"
            />

            <v-text-field
              v-model="customItem.type"
              label="Keterangan (opsional)"
              variant="outlined"
              placeholder="Misal: Barang khusus, Jasa, dll"
              class="mb-3"
            />

            <!-- Total Preview -->
            <v-card
              color="info"
              variant="tonal"
              class="mb-3"
              v-if="customItem.price && customItem.quantity"
            >
              <v-card-text class="py-2">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2">Total Harga:</span>
                  <span class="text-h6 font-weight-bold">
                    {{ formatCurrency(customItem.price * customItem.quantity) }}
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-btn
            color="secondary"
            variant="outlined"
            @click="closeCustomItemDialog"
            class="flex-1"
          >
            Batal
          </v-btn>
          <v-btn color="primary" @click="addCustomItem" class="flex-1 ml-3">
            <v-icon class="mr-2">mdi-cart-plus</v-icon>
            Tambah ke Keranjang
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDataStore } from "@/stores/data";
import { useNotificationStore } from "@/stores/notifications";
import { createSale, updateItemStock } from "@/utils/supabase";
import { formatCurrency, validateInput } from "@/utils/helpers";

const authStore = useAuthStore();
const dataStore = useDataStore();
const notificationStore = useNotificationStore();

const inputMode = ref("manual");
const saving = ref(false);
const loadingItems = ref(false);
const successDialog = ref(false);
const receiptDialog = ref(false);
const customItemDialog = ref(false);

// Pagination variables
const currentPage = ref(1);
const itemsPerPage = ref(24);
const totalItems = ref(0);

// Filter variables
const itemSearch = ref("");
const selectedCategory = ref("");
const showAvailableOnly = ref(true);
const lastSaleAmount = ref(0);
const lastSaleCart = ref([]);

// Manual input
const manualAmount = ref("");
const manualNotes = ref("");
const manualForm = ref();

// Items input - cart
const cart = ref([]);

// Custom item
const customItem = ref({
  name: "",
  price: "",
  quantity: 1,
  type: "",
});
const customItemForm = ref();

const itemHeaders = [
  { title: "Nama", key: "name", sortable: true },
  { title: "Kategori", key: "categories.name", sortable: true },
  { title: "Merek", key: "brand", sortable: true },
  { title: "Harga", key: "price", sortable: true },
  { title: "Stok", key: "stock", sortable: true },
  { title: "Status", key: "actions", sortable: false, width: 100 },
];

// Helper functions
const isInCart = (itemId) => {
  return cart.value.some((cartItem) => cartItem.id === itemId);
};

const getCartQuantity = (itemId) => {
  const cartItem = cart.value.find((cartItem) => cartItem.id === itemId);
  return cartItem ? cartItem.quantity : 0;
};

const getCategoryName = (categoryId) => {
  const category = dataStore.categories.find((cat) => cat.id === categoryId);
  return category ? category.name : "";
};

const scrollToCart = () => {
  const cartElement = document.getElementById("cart-section");
  if (cartElement) {
    cartElement.scrollIntoView({ behavior: "smooth" });
  }
};

const clearFilters = () => {
  itemSearch.value = "";
  selectedCategory.value = "";
  showAvailableOnly.value = true;
  currentPage.value = 1;
};

const categoryOptions = computed(() => [
  { title: "Semua Kategori", value: "" },
  ...dataStore.categories.map((cat) => ({
    title: cat.name,
    value: cat.id,
  })),
]);

const filteredItems = computed(() => {
  let items = [...dataStore.items];

  totalItems.value = items.length;

  // Enhanced search filter - dynamic keyword matching
  if (itemSearch.value) {
    const searchKeywords = itemSearch.value
      .toLowerCase()
      .split(" ")
      .filter((keyword) => keyword.length > 0);

    items = items.filter((item) => {
      // Create searchable text from all relevant fields
      const searchableText = [
        item.name,
        item.brand,
        item.model || "",
        getCategoryName(item.category_id),
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

  // Stock filter
  if (showAvailableOnly.value) {
    items = items.filter((item) => item.stock > 0);
  }

  return items;
});

// Computed for pagination
const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / itemsPerPage.value);
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredItems.value.slice(start, end);
});

const hasActiveFilters = computed(() => {
  return itemSearch.value || selectedCategory.value || !showAvailableOnly.value;
});

const cartTotal = computed(() => {
  return cart.value.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    const subtotal = price * quantity;

    // Validate subtotal
    if (isNaN(subtotal) || !isFinite(subtotal)) {
      console.warn(
        "Invalid subtotal for item:",
        item.name,
        "price:",
        price,
        "quantity:",
        quantity
      );
      return sum;
    }

    return sum + subtotal;
  }, 0);
});

// Handle item click - main function for adding items to cart
const handleItemClick = (item) => {
  if (item.stock === 0) {
    notificationStore.addNotification({
      type: "error",
      message: `Barang "${item.name}" sedang habis stok`,
    });
    return;
  }

  addToCart(item);
};

// Handle row click for desktop data table
const handleRowClick = (event, { item }) => {
  // Vuetify's @click:row passes (event, { item })
  handleItemClick(item);
};

const addToCart = (item) => {
  // Validate item data
  if (
    !item ||
    !item.id ||
    !item.name ||
    item.price === undefined ||
    item.price === null
  ) {
    console.error("Invalid item data:", item);
    notificationStore.addNotification({
      type: "error",
      message: "Data barang tidak valid",
    });
    return;
  }

  // Ensure price is a valid number
  const itemPrice = Number(item.price);
  if (isNaN(itemPrice) || itemPrice < 0) {
    console.error("Invalid item price:", item.price);
    notificationStore.addNotification({
      type: "error",
      message: `Harga barang "${item.name}" tidak valid`,
    });
    return;
  }

  const existingIndex = cart.value.findIndex(
    (cartItem) => cartItem.id === item.id
  );

  if (existingIndex >= 0) {
    // Check if we can increase quantity
    const currentCartItem = cart.value[existingIndex];
    const newQuantity = currentCartItem.quantity + 1;

    if (newQuantity > item.stock) {
      notificationStore.addNotification({
        type: "error",
        message: `Stok "${item.name}" tidak mencukupi. Maksimal: ${item.stock}`,
      });
      return;
    }

    // Increase quantity if item already in cart
    updateCartQuantity(existingIndex, newQuantity);
    notificationStore.addNotification({
      type: "success",
      message: `"${item.name}" ditambahkan (${newQuantity})`,
    });
  } else {
    // Check stock before adding new item
    if (item.stock <= 0) {
      notificationStore.addNotification({
        type: "error",
        message: `Barang "${item.name}" sedang habis stok`,
      });
      return;
    }

    // Add new item to cart with validated price
    cart.value.push({
      ...item,
      price: itemPrice, // Ensure price is a number
      quantity: 1,
    });

    notificationStore.addNotification({
      type: "success",
      message: `"${item.name}" ditambahkan ke keranjang`,
    });
  }
};

const updateCartQuantity = (index, newQuantity) => {
  if (newQuantity <= 0) {
    removeFromCart(index);
    return;
  }

  const cartItem = cart.value[index];

  // For custom items, no stock limitation
  if (cartItem.isCustom) {
    cartItem.quantity = newQuantity;
    return;
  }

  // Validate against available stock for regular items
  if (newQuantity > cartItem.stock) {
    notificationStore.addNotification({
      type: "error",
      message: `Stok "${cartItem.name}" tidak mencukupi. Maksimal: ${cartItem.stock}`,
    });
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
    // First, refresh data to get the most current stock
    console.log("Refreshing items data before sale...");
    await dataStore.fetchItems();

    // Validate stock availability before processing sale
    const stockErrors = [];

    for (const cartItem of cart.value) {
      // Skip stock validation for custom items
      if (cartItem.isCustom) {
        console.log(`Skipping stock check for custom item: ${cartItem.name}`);
        continue;
      }

      // Find current item data to check stock
      const currentItem = dataStore.items.find(
        (item) => item.id === cartItem.id
      );

      console.log(`Checking item ${cartItem.name}:`, {
        cartQuantity: cartItem.quantity,
        currentStock: currentItem?.stock,
        itemId: cartItem.id,
        itemExists: !!currentItem,
      });

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
      alert(`Gagal menyimpan penjualan:\n\n${stockErrors.join("\n")}`);
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

    console.log("Creating sale record...");
    // Save the sale first
    await createSale(saleData);

    console.log("Updating stock for items...");
    // Update stock for each item (skip custom items)
    for (const cartItem of cart.value) {
      // Skip stock update for custom items
      if (cartItem.isCustom) {
        console.log(`Skipping stock update for custom item: ${cartItem.name}`);
        continue;
      }

      console.log(
        `Updating stock for ${cartItem.name} (${cartItem.id}), quantity: ${cartItem.quantity}`
      );
      await updateItemStock(cartItem.id, cartItem.quantity);
    }

    lastSaleAmount.value = cartTotal.value;
    lastSaleCart.value = [...cart.value]; // Save cart data before clearing
    successDialog.value = true;

    // Reset cart
    cart.value = [];

    // Refresh items data to get updated stock
    await dataStore.fetchItems();
  } catch (error) {
    console.error("Error saving items sale:", error);

    // Show more specific error message
    let errorMessage = "Terjadi kesalahan saat menyimpan penjualan";

    if (error.message) {
      // Use the actual error message from our custom functions
      if (
        error.message.includes("tidak mencukupi") ||
        error.message.includes("sudah tidak mencukupi")
      ) {
        errorMessage =
          error.message + "\n\nData akan diperbarui secara otomatis.";
      } else if (error.message.includes("tidak ditemukan")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    } else if (error.code === "P0001") {
      errorMessage =
        "Validasi database gagal. Silakan refresh data dan coba lagi.";
    }

    alert(errorMessage);

    // Auto-refresh data after error
    await dataStore.fetchItems();
  } finally {
    saving.value = false;
  }
};

const clearCart = () => {
  cart.value = [];
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

// Watchers for filter changes
watch([itemSearch, selectedCategory, showAvailableOnly], () => {
  currentPage.value = 1;
});

watch(itemsPerPage, () => {
  currentPage.value = 1;
});

// Reset custom item form when dialog opens
watch(customItemDialog, (newVal) => {
  if (newVal) {
    // Reset form when dialog opens
    customItem.value = {
      name: "",
      price: "",
      quantity: 1,
      type: "",
    };
    // Reset validation in next tick after dialog is fully rendered
    nextTick(() => {
      if (customItemForm.value) {
        customItemForm.value.resetValidation();
      }
    });
  }
});

// Receipt functions
const printReceipt = () => {
  successDialog.value = false;
  receiptDialog.value = true;
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const downloadReceipt = () => {
  const receiptContent = document.getElementById("receipt-content");

  // Create a new window for printing
  const printWindow = window.open("", "_blank", "width=400,height=600");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Penjualan</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Courier New', monospace;
          background: white;
          color: black;
        }
        @media print {
          body { margin: 0; padding: 10px; }
        }
        .logo {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      ${receiptContent.innerHTML}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // Auto print after a short delay
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);

  receiptDialog.value = false;
};

// Custom item functions
const closeCustomItemDialog = () => {
  customItemDialog.value = false;
  // Reset form first before clearing values
  if (customItemForm.value) {
    customItemForm.value.reset();
    customItemForm.value.resetValidation();
  }
  // Then clear the values
  customItem.value = {
    name: "",
    price: "",
    quantity: 1,
    type: "",
  };
};

const addCustomItem = async () => {
  if (!customItemForm.value) return;

  const { valid } = await customItemForm.value.validate();
  if (!valid) return;

  // Create custom item object
  const newCustomItem = {
    id: "custom_" + Date.now(), // Generate unique ID for custom items
    name: customItem.value.name.trim(),
    price: Number(customItem.value.price),
    quantity: Number(customItem.value.quantity),
    type: customItem.value.type.trim() || "Custom Item",
    brand: "Custom",
    model: "",
    stock: 999, // Set high stock for custom items
    isCustom: true, // Flag to identify custom items
  };

  // Add to cart
  cart.value.push(newCustomItem);

  // Show success notification
  notificationStore.addNotification({
    type: "success",
    message: `Barang custom "${newCustomItem.name}" ditambahkan ke keranjang`,
  });

  // Close dialog and reset form properly
  closeCustomItemDialog();
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

<style scoped>
/* Item cards for mobile */
.item-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  min-height: 140px;
}

.item-card:hover:not(.item-out-of-stock) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.item-card.item-in-cart {
  border-color: rgb(var(--v-theme-success));
  background-color: rgba(var(--v-theme-success), 0.1);
}

.item-card.item-out-of-stock {
  opacity: 0.6;
  cursor: not-allowed;
}

.cart-hint-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

/* Clickable table rows */
.clickable-table :deep(.v-data-table__wrapper table tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-table :deep(.v-data-table__wrapper table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

/* Cart item mobile styling */
.cart-item-mobile {
  transition: all 0.2s ease;
}

.cart-item-mobile:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive improvements */
@media (max-width: 600px) {
  .item-card {
    min-height: 120px;
  }

  .cart-item-mobile .v-card-text {
    padding: 12px !important;
  }
}
</style>
