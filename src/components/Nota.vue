<template>
  <v-dialog v-model="dialog" max-width="400px">
    <v-card>
      <v-card-title class="text-center py-3">
        <v-icon class="mr-2">mdi-receipt</v-icon>
        Struk Penjualan
      </v-card-title>
      <v-divider />

      <!-- Receipt Content -->
      <div
        id="receipt-content"
        class="pa-4"
        style="
          background: white;
          color: black;
          font-family: 'Courier New', monospace;
        "
      >
        <!-- Header -->
        <div class="text-center mb-3">
          <!-- Logo -->
          <div style="margin-bottom: 10px">
            <img
              src="/logo.jpg"
              alt="Mega Teknik Logo"
              style="max-width: 80px; max-height: 80px; object-fit: contain"
              onerror="this.style.display='none'"
            />
          </div>
          <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px">
            MEGA TEKNIK
          </div>
          <div style="font-size: 12px; line-height: 1.3">
            Peralatan Teknik & Elektronik<br />
            Jl. Contoh No. 123, Kota<br />
            Telp: (021) 12345678
          </div>
          <div style="border-top: 1px dashed black; margin: 10px 0"></div>
        </div>

        <!-- Sale Info -->
        <div style="font-size: 12px; margin-bottom: 15px">
          <div style="display: flex; justify-content: space-between">
            <span>Tanggal:</span>
            <span>{{ formatDate(saleData.created_at) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between">
            <span>Kasir:</span>
            <span>{{ saleData.kasir || "Admin" }}</span>
          </div>
          <div style="border-top: 1px dashed black; margin: 10px 0"></div>
        </div>

        <!-- Items -->
        <div style="font-size: 12px; margin-bottom: 15px">
          <template v-if="saleData.details?.type === 'manual'">
            <div style="margin-bottom: 8px">
              <div style="display: flex; justify-content: space-between">
                <span style="font-weight: bold">Penjualan Manual</span>
              </div>
              <div
                v-if="saleData.details?.notes"
                style="font-size: 10px; color: #666; margin: 5px 0"
              >
                Catatan: {{ saleData.details.notes }}
              </div>
              <div style="display: flex; justify-content: space-between">
                <span>1 x {{ formatCurrency(saleData.total) }}</span>
                <span>{{ formatCurrency(saleData.total) }}</span>
              </div>
            </div>
          </template>

          <template v-else-if="saleData.details?.items">
            <!-- Items Count Summary -->
            <div
              style="
                font-size: 11px;
                color: #666;
                margin-bottom: 8px;
                text-align: center;
              "
            >
              {{ saleData.details.items.length }} item{{
                saleData.details.items.length > 1 ? "s" : ""
              }}
              dibeli
            </div>

            <div
              v-for="(item, index) in saleData.details.items"
              :key="index"
              style="
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px dotted #ccc;
              "
            >
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 2px;
                "
              >
                <span style="font-weight: bold; font-size: 13px">{{
                  item.name
                }}</span>
              </div>
              <div style="font-size: 10px; color: #666; margin-bottom: 3px">
                <template v-if="item.isCustom || (item.id && item.id.toString().startsWith('custom_'))">
                  <span>{{ item.type || "Custom Item" }}</span>
                </template>
                <template v-else>
                  <div>
                    {{ item.brand && item.brand !== "No Brand" ? item.brand : "Tanpa Merek" }}<span v-if="item.model && item.model.trim()"> - {{ item.model }}</span>
                  </div>
                </template>
              </div>
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  font-size: 12px;
                "
              >
                <span>{{ item.quantity }} x {{ formatCurrency(item.price) }}</span>
                <span style="font-weight: bold">{{
                  formatCurrency(item.quantity * item.price)
                }}</span>
              </div>
            </div>
          </template>

          <div style="border-top: 1px dashed black; margin: 10px 0"></div>
        </div>

        <!-- Total -->
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 15px">
          <div style="display: flex; justify-content: space-between">
            <span>TOTAL:</span>
            <span>{{ formatCurrency(saleData.total) }}</span>
          </div>

          <!-- Payment Info -->
          <template v-if="saleData.paid !== null && saleData.paid !== undefined">
            <div
              style="
                display: flex;
                justify-content: space-between;
                font-weight: 600;
                margin-top: 6px;
              "
            >
              <span>DIBAYAR:</span>
              <span>{{ formatCurrency(saleData.paid) }}</span>
            </div>
            <div
              style="
                display: flex;
                justify-content: space-between;
                font-weight: 800;
                margin-top: 6px;
              "
            >
              <span>KEMBALIAN:</span>
              <span>{{ formatCurrency(saleData.change || 0) }}</span>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div style="font-size: 11px; text-align: center; margin-top: 20px">
          <div style="border-top: 1px dashed black; margin-bottom: 10px"></div>
          <div>Terima kasih atas kunjungan Anda!</div>
          <div>Barang yang sudah dibeli tidak dapat ditukar</div>
        </div>
      </div>

      <v-card-actions class="px-6 pb-6">
        <v-btn
          color="secondary"
          variant="outlined"
          @click="closeDialog"
          class="flex-1"
        >
          Tutup
        </v-btn>
        <v-btn color="primary" @click="downloadReceipt" class="flex-1 ml-3">
          <v-icon class="mr-2">mdi-download</v-icon>
          Unduh Struk
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@/utils/helpers'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  saleData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const closeDialog = () => {
  dialog.value = false
}

const downloadReceipt = () => {
  const receiptContent = document.getElementById("receipt-content")

  // Create a new window for printing
  const printWindow = window.open("", "_blank", "width=400,height=600")

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Penjualan</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Courier New', monospace;
          background: white;
          color: black;
        }
        @media print {
          body { margin: 0; padding: 10px; }
        }
        .logo {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      ${receiptContent.innerHTML}
    </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  // Auto print after a short delay
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)

  closeDialog()
}
</script>