import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Filter, Calendar, DollarSign, User, Briefcase,
  CheckCircle2, Clock, Scale, Tag, Loader2,
  LayoutGrid, List, Download, ArrowUpDown, Edit, Trash2, Bell, ArrowDownAZ, ArrowUpAZ,
  FileSignature, ChevronDown, X, FileSearch, Paperclip, Eye
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import * as XLSX from 'xlsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner'; 
import { Contract, Partner, ContractProcess, TimelineEvent, Analyst } from '../types';

// --- IMPORTAÇÕES DE COMPONENTES (Rotas corrigidas de acordo com o mapeamento) ---
import { ContractFormModal } from '../contracts/ContractFormModal';
import { ContractDetailsModal } from '../contracts/ContractDetailsModal';
import { PartnerManagerModal } from '../partners/PartnerManagerModal';
import { AnalystManagerModal } from '../analysts/AnalystManagerModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { parseCurrency } from '../utils/masks';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-700 border-green-100';
    case 'analysis': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'proposal': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
    case 'probono': return 'bg-purple-50 text-purple-700 border-purple-100';
    default: return 'bg-gray-50 text-gray-700 border-gray-100';
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

// Componente Local de Filtro Padronizado - Estilo Manager
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
        className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-gray-200 cursor-pointer hover:border-[#0a192f] transition-all select-none shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {Icon && <Icon className="w-4 h-4 text-[#0a192f] mr-2 shrink-0" />}
        <span className="text-[11px] font-black uppercase tracking-widest text-gray-700 flex-1 truncate">{displayValue}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#0a192f]' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${value === opt.value ? 'bg-amber-50 text-[#0a192f] border-amber-500' : 'border-transparent'}`}
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
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Filtros e Ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const searchRef = useRef<HTMLDivElement>(null); 

  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Modais
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
    if (location.state && location.state.status) {
      setStatusFilter(location.state.status);
    }
  }, [location.state]);

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

  // Fechar busca ao clicar fora, se estiver vazia
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

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const [contractsRes, partnersRes, analystsRes] = await Promise.all([
      supabase.from('contracts').select(`*, partner:partners(name), analyst:analysts(name), processes:contract_processes(*), documents:contract_documents(id, file_name, file_path, uploaded_at)`).order('created_at', { ascending: false }),
      supabase.from('partners').select('*').eq('active', true).order('name'),
      supabase.from('analysts').select('*').eq('active', true).order('name')
    ]);

    if (contractsRes.data) {
      const formatted: Contract[] = contractsRes.data.map((c: any) => ({
        ...c,
        partner_name: c.partner?.name,
        analyzed_by_name: c.analyst?.name,
        process_count: c.processes?.length || 0,
        display_id: String(c.seq_id || 0).padStart(6, '0') 
      }));
      setContracts(formatted);
    }
    if (partnersRes.data) setPartners(partnersRes.data);
    if (analystsRes.data) setAnalysts(analystsRes.data);
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
    navigate('/kanban', { state: { openTaskId: taskId } });
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
    fetchNotifications();
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
    
    // Busca abrangente em todos os campos relevantes
    const matchesSearch = 
      c.client_name?.toLowerCase().includes(term) ||
      c.hon_number?.toLowerCase().includes(term) ||
      c.cnpj?.includes(term) ||
      c.display_id?.includes(term) ||
      c.observations?.toLowerCase().includes(term) ||
      c.reference?.toLowerCase().includes(term) ||
      c.partner_name?.toLowerCase().includes(term) ||
      c.analyzed_by_name?.toLowerCase().includes(term) ||
      // Busca profunda nos processos vinculados
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
        const relevantDate = new Date(relevantDateStr);
        relevantDate.setHours(0, 0, 0, 0); 

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (relevantDate < start) matchesDate = false;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); 
          if (relevantDate > end) matchesDate = false;
        }
      } else {
        matchesDate = false; 
      }
    }
      
    return matchesSearch && matchesStatus && matchesPartner && matchesDate;
  }).sort((a: Contract, b: Contract) => {
    if (sortBy === 'name') {
      const nameA = a.client_name || '';
      const nameB = b.client_name || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else {
      const dateA = new Date(getRelevantDate(a) || 0).getTime();
      const dateB = new Date(getRelevantDate(b) || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
  });

  const exportToExcel = () => {
    // 1. Calcular Totais
    let sumPro = 0;
    let sumOther = 0;
    let sumFixed = 0;
    let sumInter = 0;
    let sumFinal = 0;
    let sumTotalSuccess = 0;

    // 2. Preparar Dados
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

        // Calcula total de intermediários
        let vInter = 0;
        if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
             c.intermediate_fees.forEach((f: string) => vInter += parseCurrency(f));
        }

        const vTotalSuccess = calculateTotalSuccess(c);

        // Acumula
        sumPro += vPro;
        sumOther += vOther;
        sumFixed += vFixed;
        sumInter += vInter;
        sumFinal += vFinal;
        sumTotalSuccess += vTotalSuccess;

        // Linha Principal
        rows.push([
          c.display_id,
          getStatusLabel(c.status),
          c.client_name,
          c.partner_name || '-',
          c.hon_number || '-',
          new Date(getRelevantDate(c) || '').toLocaleDateString('pt-BR'),
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

        // Linhas Extras para Cláusulas Detalhadas
        const clauses: {type: string, text: string}[] = [];
        
        if((c as any).pro_labore_extras_clauses && Array.isArray((c as any).pro_labore_extras_clauses)) {
            (c as any).pro_labore_extras_clauses.forEach((cl: string) => clauses.push({type: 'Extra Pró-Labore', text: cl}));
        }
        if((c.intermediate_fees_clauses as any) && Array.isArray((c.intermediate_fees_clauses as any))) {
             (c.intermediate_fees_clauses as any).forEach((cl: string) => clauses.push({type: 'Intermediário', text: cl}));
        }
        if((c as any).final_success_extras_clauses && Array.isArray((c as any).final_success_extras_clauses)) {
            (c as any).final_success_extras_clauses.forEach((cl: string) => clauses.push({type: 'Extra Êxito Final', text: cl}));
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

    // 3. Adicionar Linha de Totais
    const totalRow = [
        'TOTAIS', '', '', '', '', '', '',
        sumPro, '', sumOther, '', sumFixed, '', sumInter, '', sumFinal, '', sumTotalSuccess, ''
    ];

    const dataWithHeader = [header, ...rows, [], totalRow];

    // 4. Criar planilha
    const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

    // 5. Formatação de Células (Moeda)
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

    // 6. Gerar arquivo
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
    <div className="p-8 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        {/* Esquerda: Título */}
        <div>
          <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center gap-3">
            <FileSignature className="w-6 h-6 text-amber-500" /> Casos & Propostas
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão centralizada de faturamento e contratos.</p>
        </div>

        {/* Direita: Filtros de Status/Sócio, Botão Novo, Notificações */}
        <div className="flex flex-wrap items-center gap-3">
           <FilterSelect
              icon={Filter}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Status"
            />

            <FilterSelect
              icon={User}
              value={partnerFilter}
              onChange={setPartnerFilter}
              options={partnerOptions}
              placeholder="Sócios"
            />

          {/* Botão Novo Caso */}
          {userRole !== 'viewer' && (
            <button onClick={handleNew} className="bg-[#0a192f] hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center text-[10px] font-black uppercase tracking-widest h-[44px] active:scale-95">
                <Plus className="w-4 h-4 mr-2 text-amber-500" /> Novo Caso
            </button>
          )}

          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl border relative transition-all h-[44px] w-[44px] flex items-center justify-center ${
                notifications.length > 0
                  ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-[#0a192f]'
              }`}
            >
              <Bell className={`w-5 h-5 ${notifications.length > 0 ? 'animate-pulse' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 border-b border-gray-50 bg-[#0a192f] flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Pendências de Assinatura</h4>
                  <span className="bg-amber-500 text-[#0a192f] px-2 py-0.5 rounded-full text-[10px] font-black">{notifications.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">Nenhuma pendência.</div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className="p-4 border-b border-gray-50 last:border-0 hover:bg-amber-50 cursor-pointer transition-colors"
                      >
                        <p className="text-xs font-black text-[#0a192f] line-clamp-1 uppercase tracking-tight">{notif.title}</p>
                        <p className="text-[9px] font-bold text-gray-400 flex items-center mt-1.5 uppercase">
                          <Calendar className="w-3 h-3 mr-1.5 text-amber-500" />
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

      {/* Barra de Controles Inferior (Card Total + Ferramentas) */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm items-center justify-between">
        
        {/* Esquerda: Card de Total (FIXO) */}
        <div className="flex items-center gap-4 pr-6 border-r border-gray-100 mr-2 min-w-[220px]">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Briefcase className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Total de Casos</p>
                <p className="text-2xl font-black text-[#0a192f] leading-none mt-1">{contracts.length}</p>
            </div>
        </div>

        {/* Grupo da Direita: Busca Animada, Datas, Ações */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end flex-1">
            
            {/* Busca Animada Expandível */}
            <div 
              ref={searchRef}
              className={`
                flex items-center overflow-hidden transition-all duration-500 ease-in-out bg-white
                ${isSearchOpen ? 'w-72 border-[#0a192f] shadow-xl px-4 rounded-xl' : 'w-11 border-transparent justify-center cursor-pointer hover:bg-gray-100 rounded-xl'}
                h-[44px] border
              `}
              onClick={() => !isSearchOpen && setIsSearchOpen(true)}
            >
                <Search className={`w-5 h-5 text-gray-400 shrink-0 ${isSearchOpen ? 'text-[#0a192f]' : ''}`} />
                
                <input
                    type="text"
                    placeholder="BUSCAR CASO OU CLIENTE..."
                    className={`ml-3 bg-transparent outline-none text-[10px] font-bold uppercase tracking-widest w-full text-[#0a192f] placeholder:text-gray-300 ${!isSearchOpen && 'hidden'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus={isSearchOpen}
                />

                {isSearchOpen && searchTerm && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                        className="ml-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Separador Visual */}
            <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

            {/* Filtros de Data */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-200 h-[44px]">
                 <span className="text-[9px] font-black text-gray-400 uppercase mr-2">De</span>
                 <input 
                   type="date" 
                   value={startDate} 
                   onChange={(e) => setStartDate(e.target.value)}
                   className="bg-transparent text-[11px] font-bold text-[#0a192f] outline-none w-[115px] cursor-pointer"
                 />
              </div>
              <div className="flex items-center bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-200 h-[44px]">
                 <span className="text-[9px] font-black text-gray-400 uppercase mr-2">Até</span>
                 <input 
                   type="date" 
                   value={endDate} 
                   onChange={(e) => setEndDate(e.target.value)}
                   className="bg-transparent text-[11px] font-bold text-[#0a192f] outline-none w-[115px] cursor-pointer"
                 />
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex bg-gray-50/50 rounded-xl p-1 border border-gray-200 h-[44px] items-center">
                <button
                  onClick={() => { if(sortBy !== 'name') { setSortBy('name'); setSortOrder('asc'); } else { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } }}
                  className={`flex items-center px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-full ${sortBy === 'name' ? 'bg-white shadow-md text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Ordenar por Nome"
                >
                  Nome
                  {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowDownAZ className="w-3.5 h-3.5 ml-1.5" /> : <ArrowUpAZ className="w-3.5 h-3.5 ml-1.5" />)}
                </button>
                <button
                  onClick={() => { if(sortBy !== 'date') { setSortBy('date'); setSortOrder('desc'); } else { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); } }}
                  className={`flex items-center px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-full ${sortBy === 'date' ? 'bg-white shadow-md text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Ordenar por Data"
                >
                  Data
                  {sortBy === 'date' && <ArrowUpDown className="w-3.5 h-3.5 ml-1.5" />}
                </button>
            </div>

            {/* Visualização */}
            <div className="flex bg-gray-50/50 rounded-xl p-1 border border-gray-200 h-[44px] items-center">
                <button onClick={() => setViewMode('grid')} className={`p-2 h-full flex items-center rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 h-full flex items-center rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-[#0a192f]' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
            </div>

             {/* Exportar */}
             <button onClick={exportToExcel} className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all text-[10px] font-black uppercase tracking-widest h-[44px] shadow-sm">
                <Download className="w-4 h-4 mr-2" /> XLS
              </button>

             {/* Limpar (se houver filtros) */}
             {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition-all h-[44px]"
                  title="Limpar todos os filtros"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center p-20 gap-4">
          <Loader2 className="w-10 h-10 text-[#0a192f] animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando registros...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
               <EmptyState
                icon={FileSearch}
                title="Nenhum caso encontrado"
                description={
                    searchTerm || statusFilter !== 'all' || partnerFilter !== '' || startDate !== '' || endDate !== '' 
                    ? "Não encontramos nenhum contrato com os filtros atuais. Verifique os critérios aplicados."
                    : "A base de dados de controladoria está vazia. Inicie o registro de um novo caso."
                }
                actionLabel={searchTerm || statusFilter !== 'all' || partnerFilter !== '' || startDate !== '' || endDate !== '' ? "Limpar Filtros" : "Novo Registro"}
                onAction={searchTerm || statusFilter !== 'all' || partnerFilter !== '' || startDate !== '' || endDate !== '' ? clearFilters : handleNew}
              />
          </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContracts.map((contract) => {
                const totalExito = calculateTotalSuccess(contract);
                return (
                  <div key={contract.id} onClick={() => handleView(contract)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-amber-200 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-8">
                        <span className="text-[9px] text-gray-300 font-black tracking-widest mb-1.5 block uppercase">{contract.display_id}</span>
                        <h3 className="font-black text-[#0a192f] text-sm truncate uppercase tracking-tight" title={contract.client_name}>{contract.client_name}</h3>
                        <div className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase mt-2 border ${getStatusColor(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                      <div className="flex items-center">
                        <Scale className="w-3.5 h-3.5 mr-2.5 text-amber-500" />
                        <span className="truncate">
                          {contract.processes && contract.processes.length > 0
                            ? contract.processes.map((p) => p.process_number).join(', ')
                            : 'Sem processos vinculados'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-2.5 text-[#0a192f]" />
                        <span className="truncate text-[#0a192f]">{contract.partner_name || 'Não atribuído'}</span>
                      </div>
                      {contract.status === 'active' && contract.hon_number && (
                        <div className="flex items-center">
                          <Tag className="w-3.5 h-3.5 mr-2.5 text-gray-300" />
                          <span className="font-black bg-gray-50 text-gray-400 px-2 py-0.5 rounded-lg text-[9px] tracking-widest">{contract.hon_number}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-end">
                      <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                          {new Date(getRelevantDate(contract) || '').toLocaleDateString()}
                        </div>
                      </div>
                      {contract.status === 'active' && (
                        <div className="text-right">
                          {contract.pro_labore && parseCurrency(contract.pro_labore) > 0 && (
                            <div className="text-xs font-black text-emerald-600">{formatMoney(contract.pro_labore)}</div>
                          )}
                          {totalExito > 0 && (
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">+ {formatMoney(totalExito)} Êxito</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#0a192f] text-white">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest pl-8">ID</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Cliente</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Processos</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Sócio Responsável</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">HON</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Data</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center">Docs</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right pr-8">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredContracts.map(contract => (
                    <tr key={contract.id} onClick={() => handleView(contract)} className="hover:bg-amber-50/30 cursor-pointer group transition-colors">
                      <td className="p-4 pl-8 font-black text-[10px] text-gray-300 tracking-widest">{contract.display_id}</td>
                      <td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${getStatusColor(contract.status)}`}>{getStatusLabel(contract.status)}</span></td>
                      <td className="p-4 text-xs font-black text-[#0a192f] uppercase tracking-tight">{contract.client_name}</td>
                      <td className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-tighter max-w-[200px] truncate" title={contract.processes?.map(p => p.process_number).join(', ')}>
                        {contract.processes && contract.processes.length > 0
                          ? contract.processes.map(p => p.process_number).join(', ')
                          : '-'}
                      </td>
                      <td className="p-4 text-[11px] font-bold text-[#0a192f] uppercase">{contract.partner_name || '-'}</td>
                      <td className="p-4 font-black text-[10px] text-gray-400 tracking-widest">{contract.hon_number || '-'}</td>
                      <td className="p-4 text-right text-[10px] font-bold text-gray-500">{new Date(getRelevantDate(contract) || '').toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        {(contract as any).documents?.length > 0 && (
                          <div className="flex justify-center">
                            <Paperclip className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button onClick={(e) => { e.stopPropagation(); handleView(contract); }} className="text-gray-400 hover:text-[#0a192f] p-2 hover:bg-white rounded-xl transition-all shadow-sm"><Eye className="w-4 h-4" /></button>
                            
                            {userRole !== 'viewer' && (
                                <button onClick={(e) => { e.stopPropagation(); handleView(contract); handleEdit(); }} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-white rounded-xl transition-all shadow-sm"><Edit className="w-4 h-4" /></button>
                            )}
                            
                            {userRole === 'admin' && (
                                <button onClick={(e) => handleDeleteFromList(e, contract.id!)} className="text-red-400 hover:text-red-600 p-2 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* --- MODAIS --- */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Remover Registro"
        description="Esta ação excluirá permanentemente o caso e todo o histórico financeiro vinculado. Confirmar?"
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
        onCNPJSearch={() => {}}
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