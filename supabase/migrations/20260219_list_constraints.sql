-- Diagnostic script to list ALL constraints and indexes on the contracts table
-- Run this to see what is still enforcing uniqueness.

SELECT 
    conname as constraint_name, 
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'contracts';

SELECT 
    indexname as index_name, 
    indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'contracts';
