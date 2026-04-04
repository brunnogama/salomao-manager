-- Change fee columns from numeric to text to support formatted strings like '%' and 'US$'

ALTER TABLE contracts
ALTER COLUMN pro_labore TYPE text USING pro_labore::text,
ALTER COLUMN final_success_fee TYPE text USING final_success_fee::text,
ALTER COLUMN fixed_monthly_fee TYPE text USING fixed_monthly_fee::text,
ALTER COLUMN other_fees TYPE text USING other_fees::text;
