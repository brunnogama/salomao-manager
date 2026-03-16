-- Create kanban_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'Média',
    due_date TIMESTAMP WITH TIME ZONE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitando RLS
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Exemplo de Policies (ajuste conforme a necessidade do seu projeto, aqui deixo permitindo tudo para autenticados como padrão no Supabase)
CREATE POLICY "Enable all actions for authenticated users" 
ON public.kanban_tasks 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
