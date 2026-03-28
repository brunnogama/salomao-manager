---
description: Padrão UI para o botão de Exportar XLSX do nosso sistema
---

# Padrão UI de Botão para Exportação XLSX

Toda vez que uma página ou módulo precisar de um botão para "Exportar" ou "Baixar Planilha" em `.xlsx`, o padrão visual do botão deve ser exatamente o seguinte:

- **Formato**: Circular (ícone centralizado).
- **Cor**: Ícone e fundo esmeralda vibrante, com o `hover` reagindo.
- **Tamanho**: Fixo em `w-10 h-10` com o ícone respeitando `h-5 w-5`.
- **Posicionamento sugerido**: No cabeçalho da seção ou da tela, alinhado à direita do Título ou aos outros botões de Ação do Header.
- **Ícone**: O ícone oficial é o **`FileDown`** do pacote `lucide-react`.

### Implementação JSX (Tailwind)

```tsx
import { FileDown } from 'lucide-react';

<button
  onClick={suaFuncaoDeExportacao}
  title="Exportar Planilha"
  className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
>
  <FileDown className="h-5 w-5" />
</button>
```

Sempre reaproveite exatamente essas classes do Tailwind para o botão de extrair relatórios ou exportar faturas/reembolsos para o Excel em formato XLSX, mantendo assim o **Design System** do Salomão Manager perfeitamente consistente em todos os módulos (Colaboradores, Financeiro, Compliance, etc).
