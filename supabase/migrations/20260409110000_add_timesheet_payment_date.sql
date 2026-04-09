-- Add timesheet payment date
ALTER TABLE contracts
ADD COLUMN timesheet_payment_date date;
