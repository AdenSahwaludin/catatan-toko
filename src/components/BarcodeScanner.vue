<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-qrcode-scan</v-icon>
          Scan Barcode/QR Code
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="closeScanner"
        />
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-0">
        <!-- Camera Scanner -->
        <div v-if="!manualMode" class="scanner-container">
          <div class="scanner-overlay">
            <qrcode-stream
              v-if="showCamera"
              @detect="onDetect"
              @error="onError"
              @init="onInit"
              class="scanner-video"
              :constraints="cameraConstraints"
            />

            <!-- Loading state -->
            <div v-if="loading" class="scanner-loading">
              <v-progress-circular indeterminate color="primary" size="64" />
              <div class="mt-3">{{ loadingMessage }}</div>
              <v-btn 
                color="primary" 
                variant="outlined" 
                @click="switchToManual"
                class="mt-3"
              >
                Input Manual
              </v-btn>
            </div>

            <!-- Error state -->
            <div v-if="error" class="scanner-error">
              <v-icon size="64" color="error">mdi-camera-off</v-icon>
              <div class="mt-3 mb-3">{{ error }}</div>
              <v-btn 
                color="primary" 
                variant="outlined" 
                @click="retryCamera"
                class="mr-2"
              >
                Coba Lagi
              </v-btn>
              <v-btn 
                color="secondary" 
                variant="outlined" 
                @click="switchToManual"
              >
                Input Manual
              </v-btn>
            </div>

            <!-- Scanner frame overlay -->
            <div v-if="showCamera && !loading && !error" class="scanner-frame">
              <div class="scanner-corner top-left"></div>
              <div class="scanner-corner top-right"></div>
              <div class="scanner-corner bottom-left"></div>
              <div class="scanner-corner bottom-right"></div>
            </div>

            <!-- Instructions -->
            <div v-if="showCamera && !loading && !error" class="scanner-instructions">
            <div v-if="!loading && !error" class="scanner-instructions">
              <v-chip color="primary" variant="tonal" size="small">
                Arahkan kamera ke barcode
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Manual Input Mode -->
        <div v-else class="pa-4">
          <v-text-field
            v-model="manualBarcode"
            label="Kode Barcode"
            placeholder="Masukkan kode barcode secara manual"
            variant="outlined"
            autofocus
            @keyup.enter="submitManualBarcode"
            :rules="[validateBarcode]"
          >
            <template #prepend-inner>
              <v-icon>mdi-barcode</v-icon>
            </template>
          </v-text-field>
        </div>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-btn
          :color="manualMode ? 'secondary' : 'primary'"
          variant="outlined"
          @click="toggleMode"
          prepend-icon="mdi-keyboard"
        >
          {{ manualMode ? "Kembali ke Scanner" : "Input Manual" }}
        </v-btn>

        <v-spacer />

        <v-btn
          v-if="manualMode"
          color="primary"
          @click="submitManualBarcode"
          :disabled="!isValidBarcode(manualBarcode)"
        >
          Submit
        </v-btn>

        <v-btn color="secondary" variant="outlined" @click="closeScanner">
          Tutup
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { QrcodeStream } from "vue-qrcode-reader";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "detected"]);

// Dialog state
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Scanner state
const loading = ref(false);
const error = ref(null);
const manualMode = ref(false);
const manualBarcode = ref("");
const loadingMessage = ref("Memuat kamera...");
const cameraInitialized = ref(false);

// Computed for camera display
const showCamera = computed(() => {
  return !manualMode.value && cameraInitialized.value && !loading.value && !error.value;
});

// Camera constraints for better mobile support
const cameraConstraints = computed(() => ({
  video: {
    facingMode: "environment", // Prefer back camera on mobile
    width: { ideal: 640 },
    height: { ideal: 480 }
  }
}));

// Watch dialog to reset state
watch(dialog, async (newValue) => {
  if (newValue) {
    await resetScanner();
  } else {
    stopCamera();
  }
});

