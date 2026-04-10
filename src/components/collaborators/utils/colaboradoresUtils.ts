export const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
];

export const toTitleCase = (str: string) => {
  if (!str) return ''
  const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
  const acronyms = ['clt', 'pj', 'cpf', 'cnpj', 'rg', 'cnh', 'oab', 'rh', 'ti', 'ceo', 'cfo', 'pis', 'pasep', 'ctps', 'ltda', 'epp', 'eireli', 'cia'];
  const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'a', 'o', 'ao', 'ou', 'por', 'para', 'com'];
  const specialUpper: Record<string, string> = { 's/a': 'S/A', 's.a.': 'S.A.', 'me': 'ME' };
  return str.toLowerCase().split(' ').map((word, index) => {
    if (specialUpper[word]) return specialUpper[word];
    if (romanNumerals.includes(word) || acronyms.includes(word)) return word.toUpperCase();
    if (index > 0 && prepositions.includes(word)) return word;
    return (word.length > 0) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }).join(' ');
}

export const formatDateDisplay = (str?: string) => {
  if (!str) return '-'
  const date = new Date(str)
  return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
}

export const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)

export const maskCPF = (v: string) => {
  let val = v.replace(/\D/g, '')
  val = val.replace(/(\d{3})(\d)/, '$1.$2')
  val = val.replace(/(\d{3})(\d)/, '$1.$2')
  val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return val.slice(0, 14)
}

export const maskCNPJ = (v: string) => {
  let val = v.replace(/\D/g, '')
  val = val.replace(/^(\d{2})(\d)/, '$1.$2')
  val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  val = val.replace(/\.(\d{3})(\d)/, '.$1/$2')
  val = val.replace(/(\d{4})(\d)/, '$1-$2')
  return val.slice(0, 18)
}

export const maskDate = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10)

export const maskRG = (v: string) => {
  let val = v.replace(/[^a-zA-Z0-9]/g, '')
  if (val.length > 8) {
    val = val.replace(/^([a-zA-Z0-9]{8})([a-zA-Z0-9]+)/, '$1-$2')
  }
  return val.toUpperCase().slice(0, 14)
}

export const maskPhone = (v: string) => {
  const raw = v.replace(/\D/g, '')
  // Sem DDD (até 9 dígitos): XXXXX-XXXX ou XXXX-XXXX
  if (raw.length <= 9) {
    return raw.replace(/(\d{4,5})(\d{1,4})?/, (_, p1, p2) => {
      let result = p1
      if (p2) result += `-${p2}`
      return result
    }).slice(0, 10)
  }
  // Com DDD (10-11 dígitos): (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  return raw.replace(/(\d{2})(\d{4,5})(\d{1,4})?/, (_, p1, p2, p3) => {
    let result = `(${p1}) ${p2}`
    if (p3) result += `-${p3}`
    return result
  }).slice(0, 15)
}

export const formatPhoneDisplay = (phone: string | undefined | null): string => {
  if (!phone) return ''
  const raw = phone.replace(/\D/g, '')
  if (!raw) return phone
  // Já formatado corretamente
  if (raw.length === 11) return `(${raw.slice(0,2)}) ${raw.slice(2,7)}-${raw.slice(7)}`
  if (raw.length === 10) return `(${raw.slice(0,2)}) ${raw.slice(2,6)}-${raw.slice(6)}`
  if (raw.length === 9) return `${raw.slice(0,5)}-${raw.slice(5)}`
  if (raw.length === 8) return `${raw.slice(0,4)}-${raw.slice(4)}`
  return phone
}

export const formatNameDisplay = (name: string | undefined | null): string => {
  if (!name) return ''
  return toTitleCase(name)
}

export const formatDateFieldToDisplay = (isoDate: string | undefined | null): string => {
  if (!isoDate) return ''
  // Já no formato DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate
  // Formato ISO YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  const cleanDate = isoDate.split('T')[0]
  const parts = cleanDate.split('-')
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return isoDate
}

export const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '';

  // Se for string, limpar e converter
  let numericValue = typeof value === 'string' ? Number(value.replace(/\D/g, '')) / 100 : value;
  if (isNaN(numericValue)) numericValue = 0;

  const formatted = numericValue.toFixed(2).replace('.', ',');
  return `R$ ${formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

export const maskCurrencyInput = (value: string): string => {
  if (!value) return '';
  const onlyDigits = value.replace(/\D/g, '');
  if (!onlyDigits) return '';
  const numericValue = Number(onlyDigits) / 100;
  const formatted = numericValue.toFixed(2).replace('.', ',');
  return `R$ ${formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  const numericString = value.replace(/\D/g, '');
  return Number(numericString) / 100;
};

