/**
 * Dashboard Helper Functions - Manager Design System
 * Funções auxiliares para formatação e cálculos estratégicos do Business Intelligence
 */

/**
 * Formata valor monetário em Real Brasileiro (R$)
 * @param val - Valor numérico a ser formatado
 * @returns String formatada como moeda (ex: R$ 1.234,56)
 */
export const formatMoney = (val: number): string => 
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(val || 0);

/**
 * Formata valor monetário de forma compacta (notação Enterprise)
 * Útil para dashboards executivos e labels de gráficos
 * @param val - Valor numérico a ser formatado
 * @returns String formatada (ex: R$ 1.2M ou R$ 10K)
 */
export const formatCompact = (val: number): string => {
  const absVal = Math.abs(val || 0);
  
  // Notação para Escala de Milhões
  if (absVal >= 1000000) {
    return `R$ ${(val / 1000000).toFixed(1)}M`;
  } 
  
  // Notação para Escala de Milhares
  if (absVal >= 10000) {
    return `R$ ${(val / 1000).toFixed(0)}K`;
  }
  
  // Formato padrão para valores menores sem casas decimais
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(val || 0);
};

/**
 * Calcula a variação percentual (Delta) entre dois períodos
 * @param atual - Valor do período atual
 * @param anterior - Valor do período anterior para benchmark
 * @returns Percentual de variação
 */
export const calcDelta = (atual: number, anterior: number): number => {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
};

/**
 * Gera texto descritivo de performance baseado na tipografia Manager
 * @param delta - Percentual de variação
 * @param context - Contexto da métrica
 * @returns String em caixa alta para labels de tendência
 */
export const getTrendText = (delta: number, context: string): string => {
  const displayDelta = Math.abs(delta) > 999 ? '>999' : Math.abs(delta).toFixed(0);
  const contextUpper = context.toUpperCase();
  
  if (delta > 0) {
    return `EXPANSÃO DE ${displayDelta}% EM ${contextUpper}`;
  }
  
  if (delta < 0) {
    return `REDUÇÃO DE ${displayDelta}% EM ${contextUpper}`;
  }
  
  return `ESTABILIDADE EM ${contextUpper}`;
};

/**
 * Formata número cardinal puro (padrão métrico)
 * @param val - Valor numérico
 * @returns String formatada (ex: 1.234)
 */
export const formatNumber = (val: number): string => 
  new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(val || 0);

/**
 * Calcula representatividade percentual
 * @param parte - Valor do segmento
 * @param total - Valor do universo total
 * @returns Percentual (0-100)
 */
export const calcPercent = (parte: number, total: number): number => {
  if (total === 0) return 0;
  return (parte / total) * 100;
};

/**
 * Formata percentual com precisão customizada para o Manager UI
 * @param val - Valor do percentual
 * @param decimals - Casas decimais (padrão: 1)
 * @returns String formatada (ex: 45,5%)
 */
export const formatPercent = (val: number, decimals: number = 1): string => 
  `${val.toFixed(decimals).replace('.', ',')}%`;