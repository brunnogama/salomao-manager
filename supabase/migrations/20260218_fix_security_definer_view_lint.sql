-- Migration due to lint error: Security Definer View
-- This view should run with the permissions of the invoking user (security_invoker = true)
-- rather than the owner's permissions, ensuring RLS policies are respected.

ALTER VIEW public.vw_vencimentos_oab_6meses SET (security_invoker = true);
