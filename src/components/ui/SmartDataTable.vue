<template>
  <div class="smart-data-table">
    <!-- Search and Filters -->
    <div v-if="showFilters || $slots.filters" class="filters-section mb-4">
      <v-card>
        <v-card-text class="">
          <v-row v-if="showFilters">
            <v-col cols="12" md="4">
              <v-text-field
                :model-value="searchValue"
                @update:model-value="updateSearch"
                :label="searchLabel"
                :placeholder="searchPlaceholder"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
                hide-details
              />
            </v-col>

            <v-col cols="12" md="3" v-if="categories.length">
              <v-select
                :model-value="selectedCategory"
                @update:model-value="updateCategory"
                :items="categoryOptions"
                label="Kategori"
                variant="outlined"
                density="compact"
                clearable
                hide-details
              />
            </v-col>

            <v-col cols="12" md="2" v-if="showAvailableToggle">
              <v-switch
                :model-value="showAvailableOnly"
                @update:model-value="updateAvailableOnly"
                label="Tersedia saja"
                hide-details
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="2" v-if="showRefresh">
              <v-btn
                @click="refresh"
                :loading="loading"
                color="primary"
                variant="outlined"
                prepend-icon="mdi-refresh"
                block
              >
                Refresh
              </v-btn>
            </v-col>
          </v-row>

          <!-- Custom filters slot -->
          <div v-if="$slots.filters" class="mt-3">
            <slot name="filters" />
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Data Table -->
    <v-card>
      <v-data-table
        :headers="computedHeaders"
        :items="items"
        :loading="loading"
        :search="searchValue"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        :server-items-length="serverItemsLength"
        :show-current-page="showPagination"
        :items-per-page-options="itemsPerPageOptions"
        v-bind="$attrs"
        @update:page="updatePage"
        @update:items-per-page="updateItemsPerPage"
        @update:sort-by="updateSortBy"
        @click:row="handleRowClick"
        :class="{ 'clickable-rows': clickableRows }"
      >
        <!-- Pass through all slots -->
        <template v-for="(slot, name) in $slots" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData" />
        </template>

        <!-- Default action column -->
        <template v-if="defaultActions.length" #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              v-for="action in getItemActions(item)"
              :key="action.key"
              :icon="action.icon"
              :color="action.color"
              :variant="action.variant || 'text'"
              :size="action.size || 'small'"
              :disabled="action.disabled ? action.disabled(item) : false"
              @click.stop="action.handler(item)"
            />
          </div>
        </template>

        <!-- No data slot -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon
              :size="emptyIcon.size || 64"
              :color="emptyIcon.color || 'grey'"
            >
              {{ emptyIcon.name || "mdi-database-off" }}
            </v-icon>
            <div class="text-h6 mt-2">{{ emptyTitle || "Tidak ada data" }}</div>
            <div class="text-subtitle-1 mb-4">
              {{ emptyText || "Data tidak tersedia atau belum ditambahkan" }}
            </div>

            <v-btn
              v-if="emptyAction"
              :color="emptyAction.color || 'primary'"
              :prepend-icon="emptyAction.icon"
              @click="emptyAction.handler"
            >
              {{ emptyAction.text }}
            </v-btn>
          </div>
        </template>

        <!-- Loading slot -->
        <template #loading>
          <div class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <div class="text-subtitle-1 mt-3">
              {{ loadingText || "Memuat data..." }}
            </div>
          </div>
        </template>
      </v-data-table>

      <!-- Custom pagination -->
      <div
        v-if="showPagination && totalPages > 1"
        class="d-flex justify-center pa-4"
      >
        <v-pagination
          :model-value="currentPage"
          @update:model-value="updatePage"
          :length="totalPages"
          :total-visible="7"
          density="comfortable"
          color="primary"
        />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // Data props
  items: {
    type: Array,
    default: () => [],
  },
  headers: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },

  // Server-side props
  serverItemsLength: Number,

  // Search props
  searchValue: String,
  searchLabel: {
    type: String,
    default: "Cari...",
  },
  searchPlaceholder: String,
  showFilters: {
    type: Boolean,
    default: true,
  },

  // Filter props
  categories: {
    type: Array,
    default: () => [],
  },
  selectedCategory: String,
  showAvailableOnly: Boolean,
  showAvailableToggle: Boolean,
  showRefresh: {
    type: Boolean,
    default: true,
  },

  // Pagination props
  currentPage: {
    type: Number,
    default: 1,
  },
  itemsPerPage: {
    type: Number,
    default: 25,
  },
  itemsPerPageOptions: {
    type: Array,
    default: () => [
      { value: 10, title: "10" },
      { value: 25, title: "25" },
      { value: 50, title: "50" },
      { value: 100, title: "100" },
      { value: -1, title: "Semua" },
    ],
  },
  showPagination: {
    type: Boolean,
    default: true,
  },

  // Action props
  defaultActions: {
    type: Array,
    default: () => [],
  },
  clickableRows: Boolean,

  // Empty state props
  emptyTitle: String,
  emptyText: String,
  emptyIcon: {
    type: Object,
    default: () => ({ name: "mdi-database-off", size: 64, color: "grey" }),
  },
  emptyAction: Object, // { text, icon, color, handler }

  // Loading props
  loadingText: String,

  // Performance props
  virtualScrolling: {
    type: Boolean,
    default: false,
  },
  lazyLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:search",
  "update:category",
  "update:available-only",
  "update:page",
  "update:items-per-page",
  "update:sort-by",
  "refresh",
  "row:click",
]);

// Computed properties
const computedHeaders = computed(() => {
  const headers = [...props.headers];

  // Add actions column if default actions exist
  if (props.defaultActions.length) {
    headers.push({
      title: "Aksi",
      key: "actions",
      sortable: false,
      width: props.defaultActions.length * 50 + 20,
    });
  }

  return headers;
});

const categoryOptions = computed(() => [
  { title: "Semua Kategori", value: "" },
  ...props.categories.map((cat) => ({
    title: cat.name,
    value: cat.id,
  })),
]);

const totalPages = computed(() => {
  if (props.serverItemsLength) {
    return Math.ceil(props.serverItemsLength / props.itemsPerPage);
  }
  return Math.ceil(props.items.length / props.itemsPerPage);
});

// Methods
const updateSearch = (value) => emit("update:search", value);
const updateCategory = (value) => emit("update:category", value);
const updateAvailableOnly = (value) => emit("update:available-only", value);
const updatePage = (page) => emit("update:page", page);
const updateItemsPerPage = (size) => emit("update:items-per-page", size);
const updateSortBy = (sortBy) => emit("update:sort-by", sortBy);
const refresh = () => emit("refresh");

const handleRowClick = (event, { item }) => {
  if (props.clickableRows) {
    emit("row:click", item);
  }
};

const getItemActions = (item) => {
  return props.defaultActions.filter((action) => {
    if (action.condition) {
      return action.condition(item);
    }
    return true;
  });
};
</script>

<style scoped>
.smart-data-table {
  width: 100%;
}

.filters-section {
  margin-bottom: 16px;
}

.clickable-rows :deep(.v-data-table__wrapper table tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-rows :deep(.v-data-table__wrapper table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Responsive improvements */
@media (max-width: 600px) {
  .filters-section .v-row {
    margin: 0;
  }

  .filters-section .v-col {
    padding: 8px 0;
  }
}
</style>
