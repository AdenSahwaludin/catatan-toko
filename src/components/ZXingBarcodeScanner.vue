<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Scan Barcode</span>
        <v-btn icon variant="text" @click="closeScanner">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div class="scanner-container">
          <!-- Video kamera -->
          <video
            ref="videoEl"
            playsinline
            autoplay
            muted
            class="scanner-video"
          />

          <!-- Hasil scan -->
          <v-text-field
            v-model="scannedCode"
            label="Hasil scan"
            readonly
            variant="outlined"
            class="mt-4"
            placeholder="Menunggu scan..."
          />

          <!-- Kontrol kamera -->
          <div v-if="showControls" class="controls mt-3">
            <!-- Zoom Control -->
            <div v-show="zoomCapable" class="control-group mb-3">
              <v-label class="mb-2">Zoom: {{ zoomValue.toFixed(2) }}x</v-label>
              <v-slider
                v-model="zoomValue"
                :min="zoomMin"
                :max="zoomMax"
                :step="zoomStep"
                @update:model-value="updateZoom"
                thumb-label
                hide-details
              />
            </div>

            <!-- Focus Control -->
            <div v-show="focusCapable" class="control-group mb-3">
              <v-label class="mb-2"
                >Manual Focus: {{ focusValue.toFixed(3) }}</v-label
              >
              <v-slider
                v-model="focusValue"
                :min="focusMin"
                :max="focusMax"
                :step="focusStep"
                @update:model-value="updateFocus"
                thumb-label
                hide-details
              />
              <v-chip
                v-if="pointsOfInterestSupported"
                size="small"
                class="mt-2"
              >
                Tip: ketuk video untuk fokus di area tertentu
              </v-chip>
            </div>
          </div>

          <v-alert v-if="status" :type="statusType" class="mt-3">
            {{ status }}
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeScanner" variant="text"> Tutup </v-btn>
        <v-btn
          v-if="scannedCode"
          @click="handleScanResult"
          color="primary"
          variant="elevated"
        >
          Gunakan Hasil
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";

const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: "display", // 'display' untuk menampilkan hasil, 'cart' untuk tambah ke keranjang
    validator: (value) => ["display", "cart"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "scan-result", "add-to-cart"]);

// Reactive variables
const dialog = ref(false);
const videoEl = ref(null);
const scannedCode = ref("");
const status = ref("Memuat kamera...");
const statusType = ref("info");
const showControls = ref(false);

// Camera controls
const zoomCapable = ref(false);
const zoomValue = ref(1);
const zoomMin = ref(1);
const zoomMax = ref(3);
const zoomStep = ref(0.1);

const focusCapable = ref(false);
const focusValue = ref(0);
const focusMin = ref(0);
const focusMax = ref(1);
const focusStep = ref(0.01);
const pointsOfInterestSupported = ref(false);

// ZXing variables
let codeReader = null;
let track = null;
let caps = {};
let settings = {};

// Watch dialog state
watch(
  () => props.modelValue,
  (newVal) => {
    dialog.value = newVal;
    if (newVal) {
      startScanner();
    } else {
      stopScanner();
    }
  }
);

watch(dialog, (newVal) => {
  emit("update:modelValue", newVal);
});

// Utility functions
const setStatus = (msg, type = "info") => {
  status.value = msg;
  statusType.value = type;
};

const clamp = (val, min, max) => {
  return Math.max(min, Math.min(max, val));
};

const getTrack = () => {
  const stream = videoEl.value?.srcObject;
  if (!stream) return null;
  const vids = stream.getVideoTracks();
  return vids && vids[0] ? vids[0] : null;
};

// Camera control functions
const updateZoom = async (value) => {
  if (!track) return;
  try {
    await track.applyConstraints({ advanced: [{ zoom: value }] });
  } catch (e) {
    console.warn("Gagal set zoom:", e);
  }
};

const updateFocus = async (value) => {
  if (!track) return;
  try {
    await track.applyConstraints({ advanced: [{ focusDistance: value }] });
  } catch (e) {
    console.warn("Gagal set focusDistance:", e);
  }
};

