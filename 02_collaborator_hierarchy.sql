-- 02_collaborator_hierarchy.sql
-- Tabela para guardar o histórico das alterações de líderes de um colaborador
CREATE TABLE IF NOT EXISTS public.collaborator_hierarchy_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE CASCADE,
    change_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    old_leader_ids JSONB,
    new_leader_ids JSONB,
    old_partner_ids JSONB,
    new_partner_ids JSONB,
    changed_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.collaborator_hierarchy_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users on hierarchy history" 
    ON public.collaborator_hierarchy_history FOR ALL 
    TO authenticated USING (true) WITH CHECK (true);

-- Drop trigger se existir
DROP TRIGGER IF EXISTS trigger_log_collaborator_hierarchy_changes ON public.collaborators;
DROP FUNCTION IF EXISTS public.log_collaborator_hierarchy_changes;

-- Função do Gatilho
CREATE OR REPLACE FUNCTION public.log_collaborator_hierarchy_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Checa se houve diferença nos leader_ids ou partner_ids
    IF (OLD.leader_ids IS DISTINCT FROM NEW.leader_ids) OR (OLD.partner_ids IS DISTINCT FROM NEW.partner_ids) THEN
        INSERT INTO public.collaborator_hierarchy_history (
            collaborator_id,
            change_date,
            old_leader_ids,
            new_leader_ids,
            old_partner_ids,
            new_partner_ids,
            changed_by_name
        ) VALUES (
            NEW.id,
            now(),
            to_jsonb(OLD.leader_ids),
            to_jsonb(NEW.leader_ids),
            to_jsonb(OLD.partner_ids),
            to_jsonb(NEW.partner_ids),
            NEW.updated_by_name
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o Gatilho
CREATE TRIGGER trigger_log_collaborator_hierarchy_changes
AFTER UPDATE ON public.collaborators
FOR EACH ROW
EXECUTE FUNCTION public.log_collaborator_hierarchy_changes();
