-- Add carteira (sub-client / case folder identifier) column for specialized contracts like Licks Advogados
ALTER TABLE contracts
ADD COLUMN carteira text;
