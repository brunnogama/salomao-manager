-- Migration para atualizar o prefixo de identificação dos integratens (Colaboradores)
-- Isso atualiza de 'COL -' para 'INT -' em todos os registros salvos.
UPDATE collaborators
SET matricula_interna = REPLACE(matricula_interna, 'COL -', 'INT -')
WHERE matricula_interna LIKE 'COL -%';
