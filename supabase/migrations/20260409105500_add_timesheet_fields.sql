-- Add details for timesheet handling
ALTER TABLE contracts
ADD COLUMN timesheet_forecast_value text,
ADD COLUMN timesheet_realized_value text,
ADD COLUMN timesheet_breakdown jsonb;
