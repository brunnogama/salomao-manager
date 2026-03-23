alter table public.contracts
add column if not exists co_partner_ids uuid[] default array[]::uuid[];
