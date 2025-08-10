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
              v-if="cameraEnabled && !loading"
              @detect="onDetect"
              @error="onError"
              @init="onInit"
              class="scanner-video"
            />

            <!-- Loading state -->
            <div v-if="loading" class="scanner-loading">
              <v-progress-circular indeterminate color="primary" size="64" />
              <div class="mt-3">Memuat kamera...</div>
            </div>

            <!-- Error state -->
            <div v-if="error" class="scanner-error">
              <v-icon size="64" color="error">mdi-camera-off</v-icon>
              <div class="mt-3">{{ error }}</div>
            </div>

            <!-- Scanner frame overlay -->
            <div v-if="!loading && !error" class="scanner-frame">
              <div class="scanner-corner top-left"></div>
              <div class="scanner-corner top-right"></div>
              <div class="scanner-corner bottom-left"></div>
              <div class="scanner-corner bottom-right"></div>
            </div>

            <!-- Instructions -->
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
import { ref, computed, watch } from "vue";
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
const cameraEnabled = ref(false);
const loading = ref(false);
const error = ref(null);
const manualMode = ref(false);
const manualBarcode = ref("");

// Watch dialog to reset state
watch(dialog, (newValue) => {
  if (newValue) {
    resetScanner();
  } else {
    stopCamera();
  }
});

const resetScanner = () => {
  error.value = null;
  loading.value = true;
  manualMode.value = false;
  manualBarcode.value = "";
  cameraEnabled.value = true;
};

const stopCamera = () => {
  cameraEnabled.value = false;
  loading.value = false;
};

const toggleMode = () => {
  manualMode.value = !manualMode.value;
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

  try {
    await promise;
    loading.value = false;
  } catch (err) {
    console.error("Camera initialization error:", err);

    if (err.name === "NotAllowedError") {
      error.value =
        "Akses kamera ditolak. Izinkan akses kamera untuk melanjutkan.";
    } else if (err.name === "NotFoundError") {
      error.value =
        "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.";
    } else if (err.name === "NotSupportedError") {
      error.value = "Kamera tidak didukung di browser ini.";
    } else if (err.name === "NotReadableError") {
      error.value = "Kamera sedang digunakan aplikasi lain.";
    } else {
      error.value = "Terjadi kesalahan saat mengakses kamera.";
    }

    loading.value = false;
  }
};

const onError = (err) => {
  console.error("Scanner error:", err);
  error.value = "Terjadi kesalahan pada scanner";
};

const onDetect = (detectedCodes) => {
  if (detectedCodes && detectedCodes.length > 0) {
    const code = detectedCodes[0].rawValue;
    console.log("Detected barcode:", code);

    // Validate the detected code
    if (isValidBarcode(code)) {
      emit("detected", code);
      closeScanner();
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
