<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height pa-0">
        <v-row class="fill-height ma-0">
          <!-- Background dengan glassmorphism effect -->
          <v-col
            cols="12"
            class="d-flex align-center justify-center position-relative"
          >
            <!-- Floating shapes untuk background -->
            <div class="floating-shapes">
              <div class="shape shape-1"></div>
              <div class="shape shape-2"></div>
              <div class="shape shape-3"></div>
              <div class="shape shape-4"></div>
            </div>

            <v-card
              class="mx-auto login-card"
              max-width="420"
              width="100%"
              elevation="0"
              rounded="xl"
            >
              <!-- Header dengan icon modern -->
              <v-card-title class="text-center py-8">
                <div class="logo-container mb-4">
                  <v-avatar size="80" class="logo-avatar">
                    <v-icon size="40" color="white"
                      >mdi-storefront-outline</v-icon
                    >
                  </v-avatar>
                </div>
                <div class="text-h4 font-weight-bold text-primary mb-2">
                  Mega Teknik Elektronik
                </div>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Daftar Harga dan Pencatatan Penjualan
                </div>
              </v-card-title>

              <v-card-text class="px-8 pb-8">
                <v-form @submit.prevent="handleLogin" ref="loginForm">
                  <!-- Modern input fields -->
                  <div class="input-group mb-4">
                    <v-text-field
                      v-model="email"
                      label="Email Address"
                      type="email"
                      prepend-inner-icon="mdi-email-outline"
                      variant="solo"
                      density="comfortable"
                      rounded="lg"
                      :rules="[validateInput.required, validateInput.email]"
                      class="modern-input"
                      :disabled="loading || registering"
                      hide-details="auto"
                    />
                  </div>

                  <div class="input-group mb-6">
                    <v-text-field
                      v-model="password"
                      label="Password"
                      :type="showPassword ? 'text' : 'password'"
                      prepend-inner-icon="mdi-lock-outline"
                      :append-inner-icon="
                        showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'
                      "
                      @click:append-inner="showPassword = !showPassword"
                      variant="solo"
                      density="comfortable"
                      rounded="lg"
                      :rules="[validateInput.required]"
                      class="modern-input"
                      :disabled="loading || registering"
                      hide-details="auto"
                    />
                  </div>

                  <!-- Remember Me Checkbox -->
                  <div class="input-group mb-4">
                    <v-checkbox
                      v-model="rememberMe"
                      label="Tetap login selama 1 minggu"
                      color="primary"
                      hide-details
                      :disabled="loading || registering"
                    />
                  </div>

                  <!-- Error alert dengan style modern -->
                  <v-slide-y-transition>
                    <v-alert
                      v-if="error"
                      type="error"
                      variant="tonal"
                      rounded="lg"
                      class="mb-6 modern-alert"
                      closable
                      @click:close="error = ''"
                    >
                      {{ error }}
                    </v-alert>
                  </v-slide-y-transition>

                  <!-- Modern buttons dengan gradients -->
                  <div class="button-group">
                    <v-btn
                      type="submit"
                      size="large"
                      block
                      :loading="loading"
                      class="mb-4 primary-button"
                      rounded="lg"
                      elevation="0"
                    >
                      <v-icon start>mdi-login</v-icon>
                      Sign In
                    </v-btn>
                  </div>
                </v-form>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { validateInput } from "@/utils/helpers";
import { supabase } from "@/utils/supabase";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const rememberMe = ref(true); // Default to true for convenience
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const loginForm = ref();

const handleLogin = async () => {
  const { valid } = await loginForm.value.validate();
  if (!valid) return;

  loading.value = true;
  error.value = "";

  const result = await authStore.signIn(
    email.value,
    password.value,
    rememberMe.value
  );

  if (result.success) {
    // Redirect based on role
    if (authStore.isAdmin) {
      router.push("/admin");
    } else {
      router.push("/employee");
    }
  } else {
    error.value = result.error || "Terjadi kesalahan saat login";
  }

  loading.value = false;
};
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow: hidden;
}

/* Floating background shapes */
.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 70%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  top: 30%;
  right: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  bottom: 20%;
  left: 15%;
  animation-delay: 1s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

/* Login card dengan glassmorphism */
.login-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
  z-index: 1;
  position: relative;
}

/* Logo avatar dengan gradient */
.logo-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

/* Modern input styling */
.modern-input :deep(.v-field) {
  background: rgba(247, 250, 252, 0.8) !important;
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.modern-input :deep(.v-field:hover) {
  background: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.modern-input :deep(.v-field--focused) {
  background: rgba(255, 255, 255, 1) !important;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Modern buttons */
.primary-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  text-transform: none;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.secondary-button {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  font-weight: 500;
  transition: all 0.3s ease;
  text-transform: none;
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* Modern alert */
.modern-alert {
  background: rgba(255, 245, 245, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Responsive design */
@media (max-width: 480px) {
  .login-card {
    margin: 16px;
    max-width: calc(100% - 32px);
  }

  .shape {
    display: none;
  }
}

/* Dark theme adjustments */
.v-theme--dark .login-card {
  background: rgba(30, 41, 59, 0.95) !important;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

.v-theme--dark .modern-input :deep(.v-field) {
  background: rgba(51, 65, 85, 0.8) !important;
  border: 1px solid rgba(71, 85, 105, 0.5);
}

.v-theme--dark .modern-input :deep(.v-field:hover) {
  background: rgba(71, 85, 105, 0.9) !important;
}
</style>
