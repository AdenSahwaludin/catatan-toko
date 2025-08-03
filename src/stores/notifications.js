import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useNotificationStore = defineStore("notifications", () => {
  const notifications = ref([]);
  const unreadCount = ref(0);

  // Add notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    notifications.value.unshift(newNotification);
    updateUnreadCount();

    // Auto remove after 30 seconds if it's a temporary notification
    if (notification.temporary !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 30000);
    }
  };

  // Mark notification as read
  const markAsRead = (id) => {
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      updateUnreadCount();
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    notifications.value.forEach((n) => (n.read = true));
    updateUnreadCount();
  };

  // Remove notification
  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
      updateUnreadCount();
    }
  };

  // Clear all notifications
  const clearAll = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };

  // Update unread count
  const updateUnreadCount = () => {
    unreadCount.value = notifications.value.filter((n) => !n.read).length;
  };

  // Check for low stock and create notifications
  const checkLowStock = (items = []) => {
    items.forEach((item) => {
      if (item.stock <= 5) {
        const existingNotification = notifications.value.find(
          (n) => n.type === "low_stock" && n.itemId === item.id
        );

        if (!existingNotification) {
          addNotification({
            type: "low_stock",
            title: "Stok Rendah",
            message: `${item.name} - Stok tersisa ${item.stock}`,
            color: item.stock === 0 ? "error" : "warning",
            icon: "mdi-alert-circle",
            itemId: item.id,
            temporary: false,
            action: {
              text: "Lihat Barang",
              route: "/admin/items",
            },
          });
        }
      }
    });
  };

  // Check for recent sales and create notifications
  const checkRecentSales = (sales = []) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentSales = sales.filter(
      (sale) => new Date(sale.created_at) > oneHourAgo
    );

    if (recentSales.length > 0) {
      const totalAmount = recentSales.reduce(
        (sum, sale) => sum + sale.total,
        0
      );

      addNotification({
        type: "sales_summary",
        title: "Penjualan Terbaru",
        message: `${recentSales.length} transaksi - ${new Intl.NumberFormat(
          "id-ID",
          {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }
        ).format(totalAmount)}`,
        color: "success",
        icon: "mdi-cash-register",
        temporary: true,
        action: {
          text: "Lihat Penjualan",
          route: "/admin/sales",
        },
      });
    }
  };

  // Initialize notifications based on current data
  const initializeNotifications = (items = [], sales = []) => {
    checkLowStock(items);
    checkRecentSales(sales);
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.value.filter((n) => n.type === type);
  };

  // Get recent notifications (last 10)
  const recentNotifications = computed(() => {
    return notifications.value.slice(0, 10);
  });

  return {
    notifications,
    unreadCount,
    recentNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    checkLowStock,
    checkRecentSales,
    initializeNotifications,
    getNotificationsByType,
  };
});
