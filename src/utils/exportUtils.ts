import XLSX from 'xlsx-js-style';

/**
 * Padrão Corporativo para Exportação XLSX do Salomão Manager
 * Implementado conforme "padrao-exportacao-xlsx.md"
 */

export interface ExportSheetData {
  sheetName: string;
  data: any[];
  colWidths?: number[]; // Lista de larguras, ex: [30, 15, 20]. Se não informado, faremos um auto-fit heurístico.
}

export function exportToStandardXLSX(sheets: ExportSheetData[], fileName: string) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    if (!sheet.data || sheet.data.length === 0) {
      // Cria aba vazia padrão se não tiver dados, para não quebrar
      const emptyWs = XLSX.utils.json_to_sheet([{"Aviso": "Nenhum dado encontrado para exportação"}]);
      emptyWs['!cols'] = [{ wch: 50 }];
      XLSX.utils.book_append_sheet(wb, emptyWs, sheet.sheetName);
      continue;
    }

    const ws = XLSX.utils.json_to_sheet(sheet.data);

    // 1. Estilizando todo o cabeçalho Principal corporativo
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0A192F" } }, // Fundo Azul Escuro
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // 2. Definindo Larguras Automáticas das Colunas Expandidas (!cols)
    if (sheet.colWidths && sheet.colWidths.length > 0) {
      ws['!cols'] = sheet.colWidths.map(w => ({ wch: w }));
    } else {
      // Auto-fit básico pelas chaves
      const keys = Object.keys(sheet.data[0]);
      ws['!cols'] = keys.map(k => ({ wch: Math.max(k.length + 5, 15) }));
    }

    // 3. Formatação comum (Heurística p/ Moedas)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
      if (headerCell && headerCell.v) {
        const title = String(headerCell.v).toLowerCase();
        
        // Verifica se a coluna remete a um valor monetário
        const isCurrency = title.includes('(r$)') || title.includes('valor') || title.includes('custo') || title.includes('preço') || title.includes('média') || title.includes('bolsa');

        if (isCurrency) {
          for (let row = 1; row <= range.e.r; row++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
              ws[cellRef].t = 'n';
              ws[cellRef].z = '"R$"#,##0.00;"R$"-#,##0.00';
            }
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
  }

  // Fallback de segurança limite (wb vazio é corrompido)
  if (wb.SheetNames.length === 0) {
     const emptyWs = XLSX.utils.json_to_sheet([{"Aviso": "Nenhum dado encontrado para exportação"}]);
     emptyWs['!cols'] = [{ wch: 50 }];
     XLSX.utils.book_append_sheet(wb, emptyWs, "Aviso");
  }

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
}
