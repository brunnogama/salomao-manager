import React, { useState, useEffect } from 'react';
import { 
  X, Edit, Trash2, User, FileText, Briefcase, MapPin, 
  History as HistoryIcon, Hourglass, CalendarCheck, Calculator, 
  Paperclip, CheckCircle2, Clock, ChevronsRight, Download,
  PieChart, Scale, Sparkles, Bot, Loader2, AlertCircle, ArrowLeft, ArrowRight
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { Contract, ContractProcess, ContractDocument } from '../../../types/controladoria';
import { useEscKey } from '../../../hooks/useEscKey';

// ROTA CORRIGIDA: Subindo 1 nível para sair de /contracts e entrar em /utils (ambos dentro de controladoria)
import { parseCurrency, safeDate } from '../utils/masks';

// Interface interna para os eventos construídos a partir das datas do formulário
interface InternalTimelineEvent {
  label: string;
  date: string; // YYYY-MM-DD
  status: string;
  color: string;
}

const ExpandableText = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div 
      className={`text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium bg-slate-50 border border-slate-100 p-3 rounded-lg cursor-pointer transition-all ${!expanded ? 'line-clamp-3' : ''}`}
      onClick={() => setExpanded(!expanded)}
      title={expanded ? "Clique para recolher" : "Clique para expandir (mostrar mais)"}
    >
      {text}
      {!expanded && text && text.length > 150 && (
        <span className="text-salomao-blue text-xs ml-1 font-bold">... (ver mais)</span>
      )}
    </div>
  );
};

const getDurationBetween = (startDateStr: string, endDateStr: string): string => {
  if (!startDateStr || !endDateStr) return '-';

  if (!startDateStr || !endDateStr) return '-';

  const start = safeDate(startDateStr);
  const end = safeDate(endDateStr);

  if (!start || !end) return '-';

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Mesmo dia';
  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return days > 0 ? `${months} meses e ${days} dias` : `${months} meses`;
  }
  return `${diffDays} dias`;
};

