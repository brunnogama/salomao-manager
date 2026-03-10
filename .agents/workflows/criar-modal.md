---
description: Como criar um modal corretamente neste projeto (OBRIGATÓRIO para todo modal novo)
---

# Criar Modal — Regra Obrigatória

## Problema

O `<main>` do `MainLayout.tsx` usa `transition-[flex,width,margin,padding]` (anteriormente `transition-all`).
Quando `transition-all` do Tailwind inclui `transform` ou `filter` nas `transition-property`, o Chrome cria um **containing block** para `position: fixed`. Isso faz com que `fixed inset-0` seja relativo ao `<main>` e não ao viewport, causando uma barra branca/clara no topo do backdrop do modal.

Mesmo com a correção do `transition-all` já aplicada, **todo modal DEVE usar `createPortal`** como proteção contra regressões futuras.

## Regra

**Todo modal que use `position: fixed` (ou `fixed inset-0`) DEVE ser renderizado via `createPortal(jsx, document.body)`.**

Isso garante que o modal é inserido diretamente no `<body>`, fora da árvore de componentes do React e fora de qualquer containing block CSS.

## Implementação

### 1. Importar `createPortal`

```tsx
import { createPortal } from 'react-dom';
```

### 2. Envolver o return com `createPortal`

```tsx
// ❌ ERRADO — NÃO FAÇA ISSO
return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] ...">
    {/* conteúdo do modal */}
  </div>
);

// ✅ CORRETO — SEMPRE FAÇA ISSO
return createPortal(
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] ...">
    {/* conteúdo do modal */}
  </div>,
  document.body
);
```

### 3. Padrão de z-index

- Modais normais: `z-[60]`
- Modais de overlay (fotos, confirmações): `z-[9999]`
- Sub-modais (dentro de modais): `z-[99999]`

## Modais já corrigidos

- `CollaboratorLayouts.tsx` (CollaboratorModalLayout + CollaboratorPageLayout)
- `VagasSelectionModal.tsx`
- `ContractFormModal.tsx`
- `CertificateFormModal.tsx`
- `ClientFormModal.tsx`

## Checklist para novos modais

- [ ] Importou `createPortal` de `react-dom`
- [ ] Usou `createPortal(jsx, document.body)` no return
- [ ] Usou `fixed inset-0` no backdrop
- [ ] Definiu `z-index` apropriado
- [ ] Testou que o backdrop cobre 100% do viewport (sem barra branca no topo)
