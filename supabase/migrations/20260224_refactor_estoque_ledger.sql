-- Migration: Refactor Estoque to Ledger structure
-- Date: 2026-02-24

-- 1. Remove old base
DROP TABLE IF EXISTS public.operational_stock;

-- 2. Create new ledger table
CREATE TABLE IF NOT EXISTS public.operational_stock_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_date DATE,
    product TEXT NOT NULL,
    store TEXT,
    quantity INTEGER DEFAULT 0,
    returned_quantity INTEGER DEFAULT 0,
    return_date DATE,
    sold_quantity INTEGER DEFAULT 0,
    accumulated_stock INTEGER DEFAULT 0,
    unit_price NUMERIC DEFAULT 0,
    total_sale_value NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.operational_stock_ledger ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.operational_stock_ledger;
CREATE POLICY "Enable read access for all users" ON public.operational_stock_ledger FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.operational_stock_ledger;
CREATE POLICY "Enable all access for authenticated users" ON public.operational_stock_ledger 
FOR ALL USING (auth.role() = 'authenticated');
