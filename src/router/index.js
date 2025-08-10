import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Login",
      component: () => import("@/views/Login.vue"),
    },
    {
      path: "/admin",
      component: () => import("@/views/admin/AdminLayout.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: "",
          name: "AdminDashboard",
          component: () => import("@/views/admin/Dashboard.vue"),
        },
        {
          path: "items",
          name: "AdminItems",
          component: () => import("@/views/admin/Items.vue"),
        },
        {
          path: "categories",
          name: "AdminCategories",
          component: () => import("@/views/admin/Categories.vue"),
        },
        {
          path: "employees",
          name: "AdminEmployees",
          component: () => import("@/views/admin/Employees.vue"),
        },
        {
          path: "sales",
          name: "AdminSales",
          component: () => import("@/views/admin/Sales.vue"),
        },
        {
          path: "input-sales",
          name: "AdminInputSales",
          component: () => import("@/views/admin/InputSales.vue"),
        },
        {
          path: "reports",
          name: "AdminReports",
          component: () => import("@/views/admin/Reports.vue"),
        },
        {
          path: "settings",
          name: "AdminSettings",
          component: () => import("@/views/admin/Settings.vue"),
        },
      ],
    },
    {
      path: "/employee",
      component: () => import("@/views/employee/EmployeeLayout.vue"),
      meta: { requiresAuth: true, requiresEmployee: true },
      children: [
        {
          path: "",
          name: "EmployeeDashboard",
          component: () => import("@/views/employee/Dashboard.vue"),
        },
        {
          path: "items",
          name: "EmployeeItems",
          component: () => import("@/views/employee/Items.vue"),
        },
        {
          path: "sales",
          name: "EmployeeSales",
          component: () => import("@/views/employee/Sales.vue"),
        },
        {
          path: "input-sales",
          name: "EmployeeInputSales",
          component: () => import("@/views/employee/InputSales.vue"),
        },
      ],
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Check if user is authenticated
  if (!authStore.isLoggedIn && to.meta.requiresAuth) {
    return next("/");
  }

  // Check admin access
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next("/employee");
  }

  // Check employee access
  if (to.meta.requiresEmployee && !authStore.isEmployee) {
    return next("/admin");
  }

  // Redirect authenticated users away from login
  if (authStore.isLoggedIn && to.name === "Login") {
    return next(authStore.isAdmin ? "/admin" : "/employee");
  }

  next();
});

export default router;
