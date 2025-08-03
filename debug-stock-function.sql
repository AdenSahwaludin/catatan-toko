-- Improved function with better debugging
CREATE OR REPLACE FUNCTION decrease_item_stock(item_id UUID, quantity INTEGER)
RETURNS void AS $$
DECLARE
    current_stock INTEGER;
    item_name TEXT;
BEGIN
    -- First check if item exists and get current stock
    SELECT stock, name INTO current_stock, item_name
    FROM items 
    WHERE id = item_id;
    
    -- If item doesn't exist
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Barang dengan ID % tidak ditemukan', item_id;
    END IF;
    
    -- If stock is insufficient
    IF current_stock < quantity THEN
        RAISE EXCEPTION 'Stok barang "%" tidak mencukupi. Tersedia: %, Diminta: %', 
                       item_name, current_stock, quantity;
    END IF;
    
    -- Update the stock
    UPDATE items 
    SET stock = stock - quantity 
    WHERE id = item_id;
    
    -- Log for debugging
    RAISE NOTICE 'Stock updated for %: % -> %', item_name, current_stock, (current_stock - quantity);
END;
$$ LANGUAGE plpgsql;
