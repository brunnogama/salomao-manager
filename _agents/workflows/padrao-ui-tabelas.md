---
description: Padrão UI e UX de Tabelas para o sistema (Cabeçalho, Linha Clicável e Modal)
---

# Padrão UI e UX para Tabelas

Sempre que a interface demandar o desenvolvimento de uma aba ou página com listagem de registros em **tabela**, deve-se seguir o seguinte **Design System**:

## 1. Cabeçalho (Thead)

O cabeçalho (`thead`) das tabelas deve possuir uma cor sólida e chamativa do nosso Branding, utilizando o gradiente azul escuro oficial do sistema, de forma fixa (`sticky`). O texto deve estar em letras minúsculas (`uppercase`), negrito (`font-black`), branco e com espaçamento (`tracking-widest`).

**Exemplo Tailwind:**
```tsx
<thead className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] sticky top-0 z-10">
  <tr>
    <th className="p-4 pl-6 text-[10px] font-black uppercase text-white tracking-widest w-[15%]">
      Título Coluna 1
    </th>
    {/* ... outras colunas ... */}
  </tr>
</thead>
```

<br>

## 2. Linhas (Tbody ou Tr) e UX

As tabelas devem possuir um comportamento interativo (UX). As linhas **inteiras** da tabela (`tr`) devem ser **clicáveis**. Sempre que o usuário clicar na linha inteira, um modal flutuante deve se abrir!

- Utilize `cursor-pointer hover:bg-gray-50/50 transition-colors` na `tr`.
- Adicione evento `onClick={() => handleOpenItemModal(item)}` na `tr`.
- Nunca sobrecarregue a tabela colocando os botões "Excluir" e "Editar" soltos dentro das células da tabela. 
- A visualização dos botões "Editar" e "Excluir" (além de aprovar, reprovar, baixar) deve residir **dentro do Modal Flutuante** que abre ao clicar na linha, seguindo o padrão de "View Modal" ou seja lá qual seja o gerenciamento da tela.
- Dentro da última coluna da Tabela, você pode incluir no máximo um ícone rápido indicativo (como o "Lápis" `Pencil` ou "Seta"), mas a interação principal continua sendo clicar na linha em si.

**Exemplo Tailwind UX:**
```tsx
<tr 
  key={item.id} 
  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
  onClick={() => openModalView(item)}
>
  <td className="p-4 pl-6 text-sm font-semibold text-[#1e3a8a]">{item.nome}</td>
  <td className="p-4 text-sm text-gray-600">{item.descricao}</td>
</tr>
```

Siga sempre esta arquitetura UI/UX de Tabelas em todos os módulos da plataforma para padronização.
