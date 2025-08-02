<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <h2 class="text-h5 font-weight-bold">Manajemen Karyawan</h2>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
          Tambah Karyawan
        </v-btn>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-card>
      <v-card-text>
        <v-text-field
          v-model="search"
          label="Cari karyawan..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          class="mb-4"
        />
      </v-card-text>

      <v-data-table
        :headers="headers"
        :items="filteredEmployees"
        :loading="loading"
        item-value="id"
      >
        <template #item.role="{ item }">
          <v-chip
            :color="item.role === 'admin' ? 'primary' : 'secondary'"
            size="small"
            variant="tonal"
          >
            {{ item.role === "admin" ? "Admin" : "Karyawan" }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <template #item.sales_count="{ item }">
          <v-chip size="small" variant="tonal">
            {{ getSalesCount(item.id) }} penjualan
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openDialog(item)"
            :disabled="item.id === authStore.user?.id"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item)"
            :disabled="item.id === authStore.user?.id || item.role === 'admin'"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          {{ editingEmployee ? "Edit Karyawan" : "Tambah Karyawan" }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" @submit.prevent="saveEmployee">
            <v-text-field
              v-model="formData.email"
              label="Email"
              type="email"
              variant="outlined"
              :rules="[validateInput.required, validateInput.email]"
              :disabled="!!editingEmployee"
              required
            />

            <v-text-field
              v-if="!editingEmployee"
              v-model="formData.password"
              label="Password"
              type="password"
              variant="outlined"
              :rules="[validateInput.required]"
              required
            />

            <v-select
              v-model="formData.role"
              :items="roleOptions"
              label="Role"
              variant="outlined"
              :rules="[validateInput.required]"
              required
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Batal</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveEmployee">
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Hapus Karyawan</v-card-title>
        <v-card-text>
          Yakin ingin menghapus karyawan "{{ employeeToDelete?.email }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Batal</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteEmployee">
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDataStore } from "@/stores/data";
import { supabase } from "@/utils/supabase";
import { formatDate, validateInput } from "@/utils/helpers";

const authStore = useAuthStore();
const dataStore = useDataStore();

const loading = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const search = ref("");

const editingEmployee = ref(null);
const employeeToDelete = ref(null);
const form = ref();
const employees = ref([]);

const formData = ref({
  email: "",
  password: "",
  role: "employee",
});

const headers = [
  { title: "Email", key: "email", sortable: true },
  { title: "Role", key: "role", sortable: true },
  { title: "Tanggal Bergabung", key: "created_at", sortable: true },
  { title: "Jumlah Penjualan", key: "sales_count", sortable: false },
  { title: "Aksi", key: "actions", sortable: false, width: 120 },
];

const roleOptions = [
  { title: "Karyawan", value: "employee" },
  { title: "Admin", value: "admin" },
];

const filteredEmployees = computed(() => {
  if (!search.value) return employees.value;

  const searchLower = search.value.toLowerCase();
  return employees.value.filter((employee) =>
    employee.email.toLowerCase().includes(searchLower)
  );
});

const getSalesCount = (employeeId) => {
  return dataStore.sales.filter(
    (sale) => sale.employee_id === employeeId && !sale.is_deleted
  ).length;
};

const fetchEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    employees.value = data || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
};

const openDialog = (employee = null) => {
  editingEmployee.value = employee;
  if (employee) {
    formData.value = {
      email: employee.email,
      password: "",
      role: employee.role,
    };
  } else {
    formData.value = {
      email: "",
      password: "",
      role: "employee",
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  editingEmployee.value = null;
  if (form.value) {
    form.value.reset();
  }
};

const saveEmployee = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;

  try {
    if (editingEmployee.value) {
      // Update existing employee
      const { error } = await supabase
        .from("users")
        .update({ role: formData.value.role })
        .eq("id", editingEmployee.value.id);

      if (error) throw error;
    } else {
      // Create new employee
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.value.email,
        password: formData.value.password,
      });

      if (signUpError) throw signUpError;

      // Update role in users table
      const { error: updateError } = await supabase
        .from("users")
        .update({ role: formData.value.role })
        .eq("id", data.user.id);

      if (updateError) throw updateError;
    }

    await fetchEmployees();
    closeDialog();
  } catch (error) {
    console.error("Error saving employee:", error);
    alert("Terjadi kesalahan saat menyimpan data");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (employee) => {
  employeeToDelete.value = employee;
  deleteDialog.value = true;
};

const deleteEmployee = async () => {
  deleting.value = true;

  try {
    // Delete from auth.users (will cascade to public.users)
    const { error } = await supabase.auth.admin.deleteUser(
      employeeToDelete.value.id
    );

    if (error) throw error;

    await fetchEmployees();
    deleteDialog.value = false;
    employeeToDelete.value = null;
  } catch (error) {
    console.error("Error deleting employee:", error);
    alert("Terjadi kesalahan saat menghapus data");
  } finally {
    deleting.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchEmployees(),
      dataStore.fetchSales({ hideDeleted: true }),
    ]);
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    loading.value = false;
  }
});
</script>
