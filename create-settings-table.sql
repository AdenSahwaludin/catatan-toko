-- Create settings table for application configuration
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES 
    ('stock_management_enabled', '{"enabled": true}', 'Enable or disable stock management features'),
    ('app_name', '{"value": "Catatan Toko"}', 'Application name'),
    ('currency', '{"symbol": "Rp", "code": "IDR"}', 'Currency settings')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings table
CREATE POLICY "Enable read access for authenticated users" ON public.settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert/update for authenticated users" ON public.settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to get setting value
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT value FROM public.settings WHERE key = setting_key);
END;
$$;

-- Create function to update setting
CREATE OR REPLACE FUNCTION update_setting(setting_key TEXT, setting_value JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.settings 
    SET value = setting_value, updated_at = NOW()
    WHERE key = setting_key;
    
    RETURN FOUND;
END;
$$;
