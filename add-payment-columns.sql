-- Menambahkan kolom paid dan change ke tabel sales
ALTER TABLE public.sales 
ADD COLUMN paid NUMERIC DEFAULT NULL,
ADD COLUMN change NUMERIC DEFAULT NULL,
ADD COLUMN payment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Menambahkan comment untuk dokumentasi
COMMENT ON COLUMN public.sales.paid IS 'Jumlah uang yang dibayarkan pelanggan';
COMMENT ON COLUMN public.sales.change IS 'Jumlah kembalian yang diberikan ke pelanggan';
COMMENT ON COLUMN public.sales.payment_timestamp IS 'Waktu saat pembayaran dikonfirmasi';

-- Index untuk performa query berdasarkan payment status
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(paid) WHERE paid IS NOT NULL;
