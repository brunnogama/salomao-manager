// src/components/collaborators/utils/presencialUtils.ts

import { MarcacaoPonto, RegistroDiario } from '../types/presencial'

// --- HELPER NORMALIZAÇÃO ---
export const normalizeKey = (text: string) => {
  if (!text) return ""
  return text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
}

// --- HELPER FORMATAÇÃO ---
export const toTitleCase = (text: string) => {
  if (!text) return ""
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// --- UTILS EXCEL ---
export const findValue = (row: any, keys: string[]) => {
  const rowKeys = Object.keys(row)
  for (const searchKey of keys) {
      const foundKey = rowKeys.find(k => normalizeKey(k) === normalizeKey(searchKey))
      if (foundKey) return row[foundKey]
  }
  return null
}

// --- HELPERS DE DATA ---
export const getFirstDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

export const getLastDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
}

// NOVAS FUNÇÕES PARA CONTROLE DE HORAS

export const formatarHora = (date: Date): string => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export const formatarDataBR = (date: Date): string => {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export const calcularTempoUtil = (
  entrada: Date, 
  saida: Date, 
  saidaAlmoco?: Date, 
  voltaAlmoco?: Date,
  intervalo1?: Date,
  intervalo2?: Date
): string => {
  let totalMinutos = Math.floor((saida.getTime() - entrada.getTime()) / (1000 * 60))
  
  // Desconta almoço
  if (saidaAlmoco && voltaAlmoco) {
    const almocoMinutos = Math.floor((voltaAlmoco.getTime() - saidaAlmoco.getTime()) / (1000 * 60))
    totalMinutos -= almocoMinutos
  }
  
  // Desconta intervalo adicional
  if (intervalo1 && intervalo2) {
    const intervaloMinutos = Math.floor((intervalo2.getTime() - intervalo1.getTime()) / (1000 * 60))
    totalMinutos -= intervaloMinutos
  }
  
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60
  
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

// Remove duplicatas de marcações no mesmo minuto
const removerDuplicatasPorMinuto = (marcacoes: MarcacaoPonto[]): MarcacaoPonto[] => {
  const mapa = new Map<string, MarcacaoPonto>()
  
  marcacoes.forEach(m => {
    const data = new Date(m.data_hora)
    const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}-${data.getHours()}-${data.getMinutes()}`
    
    if (!mapa.has(chave)) {
      mapa.set(chave, m)
    }
  })
  
  return Array.from(mapa.values())
}

export const processarMarcacoesDiarias = (marcacoes: MarcacaoPonto[]): RegistroDiario[] => {
  const registrosPorDia = new Map<string, MarcacaoPonto[]>()
  
  marcacoes.forEach(m => {
    const data = new Date(m.data_hora)
    const dataKey = `${normalizeKey(m.nome_colaborador)}_${formatarDataBR(data)}`
    
    if (!registrosPorDia.has(dataKey)) {
      registrosPorDia.set(dataKey, [])
    }
    registrosPorDia.get(dataKey)!.push(m)
  })
  
  const registros: RegistroDiario[] = []
  
  registrosPorDia.forEach((marcacoesDia, key) => {
    // Remove duplicatas por minuto
    const marcacoesSemDuplicatas = removerDuplicatasPorMinuto(marcacoesDia)
    
    const ordenadas = marcacoesSemDuplicatas.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
    const datas = ordenadas.map(m => new Date(m.data_hora))
    
    const colaborador = toTitleCase(ordenadas[0].nome_colaborador)
    const data = formatarDataBR(datas[0])
    const entrada = formatarHora(datas[0])
    
    let saida_almoco: string | undefined
    let volta_almoco: string | undefined
    let intervalo1: string | undefined
    let intervalo2: string | undefined
    let saida: string | undefined
    let saidas_extras: string[] = []
    let observacoes: string[] = []
    let tem_inconsistencia = false
    
    // Lógica baseada na quantidade de marcações
    if (datas.length === 2) {
      // Entrada + Saída
      saida = formatarHora(datas[1])
    } else if (datas.length === 3) {
      // Entrada + Saída Almoço + Saída (falta volta)
      saida_almoco = formatarHora(datas[1])
      saida = formatarHora(datas[2])
      observacoes.push('Falta volta do almoço')
      tem_inconsistencia = true
    } else if (datas.length === 4) {
      // Padrão: Entrada + Saída Almoço + Volta Almoço + Saída
      saida_almoco = formatarHora(datas[1])
      volta_almoco = formatarHora(datas[2])
      saida = formatarHora(datas[3])
    } else if (datas.length === 5) {
      // Falta uma marcação de intervalo
      saida_almoco = formatarHora(datas[1])
      volta_almoco = formatarHora(datas[2])
      intervalo1 = formatarHora(datas[3])
      saida = formatarHora(datas[4])
      observacoes.push('Falta retorno de intervalo')
      tem_inconsistencia = true
    } else if (datas.length === 6) {
      // Completo com intervalos: Entrada + Saída Almoço + Volta Almoço + Intervalo1 + Intervalo2 + Saída
      saida_almoco = formatarHora(datas[1])
      volta_almoco = formatarHora(datas[2])
      intervalo1 = formatarHora(datas[3])
      intervalo2 = formatarHora(datas[4])
      saida = formatarHora(datas[5])
      
      // Calcular tempo de intervalo
      const int1 = datas[3]
      const int2 = datas[4]
      const minutos = Math.floor((int2.getTime() - int1.getTime()) / (1000 * 60))
      observacoes.push(`Descontados ${minutos} minutos de intervalos`)
    } else if (datas.length > 6) {
      // Mais de 6 marcações - múltiplas saídas
      saida_almoco = formatarHora(datas[1])
      volta_almoco = formatarHora(datas[2])
      intervalo1 = formatarHora(datas[3])
      intervalo2 = formatarHora(datas[4])
      
      for (let i = 5; i < datas.length; i++) {
        if (i === datas.length - 1) {
          saida = formatarHora(datas[i])
        } else {
          saidas_extras.push(formatarHora(datas[i]))
        }
      }
      observacoes.push('Múltiplas marcações extras')
      tem_inconsistencia = true
    }
    
    if (!saida) {
      observacoes.push('Falta marcação de saída')
      tem_inconsistencia = true
    }
    
    if (saida_almoco && !volta_almoco && datas.length > 3) {
      observacoes.push('Não marcou volta almoço')
      tem_inconsistencia = true
    }
    
    if (!saida_almoco && volta_almoco) {
      observacoes.push('Não marcou saída almoço')
      tem_inconsistencia = true
    }
    
    let tempo_util = '00:00'
    if (saida) {
      const entradaDate = datas[0]
      const saidaDate = datas[datas.length - 1]
      const saidaAlmocoDate = saida_almoco && datas.length > 1 ? datas[1] : undefined
      const voltaAlmocoDate = volta_almoco && datas.length > 2 ? datas[2] : undefined
      const intervalo1Date = intervalo1 && datas.length > 3 ? datas[3] : undefined
      const intervalo2Date = intervalo2 && datas.length > 4 ? datas[4] : undefined
      
      tempo_util = calcularTempoUtil(entradaDate, saidaDate, saidaAlmocoDate, voltaAlmocoDate, intervalo1Date, intervalo2Date)
    }
    
    registros.push({
      colaborador,
      data,
      entrada,
      saida_almoco,
      volta_almoco,
      intervalo1,
      intervalo2,
      saida,
      saidas_extras,
      tempo_util,
      observacoes: observacoes.join(', ') || '-',
      tem_inconsistencia
    })
  })
  
  return registros.sort((a, b) => {
    const [diaA, mesA, anoA] = a.data.split('/')
    const [diaB, mesB, anoB] = b.data.split('/')
    const dataA = new Date(Number(anoA), Number(mesA) - 1, Number(diaA))
    const dataB = new Date(Number(anoB), Number(mesB) - 1, Number(diaB))
    
    if (a.colaborador !== b.colaborador) {
      return a.colaborador.localeCompare(b.colaborador)
    }
    return dataA.getTime() - dataB.getTime()
  })
}