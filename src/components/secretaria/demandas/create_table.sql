-- Crie esta tabela no editor SQL do Supabase
CREATE TABLE IF NOT EXISTS public.familia_salomao_demandas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_solicitacao DATE,
    solicitante TEXT,
    unidade TEXT,
    fornecedor TEXT,
    equipamento TEXT,
    tipo TEXT,
    categoria TEXT,
    demanda TEXT,
    prioridade TEXT DEFAULT 'Média',
    responsavel TEXT,
    quem_acompanha TEXT,
    status TEXT DEFAULT 'Pendente',
    proxima_acao TEXT,
    prazo DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar Row Level Security
ALTER TABLE public.familia_salomao_demandas ENABLE ROW LEVEL SECURITY;

-- Exemplo de política genérica (Todos autenticados podem ver e editar)
-- Ajuste de acordo com as permissões do projeto
CREATE POLICY "Permitir leitura para todos autenticados" 
ON public.familia_salomao_demandas FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção para todos autenticados" 
ON public.familia_salomao_demandas FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização para todos autenticados" 
ON public.familia_salomao_demandas FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão para todos autenticados" 
ON public.familia_salomao_demandas FOR DELETE 
USING (auth.role() = 'authenticated');
