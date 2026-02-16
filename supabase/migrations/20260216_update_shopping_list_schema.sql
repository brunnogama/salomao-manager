-- Add category and unit_price columns to shopping_list_items table
ALTER TABLE shopping_list_items 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Outros',
ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
