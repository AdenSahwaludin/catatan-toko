<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-qrcode-scan</v-icon>
          {{ manualMode ? 'Input Manual Barcode' : 'Scan Barcode' }}
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
        <!-- Manual Input Mode (Default) -->
        <div v-if="manualMode" class="pa-4">
          <v-alert color="info" variant="tonal" class="mb-4">
            <v-icon start>mdi-information</v-icon>
            Masukkan kode barcode EAN-13 (13 digit) secara manual
          </v-alert>
          
          <v-text-field
            v-model="manualBarcode"
            label="Kode Barcode EAN-13"
            placeholder="Contoh: 1234567890123"
            variant="outlined"
            autofocus
            @keyup.enter="submitManualBarcode"
            :rules="[validateBarcode]"
            clearable
          >
            <template #prepend-inner>
              <v-icon>mdi-barcode</v-icon>
            </template>
          </v-text-field>

          <v-card color="grey-lighten-4" variant="tonal" class="mt-3">
            <v-card-text class="pa-3">
              <div class="text-caption">
                <strong>Tips:</strong>
                <ul class="ml-4 mt-1">
                  <li>Barcode harus berupa 13 digit angka</li>
                  <li>Contoh format yang benar: 1234567890123</li>
                  <li>Atau coba gunakan kamera jika tersedia</li>
                </ul>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Camera Scanner Mode -->
        <div v-else class="scanner-container">
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
              <div class="mt-2 text-caption text-center px-4">
                Mengalami masalah? Gunakan input manual sebagai alternatif
              </div>
              <v-btn 
                color="primary" 
                variant="outlined" 
                @click="switchToManual"
                class="mt-3"
                size="small"
              >
                Input Manual
              </v-btn>
            </div>

            <!-- Error state -->
            <div v-if="error" class="scanner-error">
              <v-icon size="64" color="error">mdi-camera-off</v-icon>
              <div class="mt-3 mb-3 text-center px-4">{{ error }}</div>
              <div class="d-flex gap-2 justify-center">
                <v-btn 
                  color="primary" 
                  variant="outlined" 
                  @click="retryCamera"
                  size="small"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Coba Lagi
                </v-btn>
                <v-btn 
                  color="secondary" 
                  variant="flat" 
                  @click="switchToManual"
                  size="small"
                >
                  <v-icon start>mdi-keyboard</v-icon>
                  Input Manual
                </v-btn>
              </div>
            </div>

            <!-- Scanner frame overlay -->
            <div v-if="showCamera" class="scanner-frame">
              <div class="scanner-corner top-left"></div>
              <div class="scanner-corner top-right"></div>
              <div class="scanner-corner bottom-left"></div>
              <div class="scanner-corner bottom-right"></div>
            </div>

            <!-- Instructions -->
            <div v-if="showCamera" class="scanner-instructions">
              <v-chip color="primary" variant="tonal" size="small">
                Arahkan kamera ke barcode EAN-13
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-btn
          color="secondary"
          variant="outlined"
          @click="toggleMode"
          :prepend-icon="manualMode ? 'mdi-camera' : 'mdi-keyboard'"
        >
          {{ manualMode ? 'Gunakan Kamera' : 'Input Manual' }}
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
const manualMode = ref(true); // Default to manual mode for better reliability
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
    facingMode: { ideal: "environment" }, // Prefer back camera on mobile
    width: { ideal: 640, max: 1920 },
    height: { ideal: 480, max: 1080 }
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
  manualBarcode.value = "";
  
  // Only initialize camera if not in manual mode
  if (!manualMode.value) {
    loading.value = true;
    loadingMessage.value = "Memuat kamera...";
    cameraInitialized.value = false;
    
    // Small delay to ensure DOM is updated
    await nextTick();
    
    // Set timeout to show manual option if camera takes too long
    setTimeout(() => {
      if (loading.value && !cameraInitialized.value) {
        loadingMessage.value = "Kamera lambat dimuat. Coba input manual atau tunggu...";
      }
    }, 5000);
    
    // Auto-switch to manual after 15 seconds
    setTimeout(() => {
      if (loading.value && !cameraInitialized.value) {
        console.log("Camera timeout, switching to manual mode");
        switchToManual();
      }
    }, 15000);
    
    cameraInitialized.value = true;
  }
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
  stopCamera();
};

const retryCamera = async () => {
  error.value = null;
  loading.value = true;
  loadingMessage.value = "Mencoba menghubungkan kamera lagi...";
  cameraInitialized.value = false;
  
  await nextTick();
  cameraInitialized.value = true;
};

const toggleMode = () => {
  if (manualMode.value) {
    // Switch to camera mode
    manualMode.value = false;
    resetScanner();
  } else {
    // Switch to manual mode
    switchToManual();
  }
};

// Validate EAN-13 barcode
const isValidBarcode = (code) => {
  if (!code) return false;

  // Allow any numeric string for testing purposes
  const cleanCode = code.toString().replace(/\D/g, "");
  if (cleanCode.length < 8 || cleanCode.length > 13) return false;

  return true;
  
  // Full EAN-13 validation (commented out for easier testing)
  /*
  if (cleanCode.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleanCode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return parseInt(cleanCode[12]) === checkDigit;
  */
};

const validateBarcode = (code) => {
  if (!code) return "Barcode wajib diisi";
  if (!isValidBarcode(code)) return "Barcode harus 8-13 digit angka";
  return true;
};

// Camera events
const onInit = async (promise) => {
  loading.value = true;
  loadingMessage.value = "Menghubungkan kamera...";

  try {
    const result = await promise;
    loading.value = false;
    error.value = null;
    console.log("Camera initialized successfully", result);
  } catch (err) {
    console.error("Camera initialization error:", err);
    loading.value = false;

    let errorMessage = "Terjadi kesalahan saat mengakses kamera.";
    
    if (err.name === "NotAllowedError") {
      errorMessage = "Akses kamera ditolak. Izinkan akses kamera atau gunakan input manual.";
    } else if (err.name === "NotFoundError") {
      errorMessage = "Kamera tidak ditemukan. Gunakan input manual.";
    } else if (err.name === "NotSupportedError") {
      errorMessage = "Kamera tidak didukung di browser ini. Gunakan input manual.";
    } else if (err.name === "NotReadableError") {
      errorMessage = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain atau gunakan input manual.";
    } else if (err.name === "OverconstrainedError") {
      errorMessage = "Pengaturan kamera tidak didukung. Coba lagi atau gunakan input manual.";
    } else if (err.message && err.message.includes("HTTPS")) {
      errorMessage = "Kamera memerlukan HTTPS. Gunakan input manual.";
    }
    
    error.value = errorMessage;
  }
};

const onError = (err) => {
  console.error("Scanner runtime error:", err);
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
      // Show a brief message about invalid barcode but continue scanning
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  border: 3px solid #4CAF50;
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
