<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom end"
    offset="8"
    max-width="400"
    max-height="500"
  >
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-bell-outline" variant="text" class="mr-2">
        <v-icon>mdi-bell-outline</v-icon>
        <v-badge
          v-if="notificationStore.unreadCount > 0"
          :content="notificationStore.unreadCount"
          color="error"
          floating
        />
      </v-btn>
    </template>

    <v-card rounded="lg" elevation="8">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div>
          <h3 class="text-h6">Notifikasi</h3>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ notificationStore.unreadCount }} belum dibaca
          </p>
        </div>

        <div class="d-flex">
          <v-btn
            v-if="notificationStore.unreadCount > 0"
            icon="mdi-check-all"
            variant="text"
            size="small"
            @click="notificationStore.markAllAsRead()"
            :title="'Tandai semua sudah dibaca'"
          />
          <v-btn
            icon="mdi-delete-sweep"
            variant="text"
            size="small"
            color="error"
            @click="handleClearAll"
            :title="'Hapus semua'"
          />
        </div>
      </v-card-title>

      <v-divider />

      <!-- Notifications List -->
      <div
        class="notification-list"
        style="max-height: 350px; overflow-y: auto"
      >
        <div
          v-if="notificationStore.notifications.length === 0"
          class="pa-6 text-center"
        >
          <v-icon size="48" color="medium-emphasis" class="mb-2">
            mdi-bell-sleep
          </v-icon>
          <p class="text-medium-emphasis">Tidak ada notifikasi</p>
        </div>

        <v-list v-else density="compact">
          <v-list-item
            v-for="notification in notificationStore.recentNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <template #prepend>
              <v-avatar
                :color="notification.color || 'primary'"
                variant="tonal"
                size="40"
              >
                <v-icon :icon="notification.icon" size="20" />
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ notification.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-wrap">
              {{ notification.message }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex flex-column align-end">
                <v-chip
                  size="x-small"
                  variant="text"
                  color="medium-emphasis"
                  class="mb-1"
                >
                  {{ formatTime(notification.timestamp) }}
                </v-chip>

                <div class="d-flex">
                  <v-btn
                    v-if="notification.action"
                    size="x-small"
                    variant="tonal"
                    :color="notification.color || 'primary'"
                    @click.stop="handleAction(notification)"
                  >
                    {{ notification.action.text }}
                  </v-btn>

                  <v-btn
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    @click.stop="
                      notificationStore.removeNotification(notification.id)
                    "
                    class="ml-1"
                  />
                </div>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- Footer -->
      <v-divider />
      <v-card-actions class="pa-3">
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-refresh"
          @click="refreshNotifications"
          block
        >
          Perbarui Notifikasi
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "@/stores/notifications";
import { useDataStore } from "@/stores/data";

const router = useRouter();
const notificationStore = useNotificationStore();
const dataStore = useDataStore();
const menu = ref(false);

const formatTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes}m lalu`;
  if (hours < 24) return `${hours}h lalu`;
  return `${days}d lalu`;
};

const handleNotificationClick = (notification) => {
  notificationStore.markAsRead(notification.id);
};

const handleAction = (notification) => {
  if (notification.action?.route) {
    router.push(notification.action.route);
    menu.value = false;
  }
  notificationStore.markAsRead(notification.id);
};

const handleClearAll = () => {
  if (confirm("Hapus semua notifikasi?")) {
    notificationStore.clearAll();
  }
};

const refreshNotifications = async () => {
  // Refresh data first
  await Promise.all([dataStore.fetchItems(), dataStore.fetchSales()]);

  // Then check for new notifications
  notificationStore.initializeNotifications(dataStore.items, dataStore.sales);
};
</script>

<style scoped>
.notification-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.notification-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

.notification-item.unread {
  background: rgba(102, 126, 234, 0.08);
  border-left: 3px solid rgb(102, 126, 234);
}

.notification-list {
  scrollbar-width: thin;
}

.notification-list::-webkit-scrollbar {
  width: 4px;
}

.notification-list::-webkit-scrollbar-track {
  background: transparent;
}

.notification-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
</style>
