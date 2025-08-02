# Aplikasi Catatan Toko - Manajemen Pencatatan Penjualan

Aplikasi web untuk manajemen pencatatan penjualan toko peralatan teknik dan elektronik yang dioptimalkan untuk perangkat mobile (iPhone 6.1" dan iPad 10-11").

## 🚀 Fitur Utama

### Role Admin

- ✅ CRUD data barang, kategori, dan karyawan
- ✅ Lihat semua data penjualan harian
- ✅ Edit dan hapus data penjualan dari siapa pun
- ✅ Lihat histori perubahan data penjualan
- ✅ Export laporan ke PDF dan Excel
- ✅ Pengaturan tema light/dark

### Role Employee

- ✅ Lihat daftar barang dengan filter dan pencarian
- ✅ Input penjualan dengan 2 cara:
  - Manual (hanya input nominal)
  - Berdasarkan barang (pilih barang + jumlah)
- ✅ Lihat riwayat penjualan pribadi
- ✅ Edit/hapus penjualan sendiri

## 🛠️ Teknologi

- **Frontend:** Vue.js 3 + Composition API
- **UI Framework:** Vuetify 3
- **Backend:** Supabase (PostgreSQL + Auth)
- **Export:** jsPDF, SheetJS (xlsx)
- **State Management:** Pinia
- **Routing:** Vue Router 4

## 📱 Responsive Design

Aplikasi dioptimalkan untuk:

- iPhone dengan layar 6,1 inci
- iPad dengan layar 10–11 inci
- Desktop dan perangkat lainnya

## 🗄️ Database Schema

### Tabel `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Tabel `categories`

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);
```

### Tabel `items`

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT,
  price NUMERIC NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Tabel `sales`

```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total NUMERIC NOT NULL CHECK (total > 0),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  edited_by_admin BOOLEAN DEFAULT false,
  edit_log JSONB DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

### SQL Functions

```sql
-- Function untuk mengurangi stok barang
CREATE OR REPLACE FUNCTION decrease_item_stock(item_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE items
  SET stock = stock - quantity
  WHERE id = item_id AND stock >= quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stok tidak mencukupi atau barang tidak ditemukan';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## 🚀 Setup dan Instalasi

1. **Clone dan Install Dependencies**

```bash
npm install
```

2. **Setup Supabase**
   - Buat project baru di [Supabase](https://supabase.com)
   - Copy URL dan Anon Key ke file `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. **Buat Database Schema**

   - Jalankan SQL commands di atas di Supabase SQL Editor
   - Atau import file `database.sql` (jika tersedia)

4. **Setup Authentication**

   - Enable Email authentication di Supabase Auth settings
   - Disable email confirmation untuk development

5. **Insert Sample Data**

```sql
-- Sample categories
INSERT INTO categories (name) VALUES
('Elektronik'), ('Peralatan'), ('Kabel'), ('Lampu');

-- Sample admin user (register via app first, then update role)
UPDATE users SET role = 'admin' WHERE email = 'admin@demo.com';
```

6. **Run Development Server**

```bash
npm run dev
```

## 📚 Akun Demo

### Admin

- Email: `admin@demo.com`
- Password: `admin123`

### Employee

- Email: `employee@demo.com`
- Password: `employee123`

## 🎯 Fitur Unggulan

### Input Penjualan Fleksibel

- **Manual**: Input langsung nominal penjualan
- **By Items**: Pilih barang → stok otomatis berkurang

### Tracking & Audit

- Semua perubahan data tercatat
- Admin dapat melihat histori edit
- Data yang diubah ditandai warna merah

### Export Laporan

- PDF dengan formatting yang rapi
- Excel dengan data terstruktur
- Filter berdasarkan tanggal dan karyawan

### Mobile-First Design

- Touch-friendly interface
- Responsive untuk semua ukuran layar
- Optimized untuk iPhone dan iPad

## 🔧 Kustomisasi

### Mengubah Minimal Penjualan

Edit file `src/utils/helpers.js`:

```javascript
minAmount: (value, min = 5000) => // Ubah dari 1000 ke 5000
```

### Mengubah Threshold Stok Menipis

Edit file `src/views/admin/Dashboard.vue`:

```javascript
filter((item) => item.stock < 10); // Ubah dari 5 ke 10
```

## 📄 Scripts

```bash
# Development
npm run dev

# Build untuk production
npm run build

# Preview build
npm run preview
```

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

## 📞 Support

Jika mengalami kendala atau butuh bantuan:

- Buat issue di GitHub
- Email: support@aplikasimu.com

---

**Catatan**: Aplikasi ini dibuat khusus untuk toko peralatan teknik dan elektronik dengan UI/UX yang ramah untuk pengguna non-teknis.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
