CREATE TABLE IF NOT EXISTS user_kanban_settings (
    user_email TEXT PRIMARY KEY,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar Políticas de Segurança (RLS)
ALTER TABLE user_kanban_settings ENABLE ROW LEVEL SECURITY;

-- O usuário só pode ver as tarefas onde a coluna user_email é igual ao e-mail dele no token de Autenticação
CREATE POLICY "Ler proprio kanban"
ON user_kanban_settings FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = user_email);

-- O usuário só pode inserir, atualizar e deletar os seus próprios dados de Kanban
CREATE POLICY "Modificar proprio kanban"
ON user_kanban_settings FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = user_email)
WITH CHECK (auth.jwt() ->> 'email' = user_email);
