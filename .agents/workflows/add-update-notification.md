---
description: Como adicionar uma nova notificação de atualização ao sistema (What's New)
---
# Workflow: Adicionar Nova Notificação de Atualização (What's New)

Toda vez que uma série de funcionalidades ou correções for implementada e o usuário solicitar que fique salva a notificação, ou você sentir que é relevante documentar as mudanças da "sprint/dia", você deve adicionar as atualizações na configuração do modal.

1. Abra o arquivo `src/config/updates.ts`.
2. Adicione um novo objeto na primeira posição do array `APP_UPDATES` (ou incremente a propriedade `version`).
   Exemplo:
   ```typescript
   {
     version: '1.2.0', // Incremente de acordo
     date: '2026-03-05',
     title: 'Título da Atualização',
     description: 'Descrição geral sobre a atualização.',
     features: [
       'Melhoria X implementada na tela Y.',
       'Nova funcionalidade Z adicionada.'
     ],
     fixes: [
       'Correção no bug A.',
       'Ajuste visual no componente B.'
     ]
   }
   ```
3. O modal identificará automaticamente a mudança na versão (`version`) pelo `localStorage`, e abrirá para os usuários exibindo as novidades mais recentes assim que fizerem login.
