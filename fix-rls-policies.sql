-- Fix RLS Policies untuk menghindari infinite recursion
-- Jalankan di Supabase SQL Editor

-- 1. Drop semua policies yang ada di table users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;

-- 2. Disable RLS sementara untuk testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Atau jika ingin tetap pakai RLS, buat policy sederhana tanpa recursion
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy untuk SELECT (read)
-- CREATE POLICY "Allow authenticated users to read users" 
-- ON public.users FOR SELECT 
-- TO authenticated 
-- USING (true);

-- Policy untuk INSERT (create) 
-- CREATE POLICY "Allow authenticated users to insert users" 
-- ON public.users FOR INSERT 
-- TO authenticated 
-- WITH CHECK (auth.uid() = id);

-- Policy untuk UPDATE (update)
-- CREATE POLICY "Allow users to update own data" 
-- ON public.users FOR UPDATE 
-- TO authenticated 
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);

-- 4. Buat admin user manual (jika belum ada)
-- Insert user ke auth.users terlebih dahulu
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'admin@toko.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert ke public.users
INSERT INTO public.users (id, email, role, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@toko.com',
  'admin',
  now()
) ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 5. Buat employee user untuk testing
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'aden@gmail.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert ke public.users
INSERT INTO public.users (id, email, role, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'aden@gmail.com',
  'employee',
  now()
) ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role;
