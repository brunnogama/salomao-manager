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
  const acronyms = ['clt', 'pj', 'cpf', 'rg', 'cnh', 'oab', 'rh', 'ti', 'ceo', 'cfo', 'pis', 'pasep', 'ctps'];
  return str.toLowerCase().split(' ').map(word => {
    if (romanNumerals.includes(word) || acronyms.includes(word)) return word.toUpperCase();
    return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
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
  let val = v.replace(/\D/g, '')
  val = val.replace(/(\d{8})(\d{1})/, '$1-$2') // Formato comum: 99999999-9
  return val.slice(0, 10)
}

export const maskPhone = (v: string) => {
  const raw = v.replace(/\D/g, '')
  if (raw.length <= 10) return raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').slice(0, 14)
  return raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15)
}

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