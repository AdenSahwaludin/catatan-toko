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
                  Mega Teknik
                  <br />
                  Elektronik
                </div>
                <div class="text-subtitle-1 text-medium-emphasis">
                  Sistem Pencatatan Penjualan Modern
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
  background: 
    radial-gradient(ellipse at top left, rgba(15, 15, 15, 0.9) 0%, transparent 50%),
    radial-gradient(ellipse at top right, rgba(20, 20, 20, 0.8) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(10, 10, 10, 0.9) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(25, 25, 25, 0.8) 0%, transparent 50%),
    linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #0d0d0d 50%, #151515 75%, #000000 100%);
  position: relative;
  overflow: hidden;
}

/* Enhanced floating background shapes */
.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.08) 0%, 
    rgba(255, 255, 255, 0.04) 50%, 
    rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(50px) saturate(200%);
  -webkit-backdrop-filter: blur(50px) saturate(200%);
  animation: float 12s ease-in-out infinite;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.shape-1 {
  width: 150px;
  height: 150px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
  background: linear-gradient(135deg, 
    rgba(45, 212, 191, 0.1) 0%, 
    rgba(6, 182, 212, 0.05) 50%, 
    rgba(59, 130, 246, 0.02) 100%);
}

.shape-2 {
  width: 220px;
  height: 220px;
  top: 60%;
  right: 10%;
  animation-delay: 4s;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%, 
    rgba(147, 51, 234, 0.05) 50%, 
    rgba(219, 39, 119, 0.02) 100%);
}

.shape-3 {
  width: 110px;
  height: 110px;
  top: 30%;
  right: 20%;
  animation-delay: 8s;
  background: linear-gradient(135deg, 
    rgba(147, 51, 234, 0.08) 0%, 
    rgba(219, 39, 119, 0.04) 50%, 
    rgba(239, 68, 68, 0.02) 100%);
}

.shape-4 {
  width: 180px;
  height: 180px;
  bottom: 20%;
  left: 15%;
  animation-delay: 2s;
  background: linear-gradient(135deg, 
    rgba(6, 182, 212, 0.09) 0%, 
    rgba(45, 212, 191, 0.05) 50%, 
    rgba(34, 197, 94, 0.02) 100%);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg) scale(1);
    opacity: 0.3;
  }
  25% {
    transform: translateY(-25px) rotate(90deg) scale(1.15);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-10px) rotate(180deg) scale(0.9);
    opacity: 0.6;
  }
  75% {
    transform: translateY(15px) rotate(270deg) scale(1.05);
    opacity: 0.7;
  }
}

/* Login card dengan enhanced glassmorphism */
.login-card {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.12) 0%, 
    rgba(255, 255, 255, 0.08) 50%, 
    rgba(255, 255, 255, 0.05) 100%) !important;
  backdrop-filter: blur(60px) saturate(200%) brightness(110%);
  -webkit-backdrop-filter: blur(60px) saturate(200%) brightness(110%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 35px 80px rgba(0, 0, 0, 0.6),
    0 15px 35px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
  position: relative;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent);
  transition: left 0.8s ease;
}

.login-card:hover::before {
  left: 100%;
}

.login-card:hover {
  transform: translateY(-5px) scale(1.02);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0.12) 50%, 
    rgba(255, 255, 255, 0.08) 100%) !important;
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 50px 100px rgba(0, 0, 0, 0.7),
    0 25px 50px rgba(0, 0, 0, 0.5),
    inset 0 3px 6px rgba(255, 255, 255, 0.25),
    inset 0 -3px 6px rgba(0, 0, 0, 0.15);
}

/* Logo avatar dengan modern gradient */
.logo-avatar {
  background: linear-gradient(135deg, #2dd4bf 0%, #06b6d4 50%, #3b82f6 100%) !important;
  box-shadow: 
    0 15px 35px rgba(45, 212, 191, 0.3),
    0 5px 15px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

/* Modern input styling dengan enhanced liquid glass effect */
.modern-input :deep(.v-field) {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.12) 0%, 
    rgba(255, 255, 255, 0.08) 50%, 
    rgba(255, 255, 255, 0.06) 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(40px) saturate(180%) brightness(105%);
  -webkit-backdrop-filter: blur(40px) saturate(180%) brightness(105%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.modern-input :deep(.v-field)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent);
  transition: left 0.6s ease;
  z-index: 1;
}

.modern-input :deep(.v-field:hover)::before {
  left: 100%;
}

.modern-input :deep(.v-field:hover) {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.16) 0%, 
    rgba(255, 255, 255, 0.12) 50%, 
    rgba(255, 255, 255, 0.08) 100%) !important;
  border-color: rgba(45, 212, 191, 0.4);
  transform: translateY(-2px) scale(1.01);
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.25),
    0 5px 15px rgba(45, 212, 191, 0.1),
    inset 0 3px 6px rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.modern-input :deep(.v-field--focused) {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.18) 0%, 
    rgba(255, 255, 255, 0.14) 50%, 
    rgba(255, 255, 255, 0.10) 100%) !important;
  border-color: rgba(45, 212, 191, 0.6);
  transform: scale(1.02);
  box-shadow: 
    0 0 0 3px rgba(45, 212, 191, 0.15),
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 8px 20px rgba(45, 212, 191, 0.2),
    inset 0 3px 6px rgba(255, 255, 255, 0.25),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.modern-input :deep(.v-field__input) {
  color: rgba(255, 255, 255, 0.9) !important;
}

.modern-input :deep(.v-field__prepend-inner .v-icon) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.modern-input :deep(.v-field__append-inner .v-icon) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.modern-input :deep(.v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* Modern buttons dengan liquid glass effect */
.primary-button {
  background: linear-gradient(135deg, #2dd4bf 0%, #06b6d4 50%, #3b82f6 100%) !important;
  color: white !important;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 8px 25px rgba(45, 212, 191, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.primary-button:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 15px 40px rgba(45, 212, 191, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #34d399 0%, #0ea5e9 50%, #6366f1 100%) !important;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  font-weight: 500;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9) !important;
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Modern alert dengan glass effect */
.modern-alert {
  background: rgba(239, 68, 68, 0.1) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Text colors untuk dark theme */
.text-primary {
  color: rgba(255, 255, 255, 0.95) !important;
}

.text-medium-emphasis {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* Checkbox styling */
:deep(.v-checkbox .v-label) {
  color: rgba(255, 255, 255, 0.8) !important;
}

:deep(.v-selection-control__input .v-icon) {
  color: rgba(45, 212, 191, 0.8) !important;
}

/* Responsive design */
@media (max-width: 480px) {
  .login-card {
    margin: 16px;
    max-width: calc(100% - 32px);
    background: rgba(255, 255, 255, 0.06) !important;
  }

  .shape {
    display: none;
  }

  .fill-height {
    background: radial-gradient(ellipse at center, #1a1a1a 0%, #000000 100%);
  }
}

/* Improved glass morphism untuk mobile */
@media (max-width: 768px) {
  .login-card {
    backdrop-filter: blur(30px) saturate(150%);
  }
  
  .modern-input :deep(.v-field) {
    backdrop-filter: blur(15px) saturate(150%);
  }
}
</style>
