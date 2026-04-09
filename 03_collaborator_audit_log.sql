-- 03_collaborator_audit_log.sql
-- Adiciona a trigger para logar todas as alterações na tabela colaboradores
-- dentro do audit_logs global, seguindo o padrão já utilizado para contratos e clientes.

-- 1. Cria a função de auditoria genérica (caso falte no banco)
CREATE OR REPLACE FUNCTION public.log_audit_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_old_data jsonb;
  v_new_data jsonb;
  v_user_id uuid;
  v_user_email text;
BEGIN
  -- Tenta resgatar dados do usuário a partir da sessão/jwt
  v_user_id := auth.uid();
  v_user_email := current_setting('request.jwt.claims', true)::jsonb->>'email';
  
  IF (TG_OP = 'UPDATE') THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id, user_email)
    VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, v_old_data, v_new_data, v_user_id, v_user_email);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    v_old_data := to_jsonb(OLD);
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, user_id, user_email)
    VALUES (TG_TABLE_NAME, OLD.id::text, TG_OP, v_old_data, v_user_id, v_user_email);
    RETURN OLD;
  ELSIF (TG_OP = 'INSERT') THEN
    v_new_data := to_jsonb(NEW);
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, user_id, user_email)
    VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, v_new_data, v_user_id, v_user_email);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- 2. Conecta a tabela collaborators e a sua action de LOGS
DROP TRIGGER IF EXISTS trigger_collaborators_audit_log ON public.collaborators;

CREATE TRIGGER trigger_collaborators_audit_log
AFTER INSERT OR UPDATE OR DELETE ON public.collaborators
FOR EACH ROW
EXECUTE FUNCTION public.log_audit_action();
