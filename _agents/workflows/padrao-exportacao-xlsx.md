---
description: Padrão estrutural para geração de planilhas XLSX.
---

# Padrão para Exportação XLSX

Toda rotina de exportação no formato `.xlsx` que usar a biblioteca `xlsx-js-style` deve seguir estritamente esta formatação para a tabela e células, de forma a manter uma identidade corporativa (Salomão Manager) consistente.

## Requisitos
1. **Cabeçalho Principal**: Fundo Azul Escuro Corporativo (`0A192F`), Texto em Branco (`FFFFFF`), em Negrito. Alinhamento centralizado nas colunas numéricas ou de destaque (e à esquerda nos campos de texto mais longos, quando necessário, embora centralizado no header seja preferencial).
2. **Células Normais**: Texto com quebra automática onde necessário ou tamanho definido por coluna, mantendo as larguras amigáveis e não aglomeradas.
3. **Largura Células Automática (`!cols`)**: A tabela deve obrigatoriamente expandir as larguras colunas que farão parte do dataset de exportação.

## Algoritmo Padrão (Base)

```javascript
import XLSX from 'xlsx-js-style';

const exportRawData = [
  { "ID": "123", "Nome": "João Silva", "Setor": "Compliance", "Valor": 1500.25 },
  // ...
];

const ws = XLSX.utils.json_to_sheet(exportRawData);

// 1. Estilizando todo o cabeçalho (Linha 1)
const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
for (let col = range.s.c; col <= range.e.c; col++) {
  const cellRef = XLSX.utils.encode_cell({ r: 0, c: col }); // Linha 0 (Header)
  if (!ws[cellRef]) continue;

  ws[cellRef].s = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "0A192F" } }, // Fundo Azul Escuro do Salomão
    alignment: { horizontal: "center", vertical: "center" }
  };
}

// 2. Formatando as Larguras das Colunas Expandidas
ws['!cols'] = [
  { wch: 10 }, // Largura da Coluna 'ID'
  { wch: 40 }, // Largura da Coluna 'Nome'
  { wch: 20 }, // Largura da Coluna 'Setor'
  { wch: 15 }, // Largura da Coluna 'Valor'
];

// Opcional: Formatando colunas numéricas como Moeda BRL
for (let R = 1; R <= range.e.r; ++R) {
  // Exemplo para Coluna 'Valor' (índice 3 na matrix base 0 -> D)
  const cellRef = XLSX.utils.encode_cell({ r: R, c: 3 });
  if (ws[cellRef]) {
    ws[cellRef].t = 'n';
    ws[cellRef].z = '"R$"#,##0.00;"R$"-#,##0.00';
  }
}

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Relatório");
XLSX.writeFile(wb, `Export_${new Date().toISOString().split('T')[0]}.xlsx`);
```

Sempre respeite as larguras razoáveis baseadas no objeto JSON, passando o mapeamento para o atributo `ws['!cols']`.
