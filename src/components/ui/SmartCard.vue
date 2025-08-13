<template>
  <v-card
    v-bind="$attrs"
    :class="cardClasses"
    :elevation="elevation"
    :variant="variant"
    :color="color"
    :ripple="clickable"
    @click="handleClick"
  >
    <!-- Header slot -->
    <template v-if="title || icon || $slots.header">
      <v-card-title :class="titleClasses">
        <div
          class="smart-card-header"
          style="display: flex; align-items: center; justify-content: center"
        >
          <!-- Left section with icon and title -->
          <div
            class="smart-card-header__main"
            style="display: flex; align-items: center; justify-content: center"
          >
            <v-icon
              v-if="icon"
              :size="iconSize"
              :color="iconColor"
              class="mr-3"
            >
              {{ icon }}
            </v-icon>

            <div class="smart-card-header__content">
              <slot name="header">
                <span class="smart-card-title">{{ title }}</span>
                <div
                  v-if="subtitle"
                  class="smart-card-subtitle text-subtitle-2 text-medium-emphasis"
                >
                  {{ subtitle }}
                </div>
              </slot>
            </div>
          </div>

          <!-- Right section with badge and actions -->
          <div
            v-if="badge || actions || $slots.actions"
            class="smart-card-header__actions"
          >
            <v-chip
              v-if="badge"
              :color="badgeColor"
              :variant="badgeVariant"
              size="small"
              class="smart-card-badge"
            >
              {{ badge }}
            </v-chip>

            <div v-if="actions" class="smart-card-actions">
              <v-btn
                v-for="action in actions"
                :key="action.icon"
                :icon="action.icon"
                :color="action.color"
                :variant="action.variant || 'text'"
                :size="action.size || 'small'"
                @click.stop="action.handler"
              />
            </div>

            <slot name="actions" />
          </div>
        </div>
      </v-card-title>

      <v-divider v-if="!noDivider" />
    </template>

    <!-- Content -->
    <v-card-text v-if="$slots.default || text" :class="contentClasses">
      <slot>{{ text }}</slot>
    </v-card-text>

    <!-- Footer -->
    <template v-if="$slots.footer">
      <v-divider v-if="!noDivider" />
      <v-card-actions>
        <slot name="footer" />
      </v-card-actions>
    </template>

    <!-- Loading overlay -->
    <v-overlay
      v-if="loading"
      :model-value="loading"
      contained
      class="align-center justify-center"
      scrim="rgba(255,255,255,0.8)"
    >
      <v-progress-circular color="primary" size="48" indeterminate />
    </v-overlay>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // Content props
  title: String,
  subtitle: String,
  text: String,
  icon: String,
  iconSize: {
    type: [String, Number],
    default: 24,
  },
  iconColor: String,

  // Badge props
  badge: [String, Number],
  badgeColor: {
    type: String,
    default: "primary",
  },
  badgeVariant: {
    type: String,
    default: "tonal",
  },

  // Actions
  actions: Array, // Array of { icon, color, variant, size, handler }

  // Card appearance
  elevation: {
    type: [String, Number],
    default: 2,
  },
  variant: String,
  color: String,
  rounded: String,

  // Behavior
  clickable: Boolean,
  loading: Boolean,
  disabled: Boolean,

  // Layout
  noDivider: Boolean,
  compact: Boolean,

  // Custom classes
  titleClass: String,
  contentClass: String,
});

const emit = defineEmits(["click"]);

// Computed classes
const cardClasses = computed(() => ({
  "clickable-card": props.clickable,
  "compact-card": props.compact,
  "loading-card": props.loading,
  "disabled-card": props.disabled,
}));

const titleClasses = computed(() => [
  "pa-4",
  { "pa-2": props.compact },
  props.titleClass,
]);

const contentClasses = computed(() => [
  { "pa-2": props.compact },
  props.contentClass,
]);

// Methods
const handleClick = (event) => {
  if (!props.disabled && props.clickable) {
    emit("click", event);
  }
};
</script>

<style scoped>
/* Header Layout */
.smart-card-header {
  display: flex;
  align-items: flex-start;
  width: 100%;
  gap: 16px;
  flex-wrap: wrap;
  min-height: 48px;
}

.smart-card-header__main {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0; /* Allow shrinking */
  gap: 12px;
}

.smart-card-header__content {
  flex: 1;
  min-width: 0;
}

.smart-card-title {
  font-weight: 500;
  line-height: 1.2;
  word-break: break-word;
}

.smart-card-subtitle {
  margin-top: 4px;
  line-height: 1.3;
}

.smart-card-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.smart-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.smart-card-badge {
  flex-shrink: 0;
}

/* Responsive behavior */
@media (max-width: 600px) {
  .smart-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .smart-card-header__actions {
    justify-content: flex-start;
    margin-top: 4px;
  }

  .smart-card-header__main {
    width: 100%;
  }
}

/* When many actions are present */
.smart-card-header__actions:has(> *:nth-child(4)) {
  flex-wrap: wrap;
  max-width: 200px;
}

/* Compact mode adjustments */
.compact-card .smart-card-header {
  gap: 8px;
  min-height: 36px;
}

.compact-card .smart-card-header__main {
  gap: 8px;
}

.compact-card .smart-card-header__actions {
  gap: 4px;
}

/* Card states */
.clickable-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.loading-card {
  position: relative;
}

.disabled-card {
  opacity: 0.6;
  pointer-events: none;
}

.compact-card .v-card-title {
  min-height: unset;
}
</style>
