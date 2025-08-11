-- Add barcode column to items table
ALTER TABLE items 
ADD COLUMN barcode VARCHAR(13) UNIQUE;

-- Add index for faster barcode lookups
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);

-- Add comment
COMMENT ON COLUMN items.barcode IS 'EAN-13 barcode for the item (optional)';
