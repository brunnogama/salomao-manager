---
description: Como criar diálogos de confirmação ou alertas na UI do sistema (NUNCA usar window.confirm nativo)
---
# Regra de Uso de Modais e Confirmações

Toda e qualquer janela de confirmação de ação do usuário (ex: "Tem certeza que deseja excluir?", "Deseja arquivar?") deve ser feita usando a **UI elegante do sistema** e NUNCA através da função nativa de browser `window.confirm()` ou `alert()`.

## Passos para Implementar uma Confirmação Elegante

1. Identifique o uso de `window.confirm()` e substitua-o.
2. Defina um estado local no componente React correspondente para controlar a exibição do modal e armazenar os dados necessários para a ação, como por exemplo:
   ```tsx
   const [pendingActionTarget, setPendingActionTarget] = useState<{ id: string, name: string } | null>(null);
   ```
3. Importe o componente genérico de alerta/confirmação do próprio projeto. Dependendo do módulo, você terá à disposição:
   ```tsx
   // No módulo de RH / Colaboradores:
   import { AlertModal } from '../../../components/ui/AlertModal';
   
   // Ou no módulo de Controladoria / Finanças:
   import { ConfirmModal } from '../../controladoria/ui/ConfirmModal';
   ```
4. Renderize o Modal Elegante no final do seu componente:
   ```tsx
   <AlertModal
     isOpen={!!pendingActionTarget}
     onClose={() => setPendingActionTarget(null)}
     title="Confirmação Necessária"
     description={`Deseja prosseguir a ação para ${pendingActionTarget?.name}?`}
     variant="warning" // pode ser "warning", "error", etc dependendo da periculosidade
     confirmText="Prosseguir"
     onConfirm={executeAcaoDefinitiva}
   />
   ```
5. Nunca adicione diretamente chamadas nativas em fluxos de negócios para evitar quebra de experiência do usuário. O design system deve ser respeitado em **TODOS os modais novos.**
