export const maskCNPJ = (value: string) => {
  // Máscara mista para CPF e CNPJ
  const cleanValue = value.replace(/\D/g, '');

  if (cleanValue.length <= 11) {
    // CPF
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    // CNPJ
    return cleanValue
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
};

export const maskMoney = (value: string) => {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return "";
  const number = parseFloat(onlyDigits) / 100;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const maskHon = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{7})(\d)/, '$1/$2')
    .replace(/(\/\d{3})\d+?$/, '$1');
};

export const maskCNJ = (value: string) => {
  // Formato: 0000000-00.0000.0.00.0000
  let v = value.replace(/\D/g, "");
  v = v.replace(/^(\d{7})(\d)/, "$1-$2");
  v = v.replace(/-(\d{2})(\d)/, "-$1.$2");
  v = v.replace(/\.(\d{4})(\d)/, ".$1.$2");
  v = v.replace(/\.(\d)(\d)/, ".$1.$2");
  v = v.replace(/\.(\d{2})(\d)/, ".$1.$2");
  return v.slice(0, 25);
};

export const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  // Remove R$, pontos e espaços, troca vírgula por ponto
  const clean = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

export const toTitleCase = (str: string) => {
  if (!str) return '';

  const acronyms: Record<string, string> = {
    'clt': 'CLT', 'pj': 'PJ', 'oab': 'OAB', 'rg': 'RG', 'cpf': 'CPF', 'cnpj': 'CNPJ',
    'uf': 'UF', 'ti': 'TI', 'rh': 'RH', 'ceo': 'CEO', 'cfo': 'CFO', 'mei': 'MEI',
    'pis': 'PIS', 'pasep': 'PASEP', 'ctps': 'CTPS', 'cnh': 'CNH', 'oab/uf': 'OAB/UF'
  };

  const lowerCaseWords = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'para', 'com'];

  return str.replace(
    /\w\S*/g,
    (txt) => {
      const lower = txt.toLowerCase();
      // Verifique se é uma sigla conhecida
      if (acronyms[lower]) return acronyms[lower];
      // Verifique se é uma preposição (apenas se não for a primeira palavra da string original - simplificado aqui)
      // Nota: Para ser perfeito precisaria do índice, mas para "Tipo" funciona bem.
      // Vou manter a capitalização da primeira letra sempre se não for sigla, unless it's strictly a formatter that usually lowercases connectors.
      // O formato Title Case padrão geralmente coloca conectivos em minúsculo.
      if (lowerCaseWords.includes(lower)) return lower;

      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
};

// --- MÁSCARAS ADICIONADAS PARA CORRIGIR O ERRO ---

export const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, "");
  // (11) 99999-9999
  if (v.length > 10) {
    return v
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  }
  // (11) 9999-9999
  return v
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 14);
};

export const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

export const safeDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr) return null;

  // Force YYYY-MM-DD extraction to ensure Local Date interpretation (noon)
  // This avoids timezone shifts (e.g. UTC 00:00 -> Local 21:00 prev day)
  if (typeof dateStr === 'string') {
    // Extract YYYY-MM-DD if present
    const isoDateMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDateMatch) {
      return new Date(isoDateMatch[1] + 'T12:00:00');
    }
  }

  // If it's already a clean YYYY-MM-DD (redundant but safe)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T12:00:00');
  }

  // Handle DD/MM/YYYY
  const ptBrMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ptBrMatch) {
    const [_, day, month, year] = ptBrMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
  }

  // Try creating date directly (ISO etc)
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  return null;
};