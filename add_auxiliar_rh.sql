-- Rode este script no Editor SQL do seu painel do Supabase.
-- Ele verifica se o cargo já existe e o insere se não existir.

INSERT INTO "roles" ("name")
SELECT 'Auxiliar de RH'
WHERE NOT EXISTS (
    SELECT 1 FROM "roles" WHERE "name" = 'Auxiliar de RH'
);
