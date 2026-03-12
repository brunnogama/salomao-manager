---
description: Como adicionar uma nova notificação de atualização ao sistema (What's New)
---
# Workflow: Adicionar Nova Notificação de Atualização (What's New)

## REGRA OBRIGATÓRIA
Toda vez que uma tarefa for concluída (funcionalidade nova ou correção de bug), o changelog DEVE ser atualizado automaticamente antes do commit final. Não esperar o usuário pedir.

## Versionamento Semântico

- **Total redesign (mudança visual/estrutural completa):** incrementar o primeiro número → `X.0.0`
- **Novas funcionalidades:** incrementar o segundo número → `X.Y.0`
- **Correções de bugs:** incrementar o terceiro número → `X.Y.Z`

Exemplo: versão atual `1.5.0`
- Bug fix → `1.5.1`
- Nova feature → `1.6.0`
- Redesign total → `2.0.0`

## Passos

1. Abra o arquivo `src/config/updates.ts`.
2. Identifique a versão mais recente no array `APP_UPDATES`.
3. Incremente a versão de acordo com o tipo de mudança (regra acima).
4. Adicione um novo objeto na **primeira posição** do array `APP_UPDATES`.
   Exemplo:
   ```typescript
   {
     version: '1.5.1',
     date: 'DD/MM/AAAA',
     title: 'Título da Atualização',
     description: 'Descrição geral sobre a atualização.',
     features: [
       'Melhoria X implementada na tela Y.',
     ],
     fixes: [
       'Correção no bug A.',
     ]
   }
   ```
5. O modal identificará automaticamente a mudança na versão (`version`) pelo `localStorage`, e abrirá para os usuários exibindo as novidades mais recentes assim que fizerem login.