const setupCameraControls = async (retries = 20) => {
  // Wait for track to be available
  while (retries-- > 0) {
    track = getTrack();
    if (track) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  if (!track) {
    setStatus("Tidak menemukan track video untuk kontrol kamera.", "warning");
    return;
  }

  // Get capabilities and settings
  caps =
    typeof track.getCapabilities === "function" ? track.getCapabilities() : {};
  settings = typeof track.getSettings === "function" ? track.getSettings() : {};

  // Setup zoom
  if ("zoom" in caps) {
    zoomMin.value = caps.zoom.min ?? 1;
    zoomMax.value = caps.zoom.max ?? 3;
    zoomStep.value =
      caps.zoom.step || (zoomMax.value - zoomMin.value) / 20 || 0.1;
    zoomValue.value = clamp(
      settings.zoom ?? zoomMin.value,
      zoomMin.value,
      zoomMax.value
    );
    zoomCapable.value = true;
  }

  // Setup manual focus
  const hasManualFocus =
    caps.focusMode &&
    Array.isArray(caps.focusMode) &&
    caps.focusMode.includes("manual") &&
    "focusDistance" in caps;

  if (hasManualFocus) {
    focusMin.value = caps.focusDistance.min ?? 0;
    focusMax.value = caps.focusDistance.max ?? 1;
    focusStep.value =
      caps.focusDistance.step ||
      (focusMax.value - focusMin.value) / 100 ||
      0.01;
    focusValue.value = clamp(
      settings.focusDistance ?? focusMin.value,
      focusMin.value,
      focusMax.value
    );
    focusCapable.value = true;

    // Set manual focus mode
    try {
      await track.applyConstraints({ advanced: [{ focusMode: "manual" }] });
    } catch (e) {
      console.warn("Tidak bisa set focusMode manual:", e);
    }

    // Setup points of interest (tap to focus)
    if ("pointsOfInterest" in caps) {
      pointsOfInterestSupported.value = true;
      videoEl.value?.addEventListener("click", handleVideoClick);
    }
  } else {
    // Set continuous focus if available
    if (caps.focusMode && caps.focusMode.includes("continuous")) {
      try {
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" }],
        });
      } catch (e) {
        console.warn("Gagal set continuous focus:", e);
      }
    }
  }

  showControls.value = true;
};

const handleVideoClick = async (event) => {
  if (!track || !pointsOfInterestSupported.value) return;

  const rect = videoEl.value.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  try {
    await track.applyConstraints({
      advanced: [{ pointsOfInterest: [{ x, y }] }],
    });
  } catch (e) {
    console.warn("Gagal set pointsOfInterest:", e);
  }
};

// Scanner functions
const startScanner = async () => {
  if (!window.ZXing) {
    setStatus("ZXing library belum dimuat", "error");
    return;
  }

  try {
    codeReader = new window.ZXing.BrowserMultiFormatReader();

    // Get available cameras
    const devices = await codeReader.listVideoInputDevices();

    // Prefer back camera
    let selectedId = devices?.[0]?.deviceId || undefined;
    for (const d of devices) {
      if ((d.label || "").toLowerCase().includes("back")) {
        selectedId = d.deviceId;
        break;
      }
    }

    // Setup constraints
    const constraints = {
      video: selectedId
        ? { deviceId: { exact: selectedId } }
        : { facingMode: { ideal: "environment" } },
      audio: false,
    };

    // Start decoding
    await codeReader.decodeFromConstraints(
      constraints,
      videoEl.value,
      (result, err) => {
        if (result) {
          const text = result.getText();
          // Filter untuk EAN-13 (12-13 digit) atau tampilkan semua
          if (/^\d{12,13}$/.test(text)) {
            scannedCode.value = text;
            setStatus("Barcode berhasil discan!", "success");

            // Auto handle based on mode
            if (props.mode === "cart") {
              handleScanResult();
            }
          } else {
            scannedCode.value = text;
            setStatus("Barcode discan (format tidak standar)", "warning");
          }
        }

        if (err && !(err instanceof window.ZXing.NotFoundException)) {
          console.warn("Scan error:", err);
        }
      }
    );

    setStatus("Kamera aktif. Arahkan ke barcode.", "success");

    // Setup camera controls when ready
    await nextTick();
    if (videoEl.value) {
      videoEl.value.addEventListener(
        "loadedmetadata",
        () => setupCameraControls(),
        { once: true }
      );
      if (videoEl.value.readyState >= 1) {
        setupCameraControls();
      }
    }
  } catch (error) {
    console.error("Scanner error:", error);
    setStatus("Gagal mengaktifkan kamera: " + error.message, "error");
  }
};

const stopScanner = () => {
  if (codeReader) {
    codeReader.reset();
    codeReader = null;
  }

  if (videoEl.value) {
    videoEl.value.removeEventListener("click", handleVideoClick);
  }

  // Reset states
  track = null;
  caps = {};
  settings = {};
  scannedCode.value = "";
  showControls.value = false;
  zoomCapable.value = false;
  focusCapable.value = false;
  pointsOfInterestSupported.value = false;
  setStatus("Memuat kamera...", "info");
};

const closeScanner = () => {
  dialog.value = false;
};

const handleScanResult = () => {
  if (!scannedCode.value) return;

  if (props.mode === "cart") {
    emit("add-to-cart", scannedCode.value);
  } else {
    emit("scan-result", scannedCode.value);
  }

  closeScanner();
};

// Load ZXing library
onMounted(async () => {
  if (!window.ZXing) {
    try {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@zxing/library@latest";
      script.async = true;

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      console.log("ZXing library loaded successfully");
    } catch (error) {
      console.error("Failed to load ZXing library:", error);
      setStatus("Gagal memuat library barcode scanner", "error");
    }
  }
});

onUnmounted(() => {
  stopScanner();
});
</script>

<style scoped>
.scanner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scanner-video {
  width: 100%;
  max-width: 420px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.controls {
  width: 100%;
  max-width: 420px;
}

.control-group {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
}

@media (max-width: 600px) {
  .scanner-video {
    max-width: 100%;
  }
}
</style>
