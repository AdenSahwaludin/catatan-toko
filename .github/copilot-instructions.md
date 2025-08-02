<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instruksi untuk Aplikasi Pencatatan Penjualan Toko

Aplikasi ini adalah sistem manajemen pencatatan penjualan untuk toko peralatan teknik dan elektronik dengan fitur:

## Teknologi Stack

- Vue.js 3 dengan Composition API
- Vuetify 3 untuk UI framework responsif
- Supabase untuk backend dan autentikasi
- Vue Router untuk routing
- Pinia untuk state management
- jsPDF untuk export PDF
- xlsx untuk export Excel

## Role dan Akses

- **Admin**: Full access - CRUD barang, kategori, employee, lihat semua data penjualan, edit/hapus data penjualan siapa pun, lihat histori perubahan
- **Employee**: Terbatas - lihat barang, input penjualan (manual/berdasarkan barang), edit/hapus penjualan sendiri

## Database Schema (Supabase)

- `users`: id, email, role (admin/employee), created_at
- `categories`: id, name
- `items`: id, name, category_id, brand, model, price, stock, created_at
- `sales`: id, employee_id, total, details (JSONB), created_at, edited_by_admin, edit_log (JSONB), is_deleted, deleted_at

## Fitur Utama

- Responsive design untuk iPhone 6.1" dan iPad 10-11"
- Light/Dark theme toggle
- Role-based authentication dan redirect
- Input penjualan manual atau berdasarkan barang
- Tracking histori perubahan data
- Export laporan PDF/Excel
- Stok otomatis berkurang saat penjualan

## UI/UX Guidelines

- Sederhana dan ramah untuk pengguna non-teknis
- Optimized untuk mobile dan tablet
- Validasi input yang ketat
- Notifikasi sukses/gagal
- Konfirmasi sebelum hapus data
