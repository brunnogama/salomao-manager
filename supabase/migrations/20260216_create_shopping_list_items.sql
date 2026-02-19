-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    brand TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'purchased'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.shopping_list_items
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.shopping_list_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.shopping_list_items
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.shopping_list_items
    FOR DELETE USING (true);
