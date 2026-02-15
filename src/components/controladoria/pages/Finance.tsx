import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  DollarSign, Search, Download, CheckCircle2, Circle, Clock, Loader2,
  CalendarDays, Receipt, X, Filter, MapPin, Hash,
  AlertTriangle, Plus, ChevronDown, FileDown, Briefcase
} from 'lucide-react';
import { FinancialInstallment, Partner, Contract, ContractProcess, ContractDocument } from '../../../types/controladoria';

// Rota corrigida para localizar o EmptyState corretamente
import { EmptyState } from '../ui/EmptyState';

import { ContractDetailsModal } from '../contracts/ContractDetailsModal';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// --- COMPONENTES AUXILIARES ---

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
    <div className="relative min-w-[160px]" ref={wrapperRef}>
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

export function Finance() {

  // --- STATES ---

  const [installments, setInstallments] = useState<FinancialInstallment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [locations, setLocations] = useState<string[]>([]);

  // Modais
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<FinancialInstallment | null>(null);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);

  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState<FinancialInstallment | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  // Modal de Detalhes do Contrato
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const [selectedContractData, setSelectedContractData] = useState<Contract | null>(null);
  const [contractProcesses, setContractProcesses] = useState<ContractProcess[]>([]);
  const [contractDocuments, setContractDocuments] = useState<ContractDocument[]>([]);

  useEffect(() => {

    fetchData();
  }, []);



  // --- LOGIC ---


  const fetchData = async () => {
    setLoading(true);

    // Atualizado para buscar parceiros ativos com base no novo campo 'status'
    const { data: partnersData } = await supabase.from('partners').select('*').eq('status', 'active').order('name');
    if (partnersData) setPartners(partnersData);

    const { data: installmentsData } = await supabase
      .from('financial_installments')
      .select(`
        *,
        contract:contracts (
          id, seq_id, hon_number, client_name, partner_id, billing_location, status,
          partners (name)
        )
      `)
      .order('due_date', { ascending: true });

    if (installmentsData) {
      const allowedStatuses = ['proposal_sent', 'closed'];
      const filteredInstallments = installmentsData.filter((i: any) =>
        i.contract?.status && allowedStatuses.includes(i.contract.status)
      );

      const formatted = filteredInstallments.map((i: any) => ({
        ...i,
        contract: {
          ...i.contract,
          partner_name: i.contract?.partners?.name,
          display_id: i.contract?.seq_id ? String(i.contract.seq_id).padStart(6, '0') : '-'
        }
      }));
      setInstallments(formatted);

      const locs = Array.from(new Set(formatted.map((i: any) => i.contract?.billing_location).filter(Boolean))) as string[];
      setLocations(locs);
    }
    setLoading(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = (inst: FinancialInstallment) => {
    if (inst.status !== 'pending' || !inst.due_date) return false;
    const dueDateStr = inst.due_date.split('T')[0];
    return dueDateStr < todayStr;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pro_labore': return 'Pró-Labore';
      case 'success_fee': return 'Êxito';
      case 'final_success_fee': return 'Êxito Final';
      case 'intermediate_fee': return 'Êxito Intermediário';
      case 'fixed_monthly_fee': return 'Fixo Mensal';
      case 'fixed': return 'Fixo Mensal';
      case 'hourly_fee': return 'Por Hora';
      case 'other_fees': return 'Outros';
      case 'other': return 'Outros';
      default: return type;
    }
  };

  const handleFilterOverdue = () => {
    setStatusFilter('overdue');
    setSearchTerm('');
    setSelectedPartner('');
    setSelectedLocation('');
    setStartDate('');
    setEndDate('');


    const overdueCount = installments.filter(i => isOverdue(i)).length;
    toast.info(`Filtrando ${overdueCount} parcela${overdueCount !== 1 ? 's' : ''} vencida${overdueCount !== 1 ? 's' : ''}`, {
      description: 'Exibindo apenas parcelas com vencimento atrasado',
      duration: 3000,
    });
  };

  const handleOpenContractModal = async (contractId: string) => {
    try {
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          partners (name)
        `)
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      const { data: processesData } = await supabase
        .from('contract_processes')
        .select('*')
        .eq('contract_id', contractId);

      const { data: documentsData } = await supabase
        .from('contract_documents')
        .select('*')
        .eq('contract_id', contractId)
        .order('uploaded_at', { ascending: false });

      let analyzedByName = null;
      if (contractData.analyzed_by) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', contractData.analyzed_by)
          .single();

        analyzedByName = profileData?.name;
      }

      const formattedContract: Contract = {
        ...contractData,
        partner_name: contractData.partners?.name,
        analyzed_by_name: analyzedByName,
        display_id: contractData.seq_id ? String(contractData.seq_id).padStart(6, '0') : '-'
      };

      setSelectedContractData(formattedContract);
      setContractProcesses(processesData || []);
      setContractDocuments(documentsData || []);

      setIsContractModalOpen(true);
    } catch (error: any) {
      console.error('Erro ao carregar contrato:', error);
      toast.error('Erro ao carregar detalhes do contrato');
    }
  };

  const filteredInstallments = installments.filter(i => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = i.contract?.client_name?.toLowerCase().includes(term) ||
      i.contract?.hon_number?.includes(searchTerm) ||
      (i.contract as any)?.display_id?.includes(searchTerm);

    const matchesPartner = selectedPartner ? i.contract?.partner_id === selectedPartner : true;
    const matchesLocation = selectedLocation ? i.contract?.billing_location === selectedLocation : true;

    let matchesDate = true;
    if (startDate || endDate) {
      const dateToCheck = i.paid_at ? new Date(i.paid_at) : (i.due_date ? new Date(i.due_date) : null);
      if (dateToCheck) {
        if (startDate && dateToCheck < new Date(startDate)) matchesDate = false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (dateToCheck > end) matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }

    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = i.status === 'pending';
    if (statusFilter === 'paid') matchesStatus = i.status === 'paid';
    if (statusFilter === 'overdue') matchesStatus = isOverdue(i);

    return matchesSearch && matchesPartner && matchesLocation && matchesStatus && matchesDate;
  });

  const totalPending = filteredInstallments.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredInstallments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPendingCount = filteredInstallments.filter(i => i.status === 'pending').length;
  const totalOverdueCount = installments.filter(i => isOverdue(i)).length;

  const handleMarkAsPaid = (installment: FinancialInstallment) => {
    setSelectedInstallment(installment);
    setBillingDate(todayStr);
    setIsDateModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedInstallment) return;
    await supabase.from('financial_installments').update({ status: 'paid', paid_at: billingDate }).eq('id', selectedInstallment.id);
    setIsDateModalOpen(false);
    toast.success('Faturamento confirmado!');
    fetchData();
  };

  const handleEditDueDate = (installment: FinancialInstallment) => {
    setInstallmentToEdit(installment);
    setNewDueDate(installment.due_date ? installment.due_date.split('T')[0] : '');
    setIsDueDateModalOpen(true);
  };

  const confirmDueDateChange = async () => {
    if (!installmentToEdit || !newDueDate) return;
    await supabase.from('financial_installments').update({ due_date: newDueDate }).eq('id', installmentToEdit.id);
    setIsDueDateModalOpen(false);
    toast.success('Vencimento atualizado!');
    fetchData();
  };

  const handleDownloadContractPDF = async (contractId: string) => {
    const loadingToast = toast.loading('Buscando documento do contrato...');

    try {
      const { data: documents, error } = await supabase
        .from('contract_documents')
        .select('*')
        .eq('contract_id', contractId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      if (!documents || documents.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('Nenhum documento encontrado para este contrato');
        return;
      }

      const doc = documents[0];

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('contract-documents')
        .download(doc.file_path);

      if (downloadError) throw downloadError;

      const url = URL.createObjectURL(fileData);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'contrato.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success('Download concluído!');
    } catch (error: any) {
      console.error('Erro ao baixar PDF:', error);
      toast.dismiss(loadingToast);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleNewInvoice = () => {
    alert("Abrir modal de Cadastro de Casos / Faturamento avulso");
  };

  const exportToExcel = () => {
    const data = filteredInstallments.map(i => ({
      'ID': (i.contract as any)?.display_id,
      'Cliente': i.contract?.client_name,
      'HON': i.contract?.hon_number,
      'Cláusula': (i as any).clause || '',
      'Tipo': getTypeLabel(i.type),
      'Parcela': `${i.installment_number}/${i.total_installments}`,
      'Valor': i.amount,
      'Vencimento': new Date(i.due_date!).toLocaleDateString(),
      'Status': i.status === 'paid' ? 'Faturado' : 'Pendente',
      'Data Faturamento': i.paid_at ? new Date(i.paid_at).toLocaleDateString() : '-'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financeiro");
    XLSX.writeFile(wb, "Relatorio_Financeiro.xlsx");
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPartner('');
    setSelectedLocation('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');

  };

  const hasActiveFilters = searchTerm || selectedPartner || selectedLocation || statusFilter !== 'all' || startDate || endDate;

  const statusOptions = [
    { label: 'Todos Status', value: 'all' },
    { label: 'Pendentes', value: 'pending' },
    { label: 'Faturados', value: 'paid' },
    { label: 'Vencidos', value: 'overdue' },
  ];

  const locationOptions = [{ label: 'Todos Locais', value: '' }, ...locations.map(l => ({ label: l, value: l }))];
  const partnerOptions = [{ label: 'Todos Sócios', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header - Salomão Design System */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <DollarSign className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Controle Financeiro</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de faturamento e recebíveis</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button onClick={exportToExcel} className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95">
            <Download className="h-4 w-4" /> Exportar XLS
          </button>
          <button
            onClick={handleNewInvoice}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* 2. Cards de Totais - Salomão Design System */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={totalOverdueCount > 0 ? handleFilterOverdue : undefined}
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between relative overflow-hidden group transition-all ${totalOverdueCount > 0
            ? 'bg-red-50 border-red-100 cursor-pointer hover:shadow-md'
            : 'bg-white border-gray-100'
            }`}
        >
          <div className={`absolute right-0 top-0 h-full w-1 ${totalOverdueCount > 0 ? 'bg-red-600' : 'bg-blue-600'}`}></div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${totalOverdueCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>A Receber</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={`text-2xl font-black ${totalOverdueCount > 0 ? 'text-red-900' : 'text-blue-900'}`}>{totalPendingCount}</p>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{totalPendingCount === 1 ? 'parcela' : 'parcelas'}</span>
            </div>
            {totalOverdueCount > 0 && (
              <p className="text-[10px] font-black text-red-600 mt-1 uppercase tracking-widest animate-pulse">
                {totalOverdueCount} {totalOverdueCount === 1 ? 'vencida' : 'vencidas'}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${totalOverdueCount > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            {totalOverdueCount > 0 ? <AlertTriangle className="h-6 w-6" /> : <Hash className="h-6 w-6" />}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-amber-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendente (R$)</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Faturado (R$)</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar Principal - Padrão Contratos */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row items-center gap-4">

          {/* Barra de Busca (flex-1, sempre visível) */}
          <div className="relative flex-1 w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente, HON, ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros: Sócios, Status, Locais e Período */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              icon={Briefcase}
              value={selectedPartner}
              onChange={setSelectedPartner}
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

            <FilterSelect
              icon={MapPin}
              value={selectedLocation}
              onChange={setSelectedLocation}
              options={locationOptions}
              placeholder="Locais"
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

      {/* 4. Área de Conteúdo */}
      <div className="flex-1">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mx-auto mb-4" />
            Carregando dados financeiros...
          </div>
        ) : filteredInstallments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
            <EmptyState
              icon={Receipt}
              title="Nenhum lançamento encontrado"
              description={hasActiveFilters ? "Não encontramos resultados para os filtros atuais." : "Ainda não existem lançamentos financeiros cadastrados."}
              actionLabel={hasActiveFilters ? "Limpar Filtros" : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
              className="h-full justify-center"
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Tipo</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Data</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Categoria</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Detalhamento</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Origem</th>
                    <th className="p-4 text-right text-[10px] font-black text-white uppercase tracking-widest">Valor</th>
                    <th className="p-4 text-right text-[10px] font-black text-white uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInstallments.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                      onClick={() => handleOpenContractModal(item.contract!.id)}
                    >
                      <td className="p-4 font-mono text-[10px] text-gray-400 font-bold">{(item.contract as any)?.display_id}</td>
                      <td className="p-4">
                        {item.status === 'paid'
                          ? <span className="flex items-center text-emerald-600 text-[9px] font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3 mr-1" /> Faturado</span>
                          : <span className="flex items-center text-amber-500 text-[9px] font-black uppercase tracking-widest"><Circle className="w-3 h-3 mr-1" /> Pendente</span>
                        }
                      </td>
                      <td className="p-4 text-[11px] font-semibold">
                        {item.paid_at ? (
                          <span className="text-emerald-600 font-black uppercase tracking-tighter">Pago em {new Date(item.paid_at).toLocaleDateString()}</span>
                        ) : (
                          <span className={`flex items-center ${isOverdue(item) ? "text-red-600 font-black uppercase tracking-tighter" : "text-gray-700"}`}>
                            {isOverdue(item) && <AlertTriangle className="w-3 h-3 mr-1 animate-pulse" />}
                            {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-black text-[#0a192f] uppercase tracking-tight">{item.contract?.client_name}</td>
                      <td className="p-4 text-[10px] font-semibold text-gray-500 uppercase">
                        <div className="font-bold">HON: {item.contract?.hon_number || '-'}</div>
                        <div className="text-[9px] text-gray-400 truncate max-w-[150px] lowercase tracking-normal">{(item as any).clause}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest">{getTypeLabel(item.type)}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Parcela {item.installment_number}/{item.total_installments}</div>
                      </td>
                      <td className="p-4 text-right font-black text-[#0a192f] text-xs">
                        {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); handleEditDueDate(item); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-all" title="Alterar Vencimento"><CalendarDays className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadContractPDF(item.contract!.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-all" title="Baixar Contrato"><FileDown className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(item); }} className="ml-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 text-[9px] font-black uppercase tracking-widest flex items-center transition-all">
                            <DollarSign className="w-3 h-3 mr-1" /> Faturar
                          </button>
                        </div>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: DETALHES DO CONTRATO */}
      {selectedContractData && (
        <ContractDetailsModal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false);
            setSelectedContractData(null);
            setSelectedContractId(null);
          }}
          contract={selectedContractData}
          onEdit={() => {
            toast.info('Edição não disponível nesta tela');
            setIsContractModalOpen(false);
          }}
          onDelete={() => {
            toast.info('Função de exclusão não implementada');
          }}
          processes={contractProcesses}
          documents={contractDocuments}
          canEdit={true}
          canDelete={true}
        />
      )}

      {/* MODAL: DATA DE FATURAMENTO */}
      {isDateModalOpen && (
        <div className="fixed inset-0 bg-[#0a192f]/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 border border-gray-100">
            <h3 className="text-lg font-black text-[#0a192f] mb-2 uppercase tracking-tight">Confirmar Faturamento</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Confirma o recebimento desta parcela?</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Data do Recebimento</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-700 focus:border-[#1e3a8a] outline-none transition-all" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsDateModalOpen(false)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
              <button onClick={confirmPayment} className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 shadow-md font-black text-[10px] uppercase tracking-widest transition-all">Confirmar Pagamento</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR VENCIMENTO */}
      {isDueDateModalOpen && (
        <div className="fixed inset-0 bg-[#0a192f]/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 border border-gray-100">
            <h3 className="text-lg font-black text-[#0a192f] mb-4 uppercase tracking-tight">Alterar Vencimento</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nova Data de Vencimento</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-700 focus:border-[#1e3a8a] outline-none transition-all" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsDueDateModalOpen(false)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
              <button onClick={confirmDueDateChange} className="bg-[#1e3a8a] text-white px-6 py-2 rounded-xl hover:bg-[#112240] shadow-md font-black text-[10px] uppercase tracking-widest transition-all">Salvar Alteração</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}