import { Contract, TimelineEvent } from '../../../types/controladoria';
import { addDays, addMonths } from 'date-fns';

export const formatForInput = (val: string | number | undefined) => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (typeof val === 'string' && !val.includes('R$') && !val.includes('%') && !isNaN(parseFloat(val)) && val.trim() !== '') {
      return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return val;
};

export const ensureDateValue = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
};

export const localMaskCNJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
        .replace(/^(\d{7})(\d)/, '$1-$2')
        .replace(/^(\d{7}-\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2')
        .replace(/^(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2')
        .substring(0, 25);
};

// Função interna robusta para converter string BRL para float antes de salvar
export const safeParseFloat = (value: string | number | undefined | null): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    
    // Remove "R$", espaços, pontos de milhar e substitui vírgula por ponto
    const cleanStr = value.toString().replace(/[^\d,-]/g, '').replace(',', '.');
    const floatVal = parseFloat(cleanStr);
    
    return isNaN(floatVal) ? 0 : floatVal;
};

// HELPER ESSENCIAL: Garante que o valor seja um array, mesmo que venha como string JSON do banco ou formatado incorretamente
export const ensureArray = (val: any): string[] => {
    if (!val) return [];
    
    // Tratamento para arrays corrompidos (espalhados como caracteres)
    // Ex: ['[', '"', '2', ...]
    if (Array.isArray(val) && val.length > 0 && val.every(item => typeof item === 'string' && item.length === 1)) {
        try {
            const joined = val.join('');
            const parsed = JSON.parse(joined);
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === 'string') return [parsed];
            if (typeof parsed === 'number') return [String(parsed)];
        } catch { 
            // Se falhar o parse (ex: joined resultou em "2.1" ou "iii")
            const joined = val.join('').replace(/^"/, '').replace(/"$/, ''); // Limpa aspas do inicio e fim se existirem
            return [joined];
        }
    }

    if (Array.isArray(val)) return val;
    
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[')) {
            try { 
                const parsed = JSON.parse(trimmed); 
                if (Array.isArray(parsed)) return parsed;
                // Lidando com JSON string "duplamente" codificado: '"[\\"2.1\\"]"'
                if (typeof parsed === 'string' && parsed.trim().startsWith('[')) {
                    const doubleParsed = JSON.parse(parsed.trim());
                    if (Array.isArray(doubleParsed)) return doubleParsed;
                }
            } catch { return []; }
        }
    }
    return [];
};

export const getEffectiveDate = (status: string, fallbackDate: string, formData: Contract) => {
  let businessDateString = null;
  switch (status) {
    case 'analysis': businessDateString = formData.prospect_date; break;
    case 'proposal': businessDateString = formData.proposal_date; break;
    case 'active': businessDateString = formData.contract_date; break;
    case 'rejected': businessDateString = formData.rejection_date; break;
    case 'probono': businessDateString = formData.probono_date || formData.contract_date; break;
  }
  if (businessDateString) return new Date(businessDateString + 'T12:00:00');
  return new Date(fallbackDate);
};

export const getDurationBetween = (startDate: Date, endDate: Date) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  if (diffDays === 0) return 'Mesmo dia';
  return diffDays + ' dias';
};

export const getTotalDuration = (timelineData: TimelineEvent[], formData: Contract) => {
  if (timelineData.length === 0) return '0 dias';
  const latestEvent = timelineData[0];
  const oldestEvent = timelineData[timelineData.length - 1];
  const endDate = getEffectiveDate(latestEvent.new_status, latestEvent.changed_at, formData);
  const startDate = getEffectiveDate(oldestEvent.new_status, oldestEvent.changed_at, formData);
  return getDurationBetween(startDate, endDate);
};

export const getThemeBackground = (status: string) => {
  switch (status) {
    case 'analysis': return 'bg-yellow-50';
    case 'proposal': return 'bg-blue-50';
    case 'active': return 'bg-green-50';
    case 'rejected': return 'bg-red-50';
    default: return 'bg-gray-50';
  }
};