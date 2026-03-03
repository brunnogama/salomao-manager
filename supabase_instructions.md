Para que os campos "Cargo Pretendido" e "Local" sejam salvos corretamente no candidato, eles precisam existir na tabela `candidatos` do seu banco de dados Supabase. Atualmente, a tabela não possui essas colunas, por isso os dados preenchidos não ficam gravados.

Por favor, acesse o painel do seu Supabase, abra o **SQL Editor** e rode o seguinte comando:

```sql
ALTER TABLE candidatos ADD COLUMN role text;
ALTER TABLE candidatos ADD COLUMN local text;
```
