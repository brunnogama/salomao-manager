alter table contracts add column if not exists pro_labore_extras jsonb default '[]'::jsonb;
alter table contracts add column if not exists pro_labore_extras_clauses jsonb default '[]'::jsonb;
alter table contracts add column if not exists pro_labore_extras_rules jsonb default '[]'::jsonb;
alter table contracts add column if not exists pro_labore_extras_ready jsonb default '[]'::jsonb;
alter table contracts add column if not exists pro_labore_extras_installments jsonb default '[]'::jsonb;

alter table contracts add column if not exists final_success_extras jsonb default '[]'::jsonb;
alter table contracts add column if not exists final_success_extras_clauses jsonb default '[]'::jsonb;
alter table contracts add column if not exists final_success_extras_rules jsonb default '[]'::jsonb;
alter table contracts add column if not exists final_success_extras_ready jsonb default '[]'::jsonb;
alter table contracts add column if not exists final_success_extras_installments jsonb default '[]'::jsonb;

alter table contracts add column if not exists fixed_monthly_extras jsonb default '[]'::jsonb;
alter table contracts add column if not exists fixed_monthly_extras_clauses jsonb default '[]'::jsonb;
alter table contracts add column if not exists fixed_monthly_extras_rules jsonb default '[]'::jsonb;
alter table contracts add column if not exists fixed_monthly_extras_ready jsonb default '[]'::jsonb;
alter table contracts add column if not exists fixed_monthly_extras_installments jsonb default '[]'::jsonb;

alter table contracts add column if not exists other_fees_extras jsonb default '[]'::jsonb;
alter table contracts add column if not exists other_fees_extras_clauses jsonb default '[]'::jsonb;
alter table contracts add column if not exists other_fees_extras_rules jsonb default '[]'::jsonb;
alter table contracts add column if not exists other_fees_extras_ready jsonb default '[]'::jsonb;
alter table contracts add column if not exists other_fees_extras_installments jsonb default '[]'::jsonb;

alter table contracts add column if not exists intermediate_fees jsonb default '[]'::jsonb;
alter table contracts add column if not exists intermediate_fees_clauses jsonb default '[]'::jsonb;
alter table contracts add column if not exists intermediate_fees_rules jsonb default '[]'::jsonb;
alter table contracts add column if not exists intermediate_fees_ready jsonb default '[]'::jsonb;
alter table contracts add column if not exists intermediate_fees_installments jsonb default '[]'::jsonb;

alter table contracts add column if not exists percent_extras jsonb default '[]'::jsonb;
alter table contracts add column if not exists percent_extras_clauses jsonb default '[]'::jsonb;
alter table contracts add column if not exists percent_extras_rules jsonb default '[]'::jsonb;
alter table contracts add column if not exists percent_extras_ready jsonb default '[]'::jsonb;

alter table contracts add column if not exists pro_labore_breakdown jsonb default '[]'::jsonb;
alter table contracts add column if not exists final_success_fee_breakdown jsonb default '[]'::jsonb;
alter table contracts add column if not exists fixed_monthly_fee_breakdown jsonb default '[]'::jsonb;
alter table contracts add column if not exists other_fees_breakdown jsonb default '[]'::jsonb;
alter table contracts add column if not exists intermediate_fees_breakdown jsonb default '[]'::jsonb;
alter table contracts add column if not exists interim_breakdown jsonb default '[]'::jsonb;

