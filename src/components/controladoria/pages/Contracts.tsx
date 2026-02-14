import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Filter, Calendar, User, Briefcase,
  Loader2,
  Download, Edit, Trash2, Bell,
  FileSignature, ChevronDown, X, FileSearch, Eye
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

import { Contract, Partner, ContractProcess, TimelineEvent, Analyst } from '../../../types/controladoria';
import { ContractFormModal } from '../contracts/ContractFormModal';
import { ContractDetailsModal } from '../contracts/ContractDetailsModal';
import { PartnerManagerModal } from '../partners/PartnerManagerModal';
import { AnalystManagerModal } from '../analysts/AnalystManagerModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { parseCurrency, safeDate } from '../utils/masks';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'proposal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'probono': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Contrato Fechado';
    case 'analysis': return 'Sob Análise';
    case 'proposal': return 'Proposta Enviada';
    case 'rejected': return 'Rejeitada';
    case 'probono': return 'Probono';
    default: return status;
  }
};

const formatMoney = (val: number | string | undefined) => {
  if (!val) return 'R$ 0,00';
  const num = typeof val === 'string' ? parseCurrency(val) : val;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const calculateTotalSuccess = (c: Contract) => {
  let total = parseCurrency(c.final_success_fee);

  if ((c as any).final_success_extras && Array.isArray((c as any).final_success_extras)) {
    (c as any).final_success_extras.forEach((fee: string) => total += parseCurrency(fee));
  }

  if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
    c.intermediate_fees.forEach((fee: string) => total += parseCurrency(fee));
  }
  return total;
};