// Função auxiliar para formatar moeda apenas para exibição
const formatMoney = (val: number) => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onEdit: () => void;
  onDelete: () => void;
  processes: ContractProcess[];
  documents?: ContractDocument[];
  canEdit?: boolean;
  canDelete?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ContractDetailsModal({
  isOpen,
  onClose,
  contract,
  onEdit,
  onDelete,
  processes,
  documents = [],
  canEdit = false,
  canDelete = false,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}: Props) {
  useEscKey(isOpen, onClose);
  
  const [activeTab, setActiveTab] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [baixadoDate, setBaixadoDate] = useState<string | null>(null);
  const [loadingAiMap, setLoadingAiMap] = useState<Record<string, boolean>>({});
  const [localSummaries, setLocalSummaries] = useState<Record<string, string>>({});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchPaid = async () => {
      if (!contract?.id || !['active', 'baixado'].includes(contract.status)) {
        if (isMounted) setTotalPaid(0);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('financial_installments')
          .select('amount, paid_at')
          .eq('contract_id', contract.id)
          .eq('status', 'paid');
          
        if (!error && data && isMounted) {
          const sum = data.reduce((acc, curr) => acc + Number(curr.amount), 0);
          setTotalPaid(sum);

          if (contract.status === 'baixado' && data.length > 0) {
             const dates = data.map(i => i.paid_at).filter(Boolean).sort();
             if (dates.length > 0) {
               setBaixadoDate(dates[dates.length - 1]);
             }
          }
        }
      } catch (err) {}
    };
    
    if (isOpen) {
      setActiveTab(0); // reset tab on open
      fetchPaid();
    }
    
    return () => { isMounted = false; };
  }, [contract, isOpen]);

  if (!isOpen || !contract) return null;

  const handleDownload = async (e: React.MouseEvent, doc: ContractDocument) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase.storage.from('ged-documentos').download(doc.file_path);
      if (error) throw error;
      
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name || 'documento.pdf';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erro ao gerar link de download.');
      }
    } catch (error: any) {
      alert('Erro ao baixar documento: ' + error.message);
    }
  };

  const handleDownloadLatest = (e: React.MouseEvent) => {
    if (documents && documents.length > 0) {
      handleDownload(e, documents[0]);
    }
  };

  const handleGenerateSummary = async (process: ContractProcess) => {
    setLoadingAiMap(prev => ({ ...prev, [process.process_number]: true }));
    setLocalErrors(prev => ({ ...prev, [process.process_number]: '' }));
    try {
      const { data, error } = await supabase.functions.invoke('resumir-processo-tj', {
        body: {
          processNumber: process.process_number,
          contractProcessId: process.id
        }
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido na IA ao contatar o CNJ');
      
      const summaryText = data.summary;
      setLocalSummaries(prev => ({ ...prev, [process.process_number]: summaryText }));
      
    } catch (err: any) {
      setLocalErrors(prev => ({ ...prev, [process.process_number]: err.message }));
    } finally {
      setLoadingAiMap(prev => ({ ...prev, [process.process_number]: false }));
    }
  }

  // 1. CONSTRUÇÃO DA TIMELINE BASEADA NAS DATAS INTERNAS
  const buildInternalTimeline = (): InternalTimelineEvent[] => {
    const events: InternalTimelineEvent[] = [];

    if (contract.prospect_date) {
      events.push({ label: 'Sob Análise', date: contract.prospect_date, status: 'analysis', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' });
    }
    if (contract.proposal_date) {
      events.push({ label: 'Proposta Enviada', date: contract.proposal_date, status: 'proposal', color: 'bg-blue-100 text-blue-800 border-blue-200' });
    }
    if (contract.contract_date) {
      events.push({ label: 'Contrato Fechado', date: contract.contract_date, status: 'active', color: 'bg-green-100 text-green-800 border-green-200' });
    }
    if (contract.rejection_date) {
      events.push({ label: 'Rejeitado', date: contract.rejection_date, status: 'rejected', color: 'bg-red-100 text-red-800 border-red-200' });
    }
    if (contract.probono_date) {
      events.push({ label: 'Probono', date: contract.probono_date, status: 'probono', color: 'bg-purple-100 text-purple-800 border-purple-200' });
    }
    if (contract.status === 'baixado') {
      events.push({ label: 'Baixado', date: baixadoDate || contract.updated_at || new Date().toISOString(), status: 'baixado', color: 'bg-purple-100 text-purple-800 border-purple-200' });
    }

    return events.sort((a, b) => {
      const dateA = safeDate(a.date)?.getTime() || 0;
      const dateB = safeDate(b.date)?.getTime() || 0;
      return dateA - dateB;
    });
  };

  const timelineEvents = buildInternalTimeline();

  const getTotalDuration = () => {
    if (timelineEvents.length < 2) return '0 dias';
    const first = timelineEvents[0];
    const last = timelineEvents[timelineEvents.length - 1];
    return getDurationBetween(first.date, last.date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'proposal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'probono': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'baixado': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: any = { analysis: 'Sob Análise', proposal: 'Proposta Enviada', active: 'Contrato Fechado', rejected: 'Rejeitada', probono: 'Probono', baixado: 'Baixado' };
    return map[status] || status;
  };
  
  const getRelevantDateStr = () => {
    switch (contract.status) {
      case 'analysis': return contract.prospect_date || contract.created_at;
      case 'proposal': return contract.proposal_date || contract.created_at;
      case 'active': return contract.contract_date || contract.created_at;
      case 'baixado': return baixadoDate || contract.updated_at || contract.contract_date || contract.created_at;
      case 'rejected': return contract.rejection_date || contract.created_at;
      case 'probono': return contract.probono_date || contract.contract_date || contract.created_at;
      default: return contract.created_at;
    }
  };

  const getHonOrPropStr = () => {
    if (contract.status === 'proposal') return contract.proposal_code ? `Cód: ${contract.proposal_code}` : '-';
    if (contract.status === 'active') {
      if (!contract.hon_number) return '-';
      return contract.hon_number.toUpperCase().startsWith('HON') ? contract.hon_number : `HON - ${contract.hon_number}`;
    }
    return contract.hon_number ? `HON: ${contract.hon_number}` : (contract.proposal_code ? `Cód: ${contract.proposal_code}` : '-');
  };

  // --- LÓGICA DE CÁLCULO FINANCEIRO ---
  const calculateFinancials = () => {
    const isFinancialRelevant = ['proposal', 'active', 'baixado'].includes(contract.status);

    const formatGroupTotal = (valuesArr: (string | undefined)[], fallbackNumber: number) => {
      const validStrings = valuesArr.filter(v => v && parseCurrency(v) > 0);
      if (validStrings.length === 0) return formatMoney(0);

      const allPercent = validStrings.every(v => typeof v === 'string' && v.includes('%'));
      const allUSD = validStrings.every(v => typeof v === 'string' && v.includes('US$'));
      const allEUR = validStrings.every(v => typeof v === 'string' && v.includes('€'));

      if (allPercent) {
        const sum = validStrings.reduce((acc, v) => acc + parseCurrency(v!), 0);
        return sum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
      }

      if (allUSD) {
        const sumUsd = validStrings.reduce((acc, v) => {
          const part = v!.split(' | ')[0];
          const clean = part.replace(/[^\d,\-]/g, '').replace(',', '.');
          const val = parseFloat(clean);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        return 'US$ ' + sumUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      if (allEUR) {
        const sumEur = validStrings.reduce((acc, v) => {
          const part = v!.split(' | ')[0];
          const clean = part.replace(/[^\d,\-]/g, '').replace(',', '.');
          const val = parseFloat(clean);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        return '€ ' + sumEur.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      return formatMoney(fallbackNumber);
    };

    const proLaboreBase = parseCurrency(contract.pro_labore);
    const proLaboreExtrasList = (contract as any).pro_labore_extras;
    const proLaboreExtrasTotal = (Array.isArray(proLaboreExtrasList) ? proLaboreExtrasList : []).reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalProLabore = proLaboreBase + proLaboreExtrasTotal;
    const formattedProLabore = formatGroupTotal([contract.pro_labore, ...(Array.isArray(proLaboreExtrasList) ? proLaboreExtrasList : [])], totalProLabore);

    const intermediateList = contract.intermediate_fees;
    const intermediateTotal = (Array.isArray(intermediateList) ? intermediateList : []).reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const formattedIntermediate = formatGroupTotal(Array.isArray(intermediateList) ? intermediateList : [], intermediateTotal);

    const finalFeeBase = parseCurrency(contract.final_success_fee);
    const finalFeeExtrasList = (contract as any).final_success_extras;
    const finalFeeExtrasTotal = (Array.isArray(finalFeeExtrasList) ? finalFeeExtrasList : []).reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalFinalFee = finalFeeBase + finalFeeExtrasTotal;
    const formattedFinalFee = formatGroupTotal([contract.final_success_fee, ...(Array.isArray(finalFeeExtrasList) ? finalFeeExtrasList : [])], totalFinalFee);

    const otherFeesBase = parseCurrency(contract.other_fees);
    const otherFeesExtrasList = (contract as any).other_fees_extras;
    const otherFeesExtrasTotal = (Array.isArray(otherFeesExtrasList) ? otherFeesExtrasList : []).reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalOtherFees = otherFeesBase + otherFeesExtrasTotal;
    const formattedOtherFees = formatGroupTotal([contract.other_fees, ...(Array.isArray(otherFeesExtrasList) ? otherFeesExtrasList : [])], totalOtherFees);

    const fixedMonthlyBase = parseCurrency(contract.fixed_monthly_fee);
    const fixedMonthlyExtrasList = (contract as any).fixed_monthly_extras;
    const fixedMonthlyExtrasTotal = (Array.isArray(fixedMonthlyExtrasList) ? fixedMonthlyExtrasList : []).reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalFixedMonthly = fixedMonthlyBase + fixedMonthlyExtrasTotal;
    const formattedFixedMonthly = formatGroupTotal([contract.fixed_monthly_fee, ...(Array.isArray(fixedMonthlyExtrasList) ? fixedMonthlyExtrasList : [])], totalFixedMonthly);

    const grandTotal = totalProLabore + intermediateTotal + totalFinalFee + totalOtherFees + totalFixedMonthly;
    
    const lackToPay = grandTotal - totalPaid;

    return {
      showTotals: isFinancialRelevant,
      totalProLabore,
      totalFinalFee,
      intermediateTotal,
      totalOtherFees,
      totalFixedMonthly,
      formattedProLabore,
      formattedIntermediate,
      formattedFinalFee,
      formattedOtherFees,
      formattedFixedMonthly,
      grandTotal,
      lackToPay: lackToPay > 0 ? lackToPay : 0,

      hasProLaboreExtras: proLaboreExtrasTotal > 0,
      hasFinalFeeExtras: finalFeeExtrasTotal > 0,
      hasOtherFeesExtras: otherFeesExtrasTotal > 0,
      hasFixedMonthlyExtras: fixedMonthlyExtrasTotal > 0,
      hasIntermediate: intermediateTotal > 0,

      hasFixed: totalFixedMonthly > 0,
      hasOther: totalOtherFees > 0
    };
  };

  const financials = calculateFinancials();

  const validPercentExtras = ((contract as any).percent_extras && Array.isArray((contract as any).percent_extras)) 
    ? (contract as any).percent_extras.filter((v: string) => v && v.trim() !== '') 
    : [];
  const hasPercent = Boolean(contract.final_success_percent) || validPercentExtras.length > 0;

  const steps = [
    { id: 0, label: 'Resumo', icon: PieChart },
    { id: 1, label: 'Dados do Cliente', icon: Briefcase },
    { id: 2, label: 'Status & Valores', icon: Clock },
    { id: 3, label: 'Dados do Objeto', icon: Scale },
    { id: 4, label: 'GED (Arquivos)', icon: FileText }
  ];

  /* 
    Seção Reutilizável de Timeline e Cálculos de Timeline 
  */
  const renderTimeline = () => (
    <div className="mt-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-thin">
      <div className="flex justify-between items-center mb-4 min-w-[500px]">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
          <HistoryIcon className="w-4 h-4 mr-2" /> Timeline das Fases
        </h3>
      </div>

      {timelineEvents.length > 0 ? (
        <div className="relative w-full pb-2 min-w-[500px] px-8">
          <div className="flex items-start justify-between w-full relative z-10">
            {timelineEvents.map((event, idx) => {
              const isLast = idx === timelineEvents.length - 1;
              const nextEvent = !isLast ? timelineEvents[idx + 1] : null;
              const durationToNext = nextEvent
                ? getDurationBetween(event.date, nextEvent.date)
                : null;
              const isCurrent = event.status === contract.status;

              return (
                <div key={idx} className="flex flex-col items-center relative flex-1 text-center group">
                  {/* Top Node Row with Lines */}
                  <div className="relative w-full flex justify-center items-center h-8">
                     {!isLast && (
                        <div className="absolute left-1/2 top-1/2 w-full h-[2px] bg-gray-200 -z-10 -translate-y-1/2"></div>
                     )}
                     <div className={`w-7 h-7 rounded-full border-[3px] border-white flex items-center justify-center shrink-0 z-10 relative shadow-sm transition-colors ${isCurrent ? 'bg-salomao-blue shadow-salomao-blue/30 ring-2 ring-salomao-blue/20' : 'bg-gray-300'}`}>
                       <div className="w-2 h-2 rounded-full bg-white"></div>
                     </div>
                  </div>
                  
                  {/* Label and Date */}
                  <div className="mt-3 flex flex-col items-center justify-center z-10 min-w-max">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5 border bg-white ${event.color} ${isCurrent ? 'ring-1 ring-black/5' : ''}`}>
                      {event.label}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 bg-white px-1">
                      <CalendarCheck className="w-3 h-3 text-gray-400" />
                      {safeDate(event.date)?.toLocaleDateString('pt-BR') || '-'}
                    </span>
                  </div>

                  {/* Duration to next */}
                  {!isLast && durationToNext && (
                    <div className="absolute top-[75px] left-1/2 w-full flex justify-center z-0 pointer-events-none">
                       <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap bg-white px-2">
                         ({durationToNext})
                       </span>
                    </div>
                  )}

                  {/* Current Active Total Duration */}
                  {isLast && event.status === 'active' && getTotalDuration() && (
                    <div className="absolute top-[75px] left-0 w-full flex justify-center z-0 pointer-events-none">
                       <span className="text-[10px] font-bold text-green-600/80 whitespace-nowrap bg-white px-2">
                         (Total: {getTotalDuration()})
                       </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
          Nenhuma data interna preenchida.
        </div>
      )}
    </div>
  );

  const renderFinancials = () => {
    if (!financials.showTotals) return null;

    const renderDetailItem = (
      clause: string | undefined,
      _feeType: string,
      val: string | undefined | null,
      installment: string | undefined,
      ready: boolean | undefined,
      rule: string | undefined,
      colorTheme: 'gray' | 'blue' | 'green' | 'yellow'
    ) => {
      if (!val) return null;
      
      const titleParts = [
        clause ? clause : null,
        val,
        installment ? installment : '1x'
      ].filter(Boolean).join(' - ');

      const colors = {
        gray: { bg: 'bg-white', border: 'border-gray-100', text: 'text-gray-700', ruleBg: 'bg-gray-50', ruleText: 'text-gray-500' },
        blue: { bg: 'bg-white', border: 'border-blue-100', text: 'text-blue-800', ruleBg: 'bg-blue-50/50', ruleText: 'text-blue-600/80' },
        green: { bg: 'bg-white', border: 'border-green-100', text: 'text-green-800', ruleBg: 'bg-green-50/50', ruleText: 'text-green-700/80' },
        yellow: { bg: 'bg-white', border: 'border-yellow-100', text: 'text-yellow-900', ruleBg: 'bg-yellow-50/50', ruleText: 'text-yellow-800/80' }
      };
      const t = colors[colorTheme];

      return (
        <div className={`text-xs flex flex-col ${t.bg} p-2 rounded border ${t.border} mt-1 shadow-sm`}>
          <div className="flex justify-between items-start">
             <span className={`font-semibold ${t.text}`}>{titleParts}</span>
             {ready && <span className="text-[8px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wider">Faturar</span>}
          </div>
          {rule && <span className={`text-[10px] ${t.ruleText} italic mt-1 ${t.ruleBg} p-1.5 rounded`}>{rule}</span>}
        </div>
      );
    };

    return (
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Resumo Financeiro</h3>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Box 1: Valores das Fases */}
           <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
             <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                Detalhes das Fases e Honorários
             </div>
             <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
               {financials.totalProLabore > 0 && (
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Pró-Labore (Total)</span>
                       <span className="text-sm font-black text-gray-800">{financials.formattedProLabore}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {parseCurrency(contract.pro_labore) > 0 && (
                          renderDetailItem(contract.pro_labore_clause, 'Pró-labore', contract.pro_labore, contract.pro_labore_installments, contract.pro_labore_ready, contract.pro_labore_rule, 'gray')
                      )}
                      {(contract as any).pro_labore_extras && Array.isArray((contract as any).pro_labore_extras) && (contract as any).pro_labore_extras.map((val: string, idx: number) => {
                         const rule = (contract as any).pro_labore_extras_rules?.[idx];
                         const ready = (contract as any).pro_labore_extras_ready?.[idx];
                         const clause = (contract as any).pro_labore_extras_clauses?.[idx];
                         const inst = (contract as any).pro_labore_extras_installments?.[idx];
                         if (parseCurrency(val) === 0) return null;
                         return <React.Fragment key={idx}>{renderDetailItem(clause, 'Pró-labore', val, inst, ready, rule, 'gray')}</React.Fragment>;
                      })}
                    </div>
                 </div>
               )}

               {financials.intermediateTotal > 0 && (
                 <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center border-b border-blue-200 pb-2 mb-2">
                       <span className="text-[10px] font-bold text-blue-700 uppercase">Ex. Intermediário (Total)</span>
                       <span className="text-sm font-black text-blue-900">{financials.formattedIntermediate}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {contract.intermediate_fees && Array.isArray(contract.intermediate_fees) && contract.intermediate_fees.map((val: string, idx: number) => {
                         const rule = (contract as any).intermediate_fees_rules?.[idx];
                         const ready = (contract as any).intermediate_fees_ready?.[idx];
                         const clause = (contract as any).intermediate_fees_clauses?.[idx];
                         const inst = (contract as any).intermediate_fees_installments?.[idx];
                         if (parseCurrency(val) === 0) return null;
                         return <React.Fragment key={idx}>{renderDetailItem(clause, 'Êxito Intermediário', val, inst, ready, rule, 'blue')}</React.Fragment>;
                      })}
                    </div>
                 </div>
               )}

               {financials.totalFinalFee > 0 && (
                 <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center border-b border-green-200 pb-2 mb-2">
                       <span className="text-[10px] font-bold text-green-800 uppercase">Êxito Final (Total)</span>
                       <span className="text-sm font-black text-green-900">{financials.formattedFinalFee}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {parseCurrency(contract.final_success_fee) > 0 && (
                          renderDetailItem(contract.final_success_fee_clause, 'Êxito Final', contract.final_success_fee, contract.final_success_fee_installments, contract.final_success_ready, contract.final_success_fee_rule, 'green')
                      )}
                      {(contract as any).final_success_extras && Array.isArray((contract as any).final_success_extras) && (contract as any).final_success_extras.map((val: string, idx: number) => {
                         const rule = (contract as any).final_success_extras_rules?.[idx];
                         const ready = (contract as any).final_success_extras_ready?.[idx];
                         const clause = (contract as any).final_success_extras_clauses?.[idx];
                         const inst = (contract as any).final_success_extras_installments?.[idx];
                         if (parseCurrency(val) === 0) return null;
                         return <React.Fragment key={idx}>{renderDetailItem(clause, 'Êxito Final', val, inst, ready, rule, 'green')}</React.Fragment>;
                      })}
                    </div>
                 </div>
               )}

               {financials.totalFixedMonthly > 0 && (
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Fixo Mensal (Total)</span>
                       <span className="text-sm font-black text-gray-800">{financials.formattedFixedMonthly}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {parseCurrency(contract.fixed_monthly_fee) > 0 && (
                          renderDetailItem(contract.fixed_monthly_fee_clause, 'Fixo Mensal', contract.fixed_monthly_fee, contract.fixed_monthly_fee_installments, contract.fixed_monthly_ready, contract.fixed_monthly_fee_rule, 'gray')
                      )}
                      {(contract as any).fixed_monthly_extras && Array.isArray((contract as any).fixed_monthly_extras) && (contract as any).fixed_monthly_extras.map((val: string, idx: number) => {
                         const rule = (contract as any).fixed_monthly_extras_rules?.[idx];
                         const ready = (contract as any).fixed_monthly_extras_ready?.[idx];
                         const clause = (contract as any).fixed_monthly_extras_clauses?.[idx];
                         const inst = (contract as any).fixed_monthly_extras_installments?.[idx];
                         if (parseCurrency(val) === 0) return null;
                         return <React.Fragment key={idx}>{renderDetailItem(clause, 'Fixo Mensal', val, inst, ready, rule, 'gray')}</React.Fragment>;
                      })}
                    </div>
                 </div>
               )}

               {financials.totalOtherFees > 0 && (
                 <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Outros Honorários (Total)</span>
                       <span className="text-sm font-black text-gray-800">{financials.formattedOtherFees}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {parseCurrency(contract.other_fees) > 0 && (
                          renderDetailItem(contract.other_fees_clause, 'Outros Honorários', contract.other_fees, contract.other_fees_installments, contract.other_fees_ready, contract.other_fees_rule, 'gray')
                      )}
                      {(contract as any).other_fees_extras && Array.isArray((contract as any).other_fees_extras) && (contract as any).other_fees_extras.map((val: string, idx: number) => {
                         const rule = (contract as any).other_fees_extras_rules?.[idx];
                         const ready = (contract as any).other_fees_extras_ready?.[idx];
                         const clause = (contract as any).other_fees_extras_clauses?.[idx];
                         const inst = (contract as any).other_fees_extras_installments?.[idx];
                         if (parseCurrency(val) === 0) return null;
                         return <React.Fragment key={idx}>{renderDetailItem(clause, 'Outros Honorários', val, inst, ready, rule, 'gray')}</React.Fragment>;
                      })}
                    </div>
                 </div>
               )}
               
               {/* Exibir Extras de Percentual se houver */}
               {hasPercent && (
                 <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center border-b border-yellow-200 pb-2 mb-2">
                       <span className="text-[10px] font-bold text-yellow-800 uppercase">Valores em %</span>
                    </div>
                    <div className="flex flex-col gap-2 mt-1">
                      {contract.final_success_percent && (
                          renderDetailItem(contract.final_success_percent_clause, 'Valores em %', contract.final_success_percent, '1x', contract.final_success_percent_ready, contract.final_success_percent_rule, 'yellow')
                      )}
                      {validPercentExtras.map((val: string, idx: number) => {
                         const rule = (contract as any).percent_extras_rules?.[idx];
                         const ready = (contract as any).percent_extras_ready?.[idx];
                         const clause = (contract as any).percent_extras_clauses?.[idx];
                         return <React.Fragment key={idx}>{renderDetailItem(clause, 'Valores em %', val, '1x', ready, rule, 'yellow')}</React.Fragment>;
                      })}
                    </div>
                 </div>
               )}
             </div>
           </div>

           {/* Box 2: Totais e Pagamentos */}
           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
             <div className="bg-[#1e3a8a] px-4 py-3 text-xs font-bold text-white uppercase text-center">
                Saldo e Totais
             </div>
             <div className="p-4 flex-1 flex flex-col gap-4">
               <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total do Contrato</p>
                  <p className="text-2xl font-black text-[#0a192f] mt-1">{formatMoney(financials.grandTotal)}</p>
               </div>
               
               {['active', 'baixado'].includes(contract.status) && (
                 <>
                   <div className="h-px bg-gray-100 w-full" />
                   <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                     <span className="text-xs font-bold text-gray-600">Total Pago:</span>
                     <span className="text-sm font-bold text-green-600">{formatMoney(totalPaid)}</span>
                   </div>
                   <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg border border-red-100">
                     <span className="text-xs font-bold text-red-600">Falta Quitar:</span>
                     <span className="text-sm font-bold text-red-700">{formatMoney(financials.lackToPay)}</span>
                   </div>
                 </>
               )}
             </div>
           </div>

         </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-[95vw] xl:max-w-[1300px] h-[95vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 relative">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-72 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col py-4 md:py-8 px-4 md:px-5 shrink-0 z-10">
          <div className="mb-4 md:mb-8 px-2 flex justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-black text-[#0a192f] tracking-tight leading-tight">
                Detalhes do Caso
              </h2>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                ID: {contract.display_id || String(contract.seq_id || 0).padStart(6, '0')}
              </p>
            </div>
            {/* Mobile close button */}
            <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 w-full flex-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 custom-scrollbar">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeTab === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(step.id)}
                  className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-4 py-2.5 md:p-3.5 rounded-xl transition-all text-left relative group ${isActive
                    ? 'text-[#1e3a8a] bg-white font-bold shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
                    }`}
                >
                  <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-[#1e3a8a]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.1em] font-bold whitespace-nowrap">{step.label}</span>
                  {isActive && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#1e3a8a] rounded-r-full" />}
                  {isActive && <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#1e3a8a] rounded-t-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white transition-colors duration-300">
          
          {/* Header Action Bar */}
          <div className="px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(contract.status)}`}>
                {getStatusLabel(contract.status)}
              </span>
              <span className="font-mono text-sm font-bold text-gray-800 bg-gray-50 border border-gray-200 px-3 py-1 rounded-md">
                {getHonOrPropStr()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 mr-2 border border-gray-100">
                <button 
                  onClick={onPrev} 
                  disabled={!hasPrev}
                  className={`p-1.5 rounded-md flex items-center justify-center transition-all ${hasPrev ? 'text-gray-600 hover:bg-white hover:shadow-sm' : 'text-gray-300 cursor-not-allowed'}`}
                  title="Caso Anterior"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={onNext} 
                  disabled={!hasNext}
                  className={`p-1.5 rounded-md flex items-center justify-center transition-all ${hasNext ? 'text-gray-600 hover:bg-white hover:shadow-sm' : 'text-gray-300 cursor-not-allowed'}`}
                  title="Próximo Caso"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" title="Fechar">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-2 md:px-10 md:py-4 custom-scrollbar">
            
            {/* ABA 0: RESUMO */}
            {activeTab === 0 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                {/* Cabeçalho Executivo do Resumo */}
                <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-2xl font-black text-[#0a192f] tracking-tight">{contract.client_name}</h2>
                      <div className="flex items-center text-sm mt-2 text-gray-600 font-medium">
                        <User className="w-4 h-4 mr-1.5" />
                        {contract.partner_name || '-'}
                        {contract.co_partner_ids && contract.co_partner_ids.length > 0 && <span className="ml-1 text-xs text-gray-400 font-normal"> (+{contract.co_partner_ids.length} sócio(s))</span>}
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end justify-center">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Data do Status Atual</p>
                      <div className="flex items-center text-lg font-bold text-[#1e3a8a]">
                        <CalendarCheck className="w-5 h-5 mr-2" />
                        {safeDate(getRelevantDateStr())?.toLocaleDateString('pt-BR') || '-'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Observações Gerais */}
                  {contract.observations && (
                    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 gap-4">
                      <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center">
                           <FileText className="w-3 h-3 mr-1.5" /> Observações Gerais
                         </p>
                         <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">{contract.observations}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Área Financeira (apenas Fechado/Ativo ou Proposta) */}
                {renderFinancials()}

                {/* Sub-lista de Objetos do Resumo */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Objetos da Ação (Resumo)</h3>
                  {(!processes || processes.length === 0) ? (
                    <p className="text-sm text-gray-400 italic">Nenhum processo vinculado.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {processes.map((proc, idx) => {
                        const summaryContent = localSummaries[proc.process_number] || proc.ia_summary || proc.subject || 'Nenhum resumo ou objeto informado.';
                        return (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                              <div className="font-mono font-bold text-salomao-blue text-xs flex items-center">
                                <Scale className="w-4 h-4 mr-2" />
                                {proc.process_number}
                              </div>
                              <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider text-right">
                                {proc.court || '-'} • {proc.uf || '-'} • {proc.vara || '-'}
                              </div>
                            </div>
                            
                            <ExpandableText text={summaryContent} />
                            
                            <div className="text-[10px] text-gray-500 flex items-center">
                              Parte Adversa: <strong className="ml-1 text-gray-700">{proc.opponent || '-'}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {renderTimeline()}
              </div>
            )}

            {/* ABA 1: DADOS DO CLIENTE */}
            {activeTab === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Dados do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Documento (CNPJ/CPF)</label>
                      <div className="text-gray-800 font-mono font-bold mt-1 text-base">{contract.cnpj || 'Não informado'}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Nome do Cliente</label>
                      <div className="text-gray-800 font-bold mt-1 text-base">{contract.client_name}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Área do Direito</label>
                      <div className="flex items-center gap-2 mt-1 text-gray-800 font-medium">
                        <Briefcase className="w-4 h-4 text-salomao-blue" /> {contract.area || '-'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Responsável Principal</label>
                      <div className="flex items-center gap-2 mt-1 text-gray-800 font-medium">
                        <User className="w-4 h-4 text-salomao-blue" /> {contract.partner_name || '-'}
                      </div>
                    </div>
                    {contract.co_partner_ids && contract.co_partner_ids.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Sócios Adicionais</label>
                        <div className="mt-1 text-sm font-medium text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                          Quantidade: {contract.co_partner_ids.length} sócio(s) adicional(is)
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Localidade</label>
                      <div className="flex items-center gap-2 mt-1 text-gray-800 font-medium">
                        <MapPin className="w-4 h-4 text-gray-500" /> {contract.uf || '-'} {contract.billing_location ? `(Faturamento: ${contract.billing_location})` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: STATUS & VALORES */}
            {activeTab === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Status & Condições</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-xs text-gray-400 block">Status Atual</label>
                    <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border bg-white border-gray-200">
                      {getStatusLabel(contract.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block">Analista</label>
                    <div className="font-medium text-gray-800 mt-2">{contract.analyzed_by_name || '-'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block">Assinatura Física?</label>
                    <div className="font-medium text-gray-800 mt-2">
                      {contract.physical_signature === true ? 'Sim' : contract.physical_signature === false ? 'Não' : '-'}
                    </div>
                  </div>
                  {(contract as any).reference_text && (
                    <div className="lg:col-span-4">
                      <label className="text-xs text-gray-400 block">Referência</label>
                      <div className="font-medium text-gray-800 mt-2">{contract.reference || (contract as any).reference_text}</div>
                    </div>
                  )}
                  {contract.observations && (
                    <div className="lg:col-span-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <label className="text-xs text-gray-500 block font-bold mb-2">Observações Adicionais</label>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{contract.observations}</div>
                    </div>
                  )}
                </div>
                {renderFinancials()}
                {renderTimeline()}
              </div>
            )}

            {/* ABA 3: DADOS DO OBJETO */}
            {activeTab === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Processos / Objetos ({processes.length})</h3>
                {(!processes || processes.length === 0) ? (
                  <p className="text-sm text-gray-400 italic">Nenhum processo detalhado vinculado a este caso.</p>
                ) : (
                  <div className="space-y-4">
                     {processes.map((proc, idx) => {
                       const summaryToShow = localSummaries[proc.process_number] || proc.ia_summary;
                       const aiError = localErrors[proc.process_number];
                       const isGenerating = loadingAiMap[proc.process_number] || false;
                       
                       return (
                        <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                          <div className="flex flex-wrap gap-4 justify-between border-b border-gray-50 pb-3">
                            <div>
                               <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Número do Processo</label>
                               <div className="font-mono font-bold text-salomao-blue text-base">{proc.process_number}</div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="text-right">
                                 <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Localização</label>
                                 <div className="font-medium text-gray-700 text-sm">
                                    {proc.court || '-'} • {proc.uf || '-'} • {proc.vara || '-'}
                                 </div>
                               </div>
                               <div className="h-8 w-px bg-gray-200" />
                               <button 
                                 onClick={() => handleGenerateSummary(proc)}
                                 disabled={isGenerating}
                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                               >
                                 {isGenerating ? (
                                   <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                 ) : (
                                   <Sparkles className="w-4 h-4 text-indigo-500 group-hover:text-indigo-700" />
                                 )}
                                 {summaryToShow ? 'Atualizar com IA' : 'Resumo IA'}
                               </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Parte Adversa</label>
                              <div className="font-bold text-gray-800 text-sm mt-1">{proc.opponent || 'Não informada'}</div>
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Posição Cliente</label>
                              <div className="font-medium text-gray-800 text-sm mt-1">{proc.client_name || contract.client_position || '-'}</div>
                            </div>
                          </div>
                          
                          {/* Bloco de Resumo IA Expandido */}
                          {(summaryToShow || isGenerating || aiError) && (
                            <div className={`mt-2 p-4 rounded-xl border shadow-inner relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${aiError ? 'bg-red-50/50 border-red-100' : 'bg-gradient-to-br from-slate-50 to-indigo-50/20 border-indigo-100/50'}`}>
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg shrink-0 shadow-sm mt-0.5 relative z-10 ${aiError ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                  {aiError ? <AlertCircle className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 relative z-10">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className={`text-xs font-black uppercase tracking-wider border-b pb-1 w-full flex items-center gap-2 ${aiError ? 'text-red-900 border-red-200/50' : 'text-indigo-900 border-indigo-200/50'}`}>
                                      {aiError ? 'Erro ao Gerar Resumo' : 'Resumo Gerado (Datajud + ChatGPT)'}
                                      {isGenerating && <span className="text-[10px] font-bold text-indigo-500 lowercase bg-indigo-100 px-2 py-0.5 rounded-full animate-pulse">lendo...</span>}
                                    </h4>
                                  </div>
                                  {aiError ? (
                                    <div className="text-sm text-red-700 leading-relaxed font-medium">
                                      {aiError}
                                    </div>
                                  ) : (
                                    <div className={`text-sm text-slate-700 whitespace-pre-wrap leading-relaxed ${isGenerating ? 'opacity-40' : 'opacity-100'} transition-opacity`}>
                                      {isGenerating ? 'Consultando Tribunal de Justiça via API e enviando andamentos cruciais para análise da IA...' : summaryToShow}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {!aiError && (
                                <div className="absolute -bottom-2 -right-2 text-indigo-200/30">
                                  <Sparkles className="w-24 h-24" />
                                </div>
                              )}
                            </div>
                          )}
                          
                        </div>
                     );
                     })}
                  </div>
                )}
              </div>
            )}

            {/* ABA 4: GED (Arquivos) */}
            {activeTab === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-black/5 pb-2">Gestão Eletrônica de Documentos</h3>
                {documents.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                     <Paperclip className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                     <p className="text-sm text-gray-500 font-medium">Nenhum documento anexado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col justify-between group hover:border-salomao-blue transition-colors">
                         <div className="flex items-start gap-3 mb-4">
                           <div className="p-2 bg-blue-50 text-salomao-blue rounded-lg">
                             <FileText className="w-5 h-5" />
                           </div>
                           <div className="min-w-0 flex-1">
                             <p className="text-xs font-bold text-gray-800 truncate" title={doc.file_name}>{doc.file_name}</p>
                             <p className="text-[10px] text-gray-400 mt-1 uppercase">{doc.file_type || 'Documento'}</p>
                           </div>
                         </div>
                         <button 
                           onClick={(e) => handleDownload(e, doc)} 
                           className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-salomao-blue hover:text-white text-gray-600 rounded-lg text-xs font-bold transition-colors"
                         >
                           <Download className="w-3.5 h-3.5" /> Baixar Anexo
                         </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sticky Footer for Actions */}
          {(canEdit || canDelete) && (
            <div className="px-6 py-4 md:px-10 border-t border-gray-100 bg-white sticky bottom-0 z-20 flex flex-wrap justify-end gap-4 rounded-br-2xl sm:rounded-br-[2rem]">
              {canDelete && (
                <button onClick={onDelete} className="px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              )}
              {canEdit && (
                <button onClick={onEdit} className="px-6 py-2.5 bg-[#1e3a8a] text-white hover:bg-blue-900 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-blue-900/50">
                  <Edit className="w-4 h-4" /> Editar Caso
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