export const formatDateToDisplay = (isoDate: string | undefined | null) => {
  if (!isoDate) return ''
  if (isoDate.includes('/')) return isoDate
  const cleanDate = isoDate.split('T')[0]
  const [y, m, d] = cleanDate.split('-')
  return `${d}/${m}/${y}`
}

export const formatDateToISO = (displayDate: string | undefined | null) => {
  if (!displayDate) return ''
  if (displayDate.includes('-')) return displayDate
  const [d, m, y] = displayDate.split('/')
  return `${y}-${m}-${d}`
}

export const formatMonthYearDateToDisplay = (isoDate: string | undefined | null) => {
  if (!isoDate) return ''
  if (isoDate.includes('/')) return isoDate
  const cleanDate = isoDate.split('T')[0]
  const [y, m, _d] = cleanDate.split('-')
  return `${m}/${y}`
}

export const formatMonthYearDateToISO = (displayDate: string | undefined | null) => {
  if (!displayDate) return ''
  if (displayDate.includes('-')) return displayDate
  const parts = displayDate.split('/')
  if (parts.length === 2) {
    const [m, y] = parts
    return `${y}-${m}-01`
  }
  return ''
}

export const formatDbMoneyToDisplay = (dbValue: string | number | null | undefined): string => {
  if (dbValue === null || dbValue === undefined || dbValue === '') return '';
  if (typeof dbValue === 'string') {
    if (dbValue.includes(',')) {
      const parsedNumeric = parseFloat(dbValue.replace(/\./g, '').replace(',', '.'));
      if (isNaN(parsedNumeric)) return '';
      return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parsedNumeric);
    }
  }
  let asNum = typeof dbValue === 'string' ? Number(dbValue.replace(/[^0-9.-]+/g, "")) : dbValue;
  if (isNaN(asNum)) return '';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(asNum);
}

export const getWorkingDaysInCurrentMonth = (): number => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDay = new Date(year, month, d).getDay();
    // 0 = Sunday, 6 = Saturday
    if (currentDay !== 0 && currentDay !== 6) {
      workingDays++;
    }
  }
  return workingDays;
}

export const getInternScholarshipValue = async (hireDateUrlFormat: string | undefined, educationHistory: any[] | undefined) => {
  if (!hireDateUrlFormat || !educationHistory) return null;

  // Find current graduation period
  const graduacaoAtual = educationHistory.find(e => e.nivel === 'Graduação' && e.status === 'Cursando');
  if (!graduacaoAtual || !graduacaoAtual.semestre) return null;

  // extract number from semestre ("4º Período" -> 4)
  const periodoMatch = graduacaoAtual.semestre.match(/\d+/);
  if (!periodoMatch) return null;
  const periodoAtual = parseInt(periodoMatch[0]);

  // Calculate years of house
  const [day, month, year] = hireDateUrlFormat.split('/').map(Number);
  if (!day || !month || !year) return null;

  const hireDateObj = new Date(year, month - 1, day);
  const now = new Date();

  let anosDeCasa = now.getFullYear() - hireDateObj.getFullYear();
  const m = now.getMonth() - hireDateObj.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < hireDateObj.getDate())) {
    anosDeCasa--;
  }

  // Base ano_de_casa is at least 1 (e.g., first year is 1)
  anosDeCasa = anosDeCasa + 1;

  // Import dynamically here or at top (it's fine to use supabase here)
  const { supabase } = require('../../../lib/supabase');

  const { data, error } = await supabase
    .from('bolsa_estagio_rules')
    .select('*')
    .lte('ano_inicio', anosDeCasa)
    .gte('ano_fim', anosDeCasa)
    .lte('periodo_inicio', periodoAtual)
    .gte('periodo_fim', periodoAtual)
    .limit(1);

  if (error || !data || data.length === 0) return null;

  return data[0].valor_bolsa;
};

export const parseRoleTags = (raw: string | undefined | null): Record<string, string> => {
    if (!raw) return { general: '' };
    try {
        const trimmed = raw.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            return JSON.parse(trimmed);
        }
    } catch (e) {
        console.warn("Failed to parse role tags as JSON, falling back to general string", e);
    }
    return { general: raw };
};

export const stringifyRoleTags = (obj: Record<string, string>): string => {
    return JSON.stringify(obj);
};