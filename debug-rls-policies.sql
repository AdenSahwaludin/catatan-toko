-- Debug dan perbaikan RLS policies
-- Jalankan script ini di Supabase SQL Editor

-- 1. Cek status RLS pada semua tabel
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'categories', 'items', 'sales')
ORDER BY tablename;

-- 2. Cek policies yang ada
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'categories', 'items', 'sales')
ORDER BY tablename, policyname;

-- 3. Disable RLS sementara untuk testing (HATI-HATI!)
-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 4. Atau buat policies yang lebih permissive untuk testing
-- Policy untuk categories - allow all
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
CREATE POLICY "Allow all operations on categories"
ON categories FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Policy untuk items - allow all
DROP POLICY IF EXISTS "Allow all operations on items" ON items;
CREATE POLICY "Allow all operations on items"
ON items FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Policy untuk sales - allow all
DROP POLICY IF EXISTS "Allow all operations on sales" ON sales;
CREATE POLICY "Allow all operations on sales"
ON sales FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Policy untuk users - allow all
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users"
ON users FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 5. Cek apakah tabel ada dan struktur benar
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('users', 'categories', 'items', 'sales')
ORDER BY table_name, ordinal_position;

-- 6. Test data exists
SELECT 'categories' as table_name, count(*) as row_count FROM categories
UNION ALL
SELECT 'items' as table_name, count(*) as row_count FROM items
UNION ALL
SELECT 'sales' as table_name, count(*) as row_count FROM sales
UNION ALL
SELECT 'users' as table_name, count(*) as row_count FROM users;

-- 7. Cek apakah ada barcode column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'items'
AND column_name = 'barcode';

-- Jika barcode column belum ada, tambahkan:
-- ALTER TABLE items ADD COLUMN IF NOT EXISTS barcode VARCHAR(13) UNIQUE;
