-- Setup Database Schema untuk Aplikasi Catatan Toko
-- Jalankan script ini di Supabase SQL Editor

-- 1. Tabel users (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabel categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabel items
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT,
  price NUMERIC NOT NULL CHECK (price > 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabel sales
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total NUMERIC NOT NULL CHECK (total > 0),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  edited_by_admin BOOLEAN DEFAULT false,
  edit_log JSONB DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. Function untuk mengurangi stok
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

-- 6. Trigger untuk auto-insert user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'employee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Categories policies
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can modify categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Items policies
CREATE POLICY "Anyone can view items" ON items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can modify items" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sales policies
CREATE POLICY "Users can view own sales" ON sales
  FOR SELECT USING (
    employee_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own sales" ON sales
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own sales, admins can update all" ON sales
  FOR UPDATE USING (
    employee_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete sales" ON sales
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Insert sample data
INSERT INTO categories (name) VALUES 
('Elektronik'),
('Peralatan'),
('Kabel'),
('Lampu'),
('Baut & Mur'),
('Obeng')
ON CONFLICT (name) DO NOTHING;

-- Sample items (akan diinsert setelah ada kategori)
DO $$
DECLARE
    elektronik_id UUID;
    peralatan_id UUID;
    kabel_id UUID;
    lampu_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO elektronik_id FROM categories WHERE name = 'Elektronik';
    SELECT id INTO peralatan_id FROM categories WHERE name = 'Peralatan';
    SELECT id INTO kabel_id FROM categories WHERE name = 'Kabel';
    SELECT id INTO lampu_id FROM categories WHERE name = 'Lampu';
    
    -- Insert sample items
    INSERT INTO items (name, category_id, brand, model, price, stock) VALUES
    ('Kipas Angin 16 inch', elektronik_id, 'Miyako', 'KAS-1629', 350000, 15),
    ('Lampu LED 12W', lampu_id, 'Philips', 'Essential', 25000, 50),
    ('Kabel NYM 2x2.5', kabel_id, 'Supreme', '2x2.5mm', 15000, 100),
    ('Obeng Plus', peralatan_id, 'Tekiro', 'PH2', 35000, 25),
    ('Saklar Tunggal', elektronik_id, 'Broco', 'ST-001', 8000, 40);
END $$;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_stock ON items(stock);
CREATE INDEX IF NOT EXISTS idx_sales_employee ON sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_is_deleted ON sales(is_deleted);

-- Completed! Database schema setup berhasil.