const FilterSelect = ({ icon: Icon, value, onChange, options, placeholder }: { icon?: React.ElementType, value: string, onChange: (val: string) => void, options: { label: string, value: string }[], placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const displayValue = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className="relative min-w-[180px]" ref={wrapperRef}>
      <div
        className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors select-none shadow-sm h-[40px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {Icon && <Icon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />}
        <span className="text-xs font-bold text-gray-600 flex-1 truncate uppercase tracking-wider">{displayValue}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 cursor-pointer ${value === opt.value ? 'bg-blue-50 text-[#1e3a8a]' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function Contracts() {
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);


  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');



  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isAnalystModalOpen, setIsAnalystModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const emptyContract: Contract = {
    cnpj: '', has_no_cnpj: false, client_name: '', client_position: 'Autor', area: '', uf: 'RJ', partner_id: '', has_legal_process: true,
    status: 'analysis', physical_signature: false
  };
  const [formData, setFormData] = useState<Contract>(emptyContract);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '' });
  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [editingProcessIndex, setEditingProcessIndex] = useState<number | null>(null);
  const [newIntermediateFee, setNewIntermediateFee] = useState('');
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    fetchData();
    fetchNotifications();

    const subscription = supabase
      .channel('contracts_list_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (!searchTerm) {
          setIsSearchOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef, searchTerm]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    // Ajustado: Busca na tabela partners filtrando por status 'active'
    const [contractsRes, partnersRes, analystsRes] = await Promise.all([
      supabase.from('contracts').select(`*, partner:partners(name), processes:contract_processes(*), documents:contract_documents(id, file_name, file_path, uploaded_at)`).order('created_at', { ascending: false }),
      supabase.from('partners').select('*').order('name'),
      supabase.from('analysts').select('*').eq('active', true).order('name')
    ]);

    if (contractsRes.data) {
      const formatted: Contract[] = contractsRes.data.map((c: any) => ({
        ...c,
        partner_name: c.partner?.name,
        process_count: c.processes?.length || 0,
        display_id: String(c.seq_id || 0).padStart(6, '0')
      }));
      setContracts(formatted);
    }
    if (partnersRes.data) setPartners(partnersRes.data);
    if (analystsRes.data) setAnalysts(analystsRes.data as Analyst[]);
    setLoading(false);
  };

  const handlePartnerUpdate = async (newId?: string) => {
    await fetchData();
    if (newId && typeof newId === 'string') {
      setFormData(prev => ({ ...prev, partner_id: newId }));
    }
  };

  const handleAnalystUpdate = async (newId?: string) => {
    await fetchData();
    if (newId && typeof newId === 'string') {
      setFormData(prev => ({ ...prev, analyst_id: newId } as Contract));
    }
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('kanban_tasks')
      .select('id, title, due_date')
      .eq('status', 'signature')
      .order('due_date', { ascending: true });
    if (data) setNotifications(data);
  };

  const handleNotificationClick = (taskId: string) => {
    // Navigate to kanban with task ID - would require useNavigate from react-router-dom
    window.location.href = `/controladoria/kanban?taskId=${taskId}`;
  };



  const handleNew = () => {
    if (userRole === 'viewer') return toast.error("Sem permissão para criar.");
    setFormData(emptyContract);
    setProcesses([]);
    setCurrentProcess({ process_number: '' });
    setTimelineData([]);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleView = async (contract: Contract) => {
    setFormData(contract);
    const [procRes, timeRes] = await Promise.all([
      supabase.from('contract_processes').select('*').eq('contract_id', contract.id),
      supabase.from('contract_timeline').select('*').eq('contract_id', contract.id).order('changed_at', { ascending: false })
    ]);
    if (procRes.data) setProcesses(procRes.data);
    if (timeRes.data) setTimelineData(timeRes.data);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = () => {
    if (userRole === 'viewer') return toast.error("Sem permissão para editar.");
    setIsDetailsModalOpen(false);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const triggerDelete = (id: string) => {
    if (userRole !== 'admin') return toast.error("Apenas administradores podem excluir.");
    setDeleteTargetId(id);
    setIsConfirmModalOpen(true);
  };

  const handleDelete = () => {
    if (!formData.id) return;
    triggerDelete(formData.id);
  };

  const handleDeleteFromList = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerDelete(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    const toastId = toast.loading('Excluindo contrato...');

    const { error } = await supabase.from('contracts').delete().eq('id', deleteTargetId);

    if (!error) {
      toast.success('Contrato excluído com sucesso!', { id: toastId });
      setIsDetailsModalOpen(false);
      setIsConfirmModalOpen(false);
      fetchData();
    } else {
      toast.error('Erro ao excluir contrato.', { id: toastId });
      console.error(error);
    }
  };

  const handleSave = () => {
    fetchData();

    toast.success(isEditing ? 'Contrato atualizado com sucesso!' : 'Contrato criado com sucesso!');
  };

  const handleProcessAction = () => {
    if (!currentProcess.process_number) return;
    if (editingProcessIndex !== null) {
      const updated = [...processes];
      updated[editingProcessIndex] = currentProcess;
      setProcesses(updated);
      setEditingProcessIndex(null);
    } else {
      setProcesses([...processes, currentProcess]);
    }
    setCurrentProcess({ process_number: '' });
  };

  const editProcess = (idx: number) => {
    setCurrentProcess(processes[idx]);
    setEditingProcessIndex(idx);
  };

  const removeProcess = (idx: number) => {
    setProcesses(processes.filter((_, i) => i !== idx));
  };

  const addIntermediateFee = () => {
    if (!newIntermediateFee) return;
    setFormData((prev: Contract) => ({
      ...prev,
      intermediate_fees: [...(prev.intermediate_fees || []), newIntermediateFee]
    }));
    setNewIntermediateFee('');
  };

  const removeIntermediateFee = (idx: number) => {
    setFormData((prev: Contract) => ({
      ...prev,
      intermediate_fees: prev.intermediate_fees?.filter((_, i) => i !== idx)
    }));
  };

  const getRelevantDate = (c: Contract) => {
    switch (c.status) {
      case 'analysis': return c.prospect_date || c.created_at;
      case 'proposal': return c.proposal_date || c.created_at;
      case 'active': return c.contract_date || c.created_at;
      case 'rejected': return c.rejection_date || c.created_at;
      case 'probono': return c.probono_date || c.contract_date || c.created_at;
      default: return c.created_at;
    }
  };

  const filteredContracts = contracts.filter((c: Contract) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      c.client_name?.toLowerCase().includes(term) ||
      c.hon_number?.toLowerCase().includes(term) ||
      c.cnpj?.includes(term) ||
      c.display_id?.includes(term) ||
      c.observations?.toLowerCase().includes(term) ||
      c.reference?.toLowerCase().includes(term) ||
      c.partner_name?.toLowerCase().includes(term) ||
      c.analyzed_by_name?.toLowerCase().includes(term) ||
      (c.processes && c.processes.some(p =>
        p.process_number.toLowerCase().includes(term) ||
        p.author?.toLowerCase().includes(term) ||
        p.opponent?.toLowerCase().includes(term) ||
        p.court?.toLowerCase().includes(term) ||
        p.vara?.toLowerCase().includes(term) ||
        p.comarca?.toLowerCase().includes(term) ||
        p.magistrates?.some(m => m.name.toLowerCase().includes(term))
      ));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPartner = partnerFilter === '' || c.partner_id === partnerFilter;

    let matchesDate = true;
    if (startDate || endDate) {
      const relevantDateStr = getRelevantDate(c);
      if (relevantDateStr) {
        const relevantDate = safeDate(relevantDateStr);
        if (relevantDate) {
          relevantDate.setHours(0, 0, 0, 0);

          if (startDate) {
            const start = safeDate(startDate);
            if (start) {
              start.setHours(0, 0, 0, 0);
              if (relevantDate < start) matchesDate = false;
            }
          }

          if (endDate) {
            const end = safeDate(endDate);
            if (end) {
              end.setHours(23, 59, 59, 999);
              if (relevantDate > end) matchesDate = false;
            }
          }
        } else {
          matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesPartner && matchesDate;
  });

  const exportToExcel = () => {
    let sumPro = 0;
    let sumOther = 0;
    let sumFixed = 0;
    let sumInter = 0;
    let sumFinal = 0;
    let sumTotalSuccess = 0;

    const header = [
      'ID', 'Status', 'Cliente', 'Sócio', 'HON', 'Data Relevante', 'Local Faturamento',
      'Pró-Labore', 'Cláusula Pró-Labore',
      'Outros Honorários', 'Cláusula Outros',
      'Fixo Mensal', 'Cláusula Fixo Mensal',
      'Êxito Intermediário', 'Cláusula Intermediário',
      'Êxito Final', 'Cláusula Êxito Final',
      'Êxito (Total)', 'Observações'
    ];

    const rows: any[] = [];

    filteredContracts.forEach(c => {
      const vPro = parseCurrency(c.pro_labore);
      const vOther = parseCurrency(c.other_fees);
      const vFixed = parseCurrency(c.fixed_monthly_fee);
      const vFinal = parseCurrency(c.final_success_fee);

      let vInter = 0;
      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
        c.intermediate_fees.forEach((f: string) => vInter += parseCurrency(f));
      }

      const vTotalSuccess = calculateTotalSuccess(c);

      sumPro += vPro;
      sumOther += vOther;
      sumFixed += vFixed;
      sumInter += vInter;
      sumFinal += vFinal;
      sumTotalSuccess += vTotalSuccess;

      rows.push([
        c.display_id,
        getStatusLabel(c.status),
        c.client_name,
        c.partner_name || '-',
        c.hon_number || '-',
        safeDate(getRelevantDate(c))?.toLocaleDateString('pt-BR') || '-',
        c.billing_location || '-',
        vPro,
        (c as any).pro_labore_clause || '-',
        vOther,
        (c as any).other_fees_clause || '-',
        vFixed,
        (c as any).fixed_monthly_fee_clause || '-',
        vInter,
        (c.intermediate_fees_clauses && (c.intermediate_fees_clauses as any).length > 0) ? 'Ver detalhe abaixo' : '-',
        vFinal,
        (c as any).final_success_fee_clause || '-',
        vTotalSuccess,
        c.observations || '-'
      ]);

      const clauses: { type: string, text: string }[] = [];

      if ((c as any).pro_labore_extras_clauses && Array.isArray((c as any).pro_labore_extras_clauses)) {
        (c as any).pro_labore_extras_clauses.forEach((cl: string) => clauses.push({ type: 'Extra Pró-Labore', text: cl }));
      }
      if ((c.intermediate_fees_clauses as any) && Array.isArray((c.intermediate_fees_clauses as any))) {
        (c.intermediate_fees_clauses as any).forEach((cl: string) => clauses.push({ type: 'Intermediário', text: cl }));
      }
      if ((c as any).final_success_extras_clauses && Array.isArray((c as any).final_success_extras_clauses)) {
        (c as any).final_success_extras_clauses.forEach((cl: string) => clauses.push({ type: 'Extra Êxito Final', text: cl }));
      }

      clauses.forEach(clause => {
        rows.push([
          c.display_id,
          '', '', '', '', '', '',
          '', clause.type === 'Extra Pró-Labore' ? clause.text : '',
          '', '',
          '', '',
          '', clause.type === 'Intermediário' ? clause.text : '',
          '', clause.type === 'Extra Êxito Final' ? clause.text : '',
          '', ''
        ]);
      });
    });

    const totalRow = [
      'TOTAIS', '', '', '', '', '', '',
      sumPro, '', sumOther, '', sumFixed, '', sumInter, '', sumFinal, '', sumTotalSuccess, ''
    ];

    const dataWithHeader = [header, ...rows, [], totalRow];

    const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

    const currencyFormat = '"R$" #,##0.00';
    const range = XLSX.utils.decode_range(ws['!ref']!);
    const moneyCols = [7, 9, 11, 13, 15, 17];

    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      moneyCols.forEach(C => {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = currencyFormat;
          ws[cellRef].t = 'n';
        }
      });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");

    const statusName = statusFilter === 'all' ? 'Geral' : getStatusLabel(statusFilter).replace(/ /g, '_');
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const fileName = `Salomão_${statusName}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success('Relatório gerado com sucesso!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPartnerFilter('');
    setStartDate('');
    setEndDate('');
    setIsSearchOpen(false);
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || partnerFilter !== '' || startDate !== '' || endDate !== '';

  const statusOptions = [
    { label: 'Todos Status', value: 'all' },
    { label: 'Sob Análise', value: 'analysis' },
    { label: 'Proposta Enviada', value: 'proposal' },
    { label: 'Contrato Fechado', value: 'active' },
    { label: 'Rejeitada', value: 'rejected' },
    { label: 'Probono', value: 'probono' }
  ];

  const partnerOptions = [
    { label: 'Todos Sócios', value: '' },
    ...partners.map(p => ({ label: p.name, value: p.id }))
  ];

  return (
    <div className="p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {/* Esquerda: Ícone + Título */}
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <FileSignature className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Casos</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão completa de casos e propostas</p>
          </div>
        </div>

        {/* Direita: Exportar XLSX, Novo Caso, Notificações */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Exportar XLSX (Verde) */}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4" /> Exportar XLS
          </button>

          {/* Novo Caso (Azul Royal) */}
          {userRole !== 'viewer' && (
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Novo Caso
            </button>
          )}

          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full relative transition-all h-[40px] w-[40px] flex items-center justify-center ${notifications.length > 0
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-100'
                }`}
            >
              <Bell className={`w-5 h-5 ${notifications.length > 0 ? 'animate-pulse' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Tarefas de Assinatura</h4>
                  <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{notifications.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">Nenhuma pendência.</div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className="p-3 border-b border-gray-50 last:border-0 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{notif.title}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          Vence: {new Date(notif.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar: Total | Busca | Filtros | Período */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row items-center gap-4">

          {/* Card de Total */}
          <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
            <div className="p-2 bg-[#1e3a8a]/10 text-[#1e3a8a] rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total</p>
              <p className="text-xl font-black text-[#0a192f] leading-none">{contracts.length}</p>
            </div>
          </div>

          {/* Barra de Busca (flex-1, sempre visível) */}
          <div className="relative flex-1 w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, HON, processo..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros: Sócios e Status */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              icon={User}
              value={partnerFilter}
              onChange={setPartnerFilter}
              options={partnerOptions}
              placeholder="Sócios"
            />

            <FilterSelect
              icon={Filter}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Status"
            />

            {/* Período: De - Até */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 h-[40px]">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2">De</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-600 outline-none w-[110px]"
                />
              </div>
              <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 h-[40px]">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2">Até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-600 outline-none w-[110px]"
                />
              </div>
            </div>

            {/* Limpar Filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors h-[40px] border border-red-100"
                title="Limpar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Área de Conteúdo */}
      <div className="flex-1">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mx-auto mb-4" />
            Carregando base de dados...
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <EmptyState
              icon={FileSearch}
              title="Nenhum caso encontrado"
              description={hasActiveFilters ? "Não encontramos nenhum contrato com os filtros atuais." : "Você ainda não possui casos cadastrados."}
              actionLabel={hasActiveFilters ? "Limpar Filtros" : "Novo Caso"}
              onAction={hasActiveFilters ? clearFilters : handleNew}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">ID</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Cliente</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Processos</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Sócio</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">HON</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest text-right">Data</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredContracts.map(contract => (
                  <tr key={contract.id} onClick={() => handleView(contract)} className="hover:bg-blue-50/30 cursor-pointer group transition-colors">
                    <td className="p-4 font-mono text-[10px] text-gray-400 font-bold">{contract.display_id}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(contract.status)}`}>
                        {getStatusLabel(contract.status)}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-black text-[#0a192f] uppercase tracking-tight">{contract.client_name}</td>
                    <td className="p-4 text-[11px] font-semibold text-gray-500 max-w-[180px] truncate">
                      {contract.processes && contract.processes.length > 0 ? contract.processes.map(p => p.process_number).join(', ') : '-'}
                    </td>
                    <td className="p-4 text-[11px] font-semibold text-gray-600">{contract.partner_name || '-'}</td>
                    <td className="p-4 font-mono text-[10px] font-bold text-gray-400">{contract.hon_number || '-'}</td>
                    <td className="p-4 text-right text-[11px] font-semibold text-gray-500">{safeDate(getRelevantDate(contract))?.toLocaleDateString() || '-'}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleView(contract); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-[#1e3a8a] transition-all"><Eye className="w-4 h-4" /></button>
                        {userRole !== 'viewer' && (
                          <button onClick={(e) => { e.stopPropagation(); handleView(contract); handleEdit(); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 transition-all"><Edit className="w-4 h-4" /></button>
                        )}
                        {userRole === 'admin' && (
                          <button onClick={(e) => handleDeleteFromList(e, contract.id!)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Contrato"
        description="Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
      />

      <ContractDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        contract={formData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        processes={processes}
        documents={(formData as any).documents}
        canEdit={userRole !== 'viewer'}
        canDelete={userRole === 'admin'}
      />

      <ContractFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        loading={loading}
        isEditing={isEditing}
        partners={partners}
        onOpenPartnerManager={() => setIsPartnerModalOpen(true)}
        analysts={analysts}
        onOpenAnalystManager={() => setIsAnalystModalOpen(true)}
        onCNPJSearch={() => { }}
        processes={processes}
        currentProcess={currentProcess}
        setCurrentProcess={setCurrentProcess}
        editingProcessIndex={editingProcessIndex}
        handleProcessAction={handleProcessAction}
        editProcess={editProcess}
        removeProcess={removeProcess}
        newIntermediateFee={newIntermediateFee}
        setNewIntermediateFee={setNewIntermediateFee}
        addIntermediateFee={addIntermediateFee}
        removeIntermediateFee={removeIntermediateFee}
        timelineData={timelineData}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />

      <PartnerManagerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onUpdate={handlePartnerUpdate} />
      <AnalystManagerModal isOpen={isAnalystModalOpen} onClose={() => setIsAnalystModalOpen(false)} onUpdate={handleAnalystUpdate} />
    </div>
  );
}