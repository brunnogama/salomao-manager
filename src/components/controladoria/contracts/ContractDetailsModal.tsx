import React from 'react';
import { X, Edit, Trash2, Calendar, User, FileText, Briefcase, MapPin, History as HistoryIcon, Hourglass, CalendarCheck, ArrowDown, Calculator, Paperclip, CheckCircle2, ArrowRight, Clock, ChevronsRight, Download } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Caminho corrigido
import { Contract, ContractProcess, ContractDocument } from '../types'; // Caminho corrigido
import { parseCurrency } from '../utils/masks'; // Caminho corrigido

// Interface interna para os eventos construídos a partir das datas do formulário
interface InternalTimelineEvent {
  label: string;
  date: string; // YYYY-MM-DD
  status: string;
  color: string;
}

const getDurationBetween = (startDateStr: string, endDateStr: string): string => {
  if (!startDateStr || !endDateStr) return '-';
   
  const start = new Date(startDateStr + 'T12:00:00');
  const end = new Date(endDateStr + 'T12:00:00');
   
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
  // Novas props de permissão
  canEdit?: boolean;
  canDelete?: boolean;
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
    canDelete = false 
}: Props) {
  if (!isOpen || !contract) return null;

  const handleDownload = async (e: React.MouseEvent, doc: ContractDocument) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase.storage.from('contract-documents').download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Erro ao baixar documento: ' + error.message);
    }
  };

  const handleDownloadLatest = (e: React.MouseEvent) => {
      if (documents && documents.length > 0) {
          // Assume que o primeiro é o mais recente ou relevante
          handleDownload(e, documents[0]);
      }
  };

  // 1. CONSTRUÇÃO DA TIMELINE BASEADA NAS DATAS INTERNAS
  const buildInternalTimeline = (): InternalTimelineEvent[] => {
    const events: InternalTimelineEvent[] = [];

    if (contract.prospect_date) {
      events.push({ label: 'Sob Análise', date: contract.prospect_date, status: 'analysis', color: 'bg-amber-50 text-amber-700 border-amber-200' });
    }
    if (contract.proposal_date) {
      events.push({ label: 'Proposta Enviada', date: contract.proposal_date, status: 'proposal', color: 'bg-blue-50 text-blue-700 border-blue-200' });
    }
    if (contract.contract_date) {
      events.push({ label: 'Contrato Fechado', date: contract.contract_date, status: 'active', color: 'bg-green-50 text-green-700 border-green-200' });
    }
    if (contract.rejection_date) {
      events.push({ label: 'Rejeitado', date: contract.rejection_date, status: 'rejected', color: 'bg-red-50 text-red-700 border-red-200' });
    }
    if (contract.probono_date) {
      events.push({ label: 'Probono', date: contract.probono_date, status: 'probono', color: 'bg-purple-50 text-purple-700 border-purple-200' });
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
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
      case 'analysis': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'proposal': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'probono': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: any = { analysis: 'Sob Análise', proposal: 'Proposta', active: 'Ativo', rejected: 'Rejeitado', probono: 'Probono' };
    return map[status] || status;
  };

  // --- LÓGICA DE CÁLCULO FINANCEIRO CORRIGIDA ---
  const calculateFinancials = () => {
    const isFinancialRelevant = ['proposal', 'active'].includes(contract.status);

    // 1. Pró-Labore (Base + Extras)
    const proLaboreBase = parseCurrency(contract.pro_labore);
    // CORREÇÃO: Tratando como string[] igual ao intermediate_fees
    const proLaboreExtrasTotal = (contract as any).pro_labore_extras?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalProLabore = proLaboreBase + proLaboreExtrasTotal;

    // 2. Êxito Intermediário (Lista)
    const intermediateTotal = contract.intermediate_fees?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;

    // 3. Êxito Final (Base + Extras)
    const finalFeeBase = parseCurrency(contract.final_success_fee);
    // CORREÇÃO: Tratando como string[]
    const finalFeeExtrasTotal = (contract as any).final_success_extras?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalFinalFee = finalFeeBase + finalFeeExtrasTotal;

    // 4. Outros Honorários (Base + Extras)
    const otherFeesBase = parseCurrency(contract.other_fees);
    // CORREÇÃO: Tratando como string[]
    const otherFeesExtrasTotal = (contract as any).other_fees_extras?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalOtherFees = otherFeesBase + otherFeesExtrasTotal;

    // 5. Fixo Mensal (Base + Extras)
    const fixedMonthlyBase = parseCurrency(contract.fixed_monthly_fee);
    // CORREÇÃO: Tratando como string[]
    const fixedMonthlyExtrasTotal = (contract as any).fixed_monthly_extras?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalFixedMonthly = fixedMonthlyBase + fixedMonthlyExtrasTotal;
      
    // Soma Geral
    const grandTotal = totalProLabore + intermediateTotal + totalFinalFee + totalOtherFees + totalFixedMonthly;

    return {
      showTotals: isFinancialRelevant,
      totalProLabore,
      totalFinalFee,
      intermediateTotal,
      totalOtherFees,
      totalFixedMonthly,
      grandTotal,
      
      // Flags para UI
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

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-7xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 overflow-hidden border border-white/20">
        
        {/* Header - Navy Estilizado */}
        <div className="p-8 bg-[#0a192f] border-b border-white/10 flex justify-between items-start relative">
          <div className="flex-1 pr-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(contract.status)}`}>
                {getStatusLabel(contract.status)}
              </span>
              {contract.hon_number && (
                <span className="font-mono text-[10px] font-bold text-amber-400 bg-white/5 border border-white/10 px-2 py-1 rounded uppercase tracking-tighter">
                  HON: {contract.hon_number}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">{contract.client_name}</h2>
            {contract.cnpj && (
               <div className="text-sm text-gray-400 font-mono mt-1 opacity-80">{contract.cnpj}</div>
            )}
            <div className="flex items-center gap-6 mt-4 text-gray-300">
              <span className="flex items-center text-[10px] font-black uppercase tracking-widest"><Briefcase className="w-3.5 h-3.5 mr-2 text-amber-500" /> {contract.area}</span>
              <span className="flex items-center text-[10px] font-black uppercase tracking-widest"><MapPin className="w-3.5 h-3.5 mr-2 text-amber-500" /> {contract.uf}</span>
            </div>
          </div>
          
          <div className="flex gap-2 items-start">
            <span className="text-white/20 font-mono text-[11px] mt-3 mr-3 font-bold">
                #{contract.display_id || String(contract.seq_id || 0).padStart(6, '0')}
            </span>
            
            {canEdit && (
                <button onClick={onEdit} className="p-3 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all border border-white/10 shadow-lg" title="Editar">
                  <Edit className="w-5 h-5" />
                </button>
            )}
            
            {canDelete && (
                <button onClick={onDelete} className="p-3 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/20 shadow-lg" title="Excluir">
                  <Trash2 className="w-5 h-5" />
                </button>
            )}
            
            <button onClick={onClose} className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 ml-2 transition-all border border-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Coluna 1: Dados Gerais */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-[#0a192f] uppercase tracking-[0.2em] border-b border-gray-200 pb-3">Informações de Gestão</h3>
              <div className="space-y-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Sócio Responsável</label>
                  <div className="flex items-center gap-3 text-sm font-bold text-[#0a192f] uppercase">
                    <div className="p-2 bg-blue-50 rounded-lg"><User className="w-4 h-4 text-[#0a192f]" /></div> {contract.partner_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Analista Responsável</label>
                  <div className="flex items-center gap-3 text-sm font-bold text-[#0a192f] uppercase">
                    <div className="p-2 bg-purple-50 rounded-lg"><User className="w-4 h-4 text-purple-600" /></div> {contract.analyzed_by_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Documentação Vinculada</label>
                  <button 
                    onClick={handleDownloadLatest}
                    disabled={!documents || documents.length === 0}
                    className={`group flex items-center gap-3 text-[11px] font-black uppercase px-4 py-3 rounded-xl transition-all border w-full ${
                        documents && documents.length > 0 
                        ? 'bg-white border-gray-200 text-[#0a192f] hover:border-[#0a192f] hover:shadow-md cursor-pointer' 
                        : 'bg-gray-50 border-transparent text-gray-400 cursor-not-allowed'
                    }`}
                  >
                      <Paperclip className={`w-4 h-4 ${documents && documents.length > 0 ? 'text-amber-500' : 'text-gray-300'}`} /> 
                      <span className="truncate flex-1 text-left tracking-tight">
                         {documents && documents.length > 0 ? documents[0].file_name : 'Sem anexo'}
                      </span>
                      {documents && documents.length > 0 && <Download className="w-4 h-4 opacity-40 group-hover:opacity-100" />}
                  </button>
                </div>
                {(contract as any).reference_text && (
                  <div className="mt-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                    <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-2">Referência de Controle</label>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed italic">"{(contract as any).reference_text}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Financeiro */}
            <div className="space-y-6">
              {financials.showTotals && (
                <>
                  <h3 className="text-[11px] font-black text-[#0a192f] uppercase tracking-[0.2em] border-b border-gray-200 pb-3 flex items-center justify-between">
                    Composição Financeira
                  </h3>
                  
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50">
                      {contract.timesheet && (
                        <div className="px-5 py-4 flex justify-between items-center bg-purple-50/30 border-l-4 border-purple-500">
                          <div>
                            <p className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Timesheet Ativo</p>
                            <span className="text-[9px] font-bold text-purple-500 uppercase">Cobrança por horas</span>
                          </div>
                          <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                      )}

                      <div className="px-5 py-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pró-Labore</p>
                            {financials.hasProLaboreExtras && <span className="text-[9px] font-bold text-blue-500 uppercase">Com Adicionais</span>}
                          </div>
                          <span className="text-sm font-black text-[#0a192f]">{formatMoney(financials.totalProLabore)}</span>
                      </div>

                      {financials.hasIntermediate && (
                        <div className="px-5 py-4 flex justify-between items-center bg-blue-50/20">
                           <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Êxitos Intermediários</p>
                           <span className="text-sm font-black text-blue-800">{formatMoney(financials.intermediateTotal)}</span>
                        </div>
                      )}

                      <div className="px-5 py-4 flex justify-between items-center bg-green-50/20">
                          <div>
                            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Êxito Final</p>
                            {financials.hasFinalFeeExtras && <span className="text-[9px] font-bold text-green-500 uppercase">Com Adicionais</span>}
                          </div>
                          <span className="text-sm font-black text-green-800">{formatMoney(financials.totalFinalFee)}</span>
                      </div>

                      {financials.hasOther && (
                        <div className="px-5 py-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Outros Honorários</p>
                           <span className="text-sm font-black text-gray-700">{formatMoney(financials.totalOtherFees)}</span>
                        </div>
                      )}

                      {financials.hasFixed && (
                        <div className="px-5 py-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fixo Mensal</p>
                           <span className="text-sm font-black text-gray-700">{formatMoney(financials.totalFixedMonthly)}</span>
                        </div>
                      )}

                      <div className="px-5 py-5 bg-[#0a192f] flex justify-between items-center">
                          <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">Total Acumulado</p>
                          <span className="text-xl font-black text-white tracking-tight">{formatMoney(financials.grandTotal)}</span>
                      </div>
                    </div>

                    {(contract.final_success_percent || (contract as any).percent_extras) && (
                       <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex flex-wrap gap-2 items-center">
                          <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Êxito Variável:</span>
                          {contract.final_success_percent && <span className="text-[10px] font-black text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200 uppercase">{contract.final_success_percent}</span>}
                          {(contract as any).percent_extras?.map((val: string, idx: number) => (
                             <span key={idx} className="text-[10px] font-black text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200 uppercase">{val}</span>
                          ))}
                       </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Coluna 3: Processos */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-[#0a192f] uppercase tracking-[0.2em] border-b border-gray-200 pb-3">Volumetria Judicial ({processes.length})</h3>
              {processes.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhum processo vinculado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processes.map((proc, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-[#0a192f]/20 transition-all flex flex-col gap-2 group">
                      <div className="font-mono font-black text-[#0a192f] text-[11px] flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-500" />
                        {proc.process_number}
                      </div>
                      <div className="text-[11px] font-bold text-gray-600 uppercase tracking-tight line-clamp-1">{proc.opponent}</div>
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{proc.court} • {proc.uf} • {proc.vara || '-'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {contract.observations && (
            <div className="bg-[#0a192f] p-6 rounded-2xl border border-white/10 shadow-lg">
              <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" /> Observações de Caso
              </h4>
              <p className="text-sm text-white/80 leading-relaxed font-medium">{contract.observations}</p>
            </div>
          )}

          {/* SECTION INFERIOR: TIMELINE */}
          <div className="border-t border-gray-200 pt-10">
              <h3 className="text-[11px] font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center mb-8">
                <HistoryIcon className="w-4 h-4 mr-3 text-amber-500" /> Evolução Cronológica do Caso
              </h3>
                
              {timelineEvents.length > 0 ? (
                  <div className="flex items-stretch overflow-x-auto pb-6 px-2 space-x-4 custom-scrollbar w-full">
                      {timelineEvents.map((event, idx) => {
                      const isLast = idx === timelineEvents.length - 1;
                      const nextEvent = !isLast ? timelineEvents[idx + 1] : null;
                      const durationToNext = nextEvent ? getDurationBetween(event.date, nextEvent.date) : null;

                      return (
                          <React.Fragment key={idx}>
                              <div className="flex-shrink-0 flex flex-col min-w-[240px]">
                                  <div className={`flex-1 flex flex-col justify-between bg-white p-6 rounded-[1.5rem] border transition-all relative ${event.status === contract.status ? 'border-[#0a192f] ring-4 ring-[#0a192f]/5 shadow-xl' : 'border-gray-100 hover:border-gray-300 shadow-sm'}`}>
                                      <div className="text-center">
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border mb-4 ${event.color}`}>
                                            {event.label}
                                        </span>
                                        <p className="text-sm font-black text-[#0a192f] flex items-center justify-center gap-2">
                                            <CalendarCheck className="w-4 h-4 text-gray-300" /> 
                                            {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </p>
                                      </div>
                                      
                                      <div className="mt-6 flex flex-col gap-2">
                                      {event.status === 'active' && (
                                          <div className="flex items-center justify-center text-[10px] font-black text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 uppercase tracking-widest shadow-inner">
                                              <Hourglass className="w-3.5 h-3.5 mr-2" />
                                              Total: {getTotalDuration()}
                                          </div>
                                      )}
                                      {durationToNext && (
                                          <div className="flex items-center justify-center text-[9px] font-black text-gray-400 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100 uppercase tracking-widest">
                                              <Clock className="w-3.5 h-3.5 mr-2" />
                                              {durationToNext} até próxima etapa
                                          </div>
                                      )}
                                      </div>
                                  </div>
                              </div>
                              {!isLast && (
                                  <div className="flex-shrink-0 text-gray-200 self-center">
                                      <ChevronsRight className="w-8 h-8 opacity-30" />
                                  </div>
                              )}
                          </React.Fragment>
                      );
                      })}
                  </div>
              ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50/50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Histórico cronológico indisponível</p>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}