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
      events.push({ label: 'Análise de Viabilidade', date: contract.prospect_date, status: 'analysis', color: 'bg-amber-50 text-amber-700 border-amber-200' });
    }
    if (contract.proposal_date) {
      events.push({ label: 'Proposta Emitida', date: contract.proposal_date, status: 'proposal', color: 'bg-blue-50 text-blue-700 border-blue-200' });
    }
    if (contract.contract_date) {
      events.push({ label: 'Assinatura / Ativação', date: contract.contract_date, status: 'active', color: 'bg-green-50 text-green-700 border-green-200' });
    }
    if (contract.rejection_date) {
      events.push({ label: 'Arquivamento / Rejeição', date: contract.rejection_date, status: 'rejected', color: 'bg-red-50 text-red-700 border-red-200' });
    }
    if (contract.probono_date) {
      events.push({ label: 'Início Probono', date: contract.probono_date, status: 'probono', color: 'bg-purple-50 text-purple-700 border-purple-200' });
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
    const proLaboreExtrasTotal = (contract as any).pro_labore_extras?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalProLabore = proLaboreBase + proLaboreExtrasTotal;

    // 2. Êxito Intermediário (Lista)
    const intermediateTotal = contract.intermediate_fees?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;

    // 3. Êxito Final (Base + Extras)
    const finalFeeBase = parseCurrency(contract.final_success_fee);
    const finalFeeExtrasTotal = (contract as any).final_success_extras?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalFinalFee = finalFeeBase + finalFeeExtrasTotal;

    // 4. Outros Honorários (Base + Extras)
    const otherFeesBase = parseCurrency(contract.other_fees);
    const otherFeesExtrasTotal = (contract as any).other_fees_extras?.reduce((acc: number, val: string) => acc + parseCurrency(val), 0) || 0;
    const totalOtherFees = otherFeesBase + otherFeesExtrasTotal;

    // 5. Fixo Mensal (Base + Extras)
    const fixedMonthlyBase = parseCurrency(contract.fixed_monthly_fee);
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
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-7xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 overflow-hidden border border-white/20">
        
        {/* Header - Navy Estilizado Manager */}
        <div className="p-10 bg-[#0a192f] border-b border-white/10 flex justify-between items-start relative">
          <div className="flex-1 pr-10">
            <div className="flex items-center gap-3 mb-5">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-lg ${getStatusColor(contract.status)}`}>
                {getStatusLabel(contract.status)}
              </span>
              {contract.hon_number && (
                <span className="font-mono text-[10px] font-black text-amber-500 bg-white/5 border border-amber-500/20 px-3 py-1 rounded-lg uppercase tracking-widest shadow-inner">
                  HON: {contract.hon_number}
                </span>
              )}
            </div>
            <h2 className="text-4xl font-black text-white leading-tight uppercase tracking-tighter">{contract.client_name}</h2>
            {contract.cnpj && (
               <div className="text-[11px] text-gray-500 font-black font-mono mt-2 tracking-widest opacity-60">CNPJ: {contract.cnpj}</div>
            )}
            <div className="flex items-center gap-8 mt-6">
              <span className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"><Briefcase className="w-4 h-4 mr-2.5 text-amber-500" /> {contract.area}</span>
              <span className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"><MapPin className="w-4 h-4 mr-2.5 text-amber-500" /> {contract.uf}</span>
            </div>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="text-white/10 font-black font-mono text-[13px] mt-3 mr-4 tracking-widest">
                #{contract.display_id || String(contract.seq_id || 0).padStart(6, '0')}
            </span>
            
            {canEdit && (
                <button onClick={onEdit} className="p-3.5 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all border border-white/10 shadow-2xl active:scale-95" title="Editar Dossiê">
                  <Edit className="w-5 h-5" />
                </button>
            )}
            
            {canDelete && (
                <button onClick={onDelete} className="p-3.5 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/20 shadow-2xl active:scale-95" title="Eliminar Registro">
                  <Trash2 className="w-5 h-5" />
                </button>
            )}
            
            <button onClick={onClose} className="p-3.5 bg-white/10 text-white rounded-2xl hover:bg-white/20 ml-2 transition-all border border-white/20 shadow-2xl active:scale-95">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Coluna 1: Custódia e Gestão */}
            <div className="space-y-8">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-4">Protocolos de Custódia</h3>
              <div className="space-y-6 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div>
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest block mb-2">Sócio Titular</label>
                  <div className="flex items-center gap-4 text-[11px] font-black text-[#0a192f] uppercase tracking-tight">
                    <div className="p-2.5 bg-blue-50 rounded-xl shadow-inner"><User className="w-4 h-4 text-[#0a192f]" /></div> {contract.partner_name || 'PENDENTE'}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest block mb-2">Analista Responsável</label>
                  <div className="flex items-center gap-4 text-[11px] font-black text-[#0a192f] uppercase tracking-tight">
                    <div className="p-2.5 bg-amber-50 rounded-xl shadow-inner"><User className="w-4 h-4 text-amber-600" /></div> {contract.analyzed_by_name || 'NÃO ATRIBUÍDO'}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest block mb-3">Custódia Digital (GED)</label>
                  <button 
                    onClick={handleDownloadLatest}
                    disabled={!documents || documents.length === 0}
                    className={`group flex items-center gap-4 text-[10px] font-black uppercase tracking-widest px-5 py-4 rounded-2xl transition-all border w-full shadow-sm ${
                        documents && documents.length > 0 
                        ? 'bg-white border-gray-100 text-[#0a192f] hover:border-amber-400 hover:shadow-xl cursor-pointer' 
                        : 'bg-gray-50 border-transparent text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                      <Paperclip className={`w-4 h-4 ${documents && documents.length > 0 ? 'text-amber-500' : 'text-gray-300'}`} /> 
                      <span className="truncate flex-1 text-left tracking-tight">
                         {documents && documents.length > 0 ? documents[0].file_name : 'NENHUM PDF VINCULADO'}
                      </span>
                      {documents && documents.length > 0 && <Download className="w-4 h-4 opacity-40 group-hover:opacity-100 text-amber-600 transition-all" />}
                  </button>
                </div>
                {(contract as any).reference_text && (
                  <div className="mt-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                    <label className="text-[9px] font-black text-[#0a192f] uppercase tracking-widest block mb-2 opacity-40">Identificador de Referência</label>
                    <p className="text-[11px] text-[#0a192f] font-bold leading-relaxed italic uppercase tracking-tighter">"{(contract as any).reference_text}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Análise Financeira */}
            <div className="space-y-8">
              {financials.showTotals && (
                <>
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-4">Dossiê Financeiro</h3>
                  
                  <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50">
                      {contract.timesheet && (
                        <div className="px-6 py-5 flex justify-between items-center bg-amber-500/10 border-l-4 border-amber-500">
                          <div>
                            <p className="text-[9px] font-black text-amber-800 uppercase tracking-[0.2em]">Cálculo por Volumetria</p>
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Timesheet Habilitado</span>
                          </div>
                          <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                        </div>
                      )}

                      <div className="px-6 py-5 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                          <div>
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Pró-Labore</p>
                            {financials.hasProLaboreExtras && <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">Extra Ativo</span>}
                          </div>
                          <span className="text-sm font-black text-[#0a192f] tracking-tight">{formatMoney(financials.totalProLabore)}</span>
                      </div>

                      {financials.hasIntermediate && (
                        <div className="px-6 py-5 flex justify-between items-center bg-blue-50/20">
                            <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Êxitos Intermediários</p>
                            <span className="text-sm font-black text-blue-800 tracking-tight">{formatMoney(financials.intermediateTotal)}</span>
                        </div>
                      )}

                      <div className="px-6 py-5 flex justify-between items-center bg-emerald-50/20">
                          <div>
                            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Êxito de Encerramento</p>
                            {financials.hasFinalFeeExtras && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Extra Ativo</span>}
                          </div>
                          <span className="text-sm font-black text-emerald-800 tracking-tight">{formatMoney(financials.totalFinalFee)}</span>
                      </div>

                      {financials.hasOther && (
                        <div className="px-6 py-5 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Verbas Assessórias</p>
                            <span className="text-sm font-black text-gray-700 tracking-tight">{formatMoney(financials.totalOtherFees)}</span>
                        </div>
                      )}

                      {financials.hasFixed && (
                        <div className="px-6 py-5 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Mensalidade Fixa</p>
                            <span className="text-sm font-black text-gray-700 tracking-tight">{formatMoney(financials.totalFixedMonthly)}</span>
                        </div>
                      )}

                      <div className="px-6 py-6 bg-[#0a192f] flex justify-between items-center shadow-2xl">
                          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Carga Acumulada</p>
                          <span className="text-2xl font-black text-white tracking-tighter">{formatMoney(financials.grandTotal)}</span>
                      </div>
                    </div>

                    {(contract.final_success_percent || (contract as any).percent_extras) && (
                       <div className="px-6 py-4 bg-amber-500 border-t border-white/10 flex flex-wrap gap-2.5 items-center">
                          <span className="text-[9px] font-black text-[#0a192f] uppercase tracking-widest">Taxa Ad Valorem:</span>
                          {contract.final_success_percent && <span className="text-[10px] font-black text-white bg-[#0a192f] px-2.5 py-0.5 rounded-lg border border-[#0a192f] shadow-md">{contract.final_success_percent}</span>}
                          {(contract as any).percent_extras?.map((val: string, idx: number) => (
                             <span key={idx} className="text-[10px] font-black text-white bg-[#0a192f] px-2.5 py-0.5 rounded-lg border border-[#0a192f] shadow-md">{val}</span>
                          ))}
                       </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Coluna 3: Volumetria de Processos */}
            <div className="space-y-8">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-200 pb-4">Acervo Processual ({processes.length})</h3>
              {processes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2rem] border border-dashed border-gray-200 shadow-inner">
                  <FileText className="w-10 h-10 text-gray-100 mb-4" />
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sem feitos vinculados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processes.map((proc, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-amber-200 hover:shadow-xl transition-all flex flex-col gap-3 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-all">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="font-mono font-black text-[#0a192f] text-[11px] tracking-widest uppercase">
                        {proc.process_number}
                      </div>
                      <div className="text-[11px] font-black text-gray-600 uppercase tracking-tight line-clamp-1 border-l-2 border-amber-500 pl-3">{proc.opponent || 'N/A'}</div>
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mt-1">{proc.court} • {proc.uf} • {proc.vara || 'JUÍZO COMUM'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {contract.observations && (
            <div className="bg-[#0a192f] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-1000"></div>
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-3" /> Resumo Estratégico do Caso
              </h4>
              <p className="text-[13px] text-slate-300 leading-loose font-bold uppercase tracking-tight opacity-80">{contract.observations}</p>
            </div>
          )}

          {/* SECTION INFERIOR: TIMELINE MANAGER */}
          <div className="border-t border-gray-200 pt-16">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center mb-12">
                <HistoryIcon className="w-5 h-5 mr-4 text-amber-500" /> Pipeline de Evolução do Contrato
              </h3>
                
              {timelineEvents.length > 0 ? (
                  <div className="flex items-stretch overflow-x-auto pb-10 px-4 space-x-6 custom-scrollbar w-full">
                      {timelineEvents.map((event, idx) => {
                      const isLast = idx === timelineEvents.length - 1;
                      const nextEvent = !isLast ? timelineEvents[idx + 1] : null;
                      const durationToNext = nextEvent ? getDurationBetween(event.date, nextEvent.date) : null;

                      return (
                          <React.Fragment key={idx}>
                              <div className="flex-shrink-0 flex flex-col min-w-[280px]">
                                  <div className={`flex-1 flex flex-col justify-between bg-white p-8 rounded-[2.5rem] border transition-all relative ${event.status === contract.status ? 'border-[#0a192f] ring-8 ring-[#0a192f]/5 shadow-2xl scale-105 z-10' : 'border-gray-100 hover:border-amber-200 shadow-md'}`}>
                                      <div className="text-center">
                                        <span className={`inline-block px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border mb-6 shadow-sm ${event.color}`}>
                                            {event.label}
                                        </span>
                                        <p className="text-[15px] font-black text-[#0a192f] flex items-center justify-center gap-3 tracking-widest">
                                            <CalendarCheck className="w-5 h-5 text-amber-500" /> 
                                            {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </p>
                                      </div>
                                      
                                      <div className="mt-8 flex flex-col gap-2.5">
                                      {event.status === 'active' && (
                                          <div className="flex items-center justify-center text-[10px] font-black text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-100 uppercase tracking-widest shadow-inner">
                                              <Hourglass className="w-4 h-4 mr-2.5" />
                                              Lead Time Total: {getTotalDuration()}
                                          </div>
                                      )}
                                      {durationToNext && (
                                          <div className="flex items-center justify-center text-[9px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 uppercase tracking-[0.15em]">
                                              <Clock className="w-4 h-4 mr-2.5 text-amber-500" />
                                              + {durationToNext} no estágio
                                          </div>
                                      )}
                                      </div>
                                  </div>
                              </div>
                              {!isLast && (
                                  <div className="flex-shrink-0 text-amber-500 self-center">
                                      <ChevronsRight className="w-8 h-8 opacity-20 animate-pulse" />
                                  </div>
                              )}
                          </React.Fragment>
                      );
                      })}
                  </div>
              ) : (
                  <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/50">
                      <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.4em]">Matriz temporal em processamento...</p>
                  </div>
              )}
          </div>
        </div>

        {/* Footer Actions Manager */}
        <div className="p-8 bg-white border-t border-gray-100 flex justify-end gap-5 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] relative z-10">
          <button 
            onClick={onClose} 
            className="px-10 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#0a192f] hover:border-[#0a192f] transition-all active:scale-95 shadow-sm"
          >
            Encerrar Consulta
          </button>
          <button 
            onClick={onEdit} 
            className="px-12 py-4 bg-[#0a192f] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center shadow-2xl shadow-[#0a192f]/30 active:scale-95"
          >
            <Edit className="w-4 h-4 mr-3 text-amber-500" />
            Abrir Editor de Caso
          </button>
        </div>
      </div>
    </div>
  );
}