const resetScanner = async () => {
  error.value = null;
  loading.value = true;
  loadingMessage.value = "Memuat kamera...";
  manualMode.value = false;
  manualBarcode.value = "";
  cameraInitialized.value = false;
  
  // Small delay to ensure DOM is updated
  await nextTick();
  
  // Set timeout to switch to manual mode if camera takes too long
  setTimeout(() => {
    if (loading.value && !cameraInitialized.value) {
      loadingMessage.value = "Kamera lambat dimuat. Coba input manual atau tunggu...";
    }
  }, 5000);
  
  setTimeout(() => {
    if (loading.value && !cameraInitialized.value) {
      switchToManual();
    }
  }, 10000);
  
  cameraInitialized.value = true;
};

const stopCamera = () => {
  cameraInitialized.value = false;
  loading.value = false;
  error.value = null;
};

const switchToManual = () => {
  manualMode.value = true;
  loading.value = false;
  error.value = null;
};

const retryCamera = async () => {
  error.value = null;
  loading.value = true;
  cameraInitialized.value = false;
  
  await nextTick();
  cameraInitialized.value = true;
};

const toggleMode = () => {
  if (manualMode.value) {
    // Switch back to camera
    resetScanner();
  } else {
    switchToManual();
  }
};
  if (manualMode.value) {
    stopCamera();
  } else {
    resetScanner();
  }
};

// Validate EAN-13 barcode
const isValidBarcode = (code) => {
  if (!code) return false;

  // Basic validation - should be 13 digits
  const cleanCode = code.toString().replace(/\D/g, "");
  if (cleanCode.length !== 13) return false;

  // EAN-13 checksum validation
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleanCode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return parseInt(cleanCode[12]) === checkDigit;
};

const validateBarcode = (code) => {
  if (!code) return "Barcode wajib diisi";
  if (!isValidBarcode(code)) return "Format barcode EAN-13 tidak valid";
  return true;
};

// Camera events
const onInit = async (promise) => {
  loading.value = true;
  loadingMessage.value = "Menghubungkan kamera...";

  try {
    await promise;
    loading.value = false;
    error.value = null;
    console.log("Camera initialized successfully");
  } catch (err) {
    console.error("Camera initialization error:", err);
    loading.value = false;

    if (err.name === "NotAllowedError") {
      error.value = "Akses kamera ditolak. Izinkan akses kamera atau gunakan input manual.";
    } else if (err.name === "NotFoundError") {
      error.value = "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera atau gunakan input manual.";
    } else if (err.name === "NotSupportedError") {
      error.value = "Kamera tidak didukung di browser ini. Gunakan input manual.";
    } else if (err.name === "NotReadableError") {
      error.value = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain atau gunakan input manual.";
    } else if (err.name === "OverconstrainedError") {
      error.value = "Pengaturan kamera tidak didukung. Coba lagi atau gunakan input manual.";
    } else {
      error.value = "Terjadi kesalahan saat mengakses kamera. Gunakan input manual.";
    }
  }
};

const onError = (err) => {
const onError = (err) => {
  console.error("Scanner error:", err);
  loading.value = false;
  error.value = "Terjadi kesalahan pada scanner. Gunakan input manual.";
};

const onDetect = (detectedCodes) => {
  if (detectedCodes && detectedCodes.length > 0) {
    const code = detectedCodes[0].rawValue;
    console.log("Detected barcode:", code);

    // Validate the detected code
    if (isValidBarcode(code)) {
      emit("detected", code);
      closeScanner();
    } else {
      console.log("Invalid barcode detected:", code);
      // Optionally show a message to user about invalid barcode
    }
  }
};

const submitManualBarcode = () => {
  if (isValidBarcode(manualBarcode.value)) {
    emit("detected", manualBarcode.value);
    closeScanner();
  }
};

const closeScanner = () => {
  dialog.value = false;
};
</script>

<style scoped>
.scanner-container {
  position: relative;
  width: 100%;
  height: 400px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-overlay {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-loading,
.scanner-error {
  color: white;
  text-align: center;
  padding: 20px;
}

.scanner-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  pointer-events: none;
}

.scanner-corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid #4caf50;
}

.scanner-corner.top-left {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.scanner-corner.top-right {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.scanner-corner.bottom-left {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.scanner-corner.bottom-right {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

.scanner-instructions {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
</style>
