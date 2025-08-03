-- Run this SQL in Supabase SQL Editor to fix stock function

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS decrease_item_stock_safe(UUID, INTEGER);

-- Create the improved function
CREATE OR REPLACE FUNCTION decrease_item_stock_safe(item_id UUID, quantity INTEGER)
RETURNS JSONB AS $$
DECLARE
    current_stock INTEGER;
    item_name TEXT;
    updated_stock INTEGER;
BEGIN
    -- Lock the row to prevent race conditions
    SELECT stock, name INTO current_stock, item_name
    FROM items 
    WHERE id = item_id
    FOR UPDATE;
    
    -- If item doesn't exist
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Barang tidak ditemukan',
            'item_id', item_id
        );
    END IF;
    
    -- If stock is insufficient
    IF current_stock < quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Stok barang "%s" tidak mencukupi. Tersedia: %s, Diminta: %s', 
                           item_name, current_stock, quantity),
            'item_id', item_id,
            'item_name', item_name,
            'available_stock', current_stock,
            'requested_quantity', quantity
        );
    END IF;
    
    -- Update the stock
    UPDATE items 
    SET stock = stock - quantity 
    WHERE id = item_id;
    
    -- Get the new stock value
    updated_stock := current_stock - quantity;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'item_id', item_id,
        'item_name', item_name,
        'previous_stock', current_stock,
        'updated_stock', updated_stock,
        'quantity_sold', quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION decrease_item_stock_safe(UUID, INTEGER) TO authenticated;
