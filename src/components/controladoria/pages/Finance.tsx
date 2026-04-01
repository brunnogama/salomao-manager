import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import {
  DollarSign, Download, CheckCircle2, Circle, Clock, Loader2,
  CalendarDays, Receipt, MapPin, Hash,
  AlertTriangle, Plus, FileDown, Briefcase, ChevronDown, X
} from 'lucide-react';
import { FinancialInstallment, Partner, Contract, ContractProcess, ContractDocument } from '../../../types/controladoria';

import { EmptyState } from '../ui/EmptyState';
import { ContractDetailsModal } from '../contracts/ContractDetailsModal';
import { exportToStandardXLSX } from '../../../utils/exportUtils';
import { toast } from 'sonner';
import { useDatabaseSync } from '../../../hooks/useDatabaseSync';
import { FilterBar, FilterCategory } from '../../collaborators/components/FilterBar';
import { maskMoney, parseCurrency } from '../utils/masks';

// --- COMPONENTES AUXILIARES ---

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
  const [filterPeriodo, setFilterPeriodo] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const [locations, setLocations] = useState<string[]>([]);

  // Modais
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<FinancialInstallment | null>(null);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [nfNumber, setNfNumber] = useState('');
  
  const [nfIssueDate, setNfIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [nfDueDate, setNfDueDate] = useState('');
  const [nfLocation, setNfLocation] = useState('');
  const [nfNature, setNfNature] = useState('');
  const [nfValue, setNfValue] = useState('');
  
  const [nfIrpj, setNfIrpj] = useState('');
  const [nfPis, setNfPis] = useState('');
  const [nfCofins, setNfCofins] = useState('');
  const [nfCsll, setNfCsll] = useState('');

  const nfNetValue = useMemo(() => {
    const value = parseCurrency(nfValue) || 0;
    const irpj = parseCurrency(nfIrpj) || 0;
    const pis = parseCurrency(nfPis) || 0;
    const cofins = parseCurrency(nfCofins) || 0;
    const csll = parseCurrency(nfCsll) || 0;
    const net = value - irpj - pis - cofins - csll;
    return maskMoney(net.toFixed(2).replace('.', ','));
  }, [nfValue, nfIrpj, nfPis, nfCofins, nfCsll]);

  const [officeLocations, setOfficeLocations] = useState<{ id: string; name: string }[]>([]);

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDateModalOpen(false);
        setIsDueDateModalOpen(false);
        setIsContractModalOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useDatabaseSync(() => {
    fetchData();
  }, ['financial_installments', 'partners']);



  // --- LOGIC ---


  const fetchData = async () => {
    setLoading(true);

    const { data: partnersData } = await supabase.from('partners').select('*').eq('status', 'active').order('name');
    if (partnersData) setPartners(partnersData);

    const { data: locData } = await supabase.from('locations').select('id, name').order('name');
    if (locData) setOfficeLocations(locData);

    const { data: installmentsData } = await supabase
      .from('financial_installments')
      .select(`
        *,
        contract:contracts (
          id, seq_id, hon_number, client_name, cnpj, partner_id, billing_location, status,
          partners (name)
        )
      `)
      .order('due_date', { ascending: true });

    if (installmentsData) {
      const allowedStatuses = ['proposal', 'active'];
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
    setFilterPeriodo({ start: '', end: '' });


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
        .maybeSingle();

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
          .maybeSingle();

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
    const term = searchTerm.toLowerCase().trim();
    const numericTerm = term.replace(/\D/g, '');

    let matchesSearch = true;
    if (term) {
      matchesSearch = 
        Boolean(i.contract?.client_name?.toLowerCase().includes(term)) ||
        Boolean(i.contract?.hon_number?.toLowerCase().includes(term)) ||
        Boolean(numericTerm && i.contract?.hon_number?.replace(/\D/g, '').includes(numericTerm)) ||
        Boolean((i.contract as any)?.display_id?.toLowerCase().includes(term)) ||
        Boolean(i.contract?.cnpj?.toLowerCase().includes(term)) ||
        Boolean(numericTerm && i.contract?.cnpj?.replace(/\D/g, '').includes(numericTerm)) ||
        Boolean(i.amount.toString().includes(numericTerm && numericTerm !== '' ? numericTerm : term)) ||
        Boolean(i.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).toLowerCase().includes(term)) ||
        Boolean(i.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).includes(term));
    }

    const matchesPartner = selectedPartner ? i.contract?.partner_id === selectedPartner : true;
    const matchesLocation = selectedLocation ? i.contract?.billing_location === selectedLocation : true;

    let matchesDate = true;
    if (filterPeriodo.start || filterPeriodo.end) {
      const dateToCheck = i.paid_at ? new Date(i.paid_at) : (i.due_date ? new Date(i.due_date) : null);
      if (dateToCheck) {
        if (filterPeriodo.start && dateToCheck < new Date(filterPeriodo.start)) matchesDate = false;
        if (filterPeriodo.end) {
          const end = new Date(filterPeriodo.end);
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
    setNfIssueDate(installment.nf_issue_date ? installment.nf_issue_date.split('T')[0] : todayStr);
    setNfDueDate(installment.due_date ? installment.due_date.split('T')[0] : todayStr);
    setBillingDate(installment.paid_at ? installment.paid_at.split('T')[0] : todayStr);
    setNfNumber(installment.nf_number || '');
    setNfLocation(installment.nf_location || '');
    setNfNature(installment.nf_nature || '');
    
    setNfIrpj(installment.tax_irpj ? maskMoney(installment.tax_irpj.toFixed(2).replace('.', ',')) : '');
    setNfPis(installment.tax_pis ? maskMoney(installment.tax_pis.toFixed(2).replace('.', ',')) : '');
    setNfCofins(installment.tax_cofins ? maskMoney(installment.tax_cofins.toFixed(2).replace('.', ',')) : '');
    setNfCsll(installment.tax_csll ? maskMoney(installment.tax_csll.toFixed(2).replace('.', ',')) : '');

    let formattedNfValue = '';
    if (installment.nf_value) {
      formattedNfValue = maskMoney(installment.nf_value.toFixed(2).replace('.', ','));
    } else if (installment.amount) {
      // Se não tem valor NF definido, insere o valor da parcela como sugestão
      formattedNfValue = maskMoney(installment.amount.toFixed(2).replace('.', ','));
    }
    setNfValue(formattedNfValue);
    
    setIsDateModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedInstallment) return;
    
    // Atualiza a parcela com a data de pagamento, status de pago e número da NF
    await supabase.from('financial_installments')
      .update({ 
        status: 'paid', 
        paid_at: billingDate,
        due_date: nfDueDate || selectedInstallment.due_date,
        nf_issue_date: nfIssueDate || null,
        nf_number: nfNumber || null,
        nf_location: nfLocation || null,
        nf_nature: nfNature || null,
        nf_value: nfValue ? parseCurrency(nfValue) : null,
        tax_irpj: nfIrpj ? parseCurrency(nfIrpj) : null,
        tax_pis: nfPis ? parseCurrency(nfPis) : null,
        tax_cofins: nfCofins ? parseCurrency(nfCofins) : null,
        tax_csll: nfCsll ? parseCurrency(nfCsll) : null,
        net_value: nfNetValue ? parseCurrency(nfNetValue) : null
      })
      .eq('id', selectedInstallment.id);
      
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
        .from('ged-documentos')
        .download(doc.file_path);

      if (downloadError) throw downloadError;

      if (fileData) {
        const url = URL.createObjectURL(fileData);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name || 'documento.pdf';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erro ao gerar arquivo.');
      }

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
      'Data Faturamento': i.paid_at ? new Date(i.paid_at).toLocaleDateString() : '-',
      'Nota Fiscal': i.nf_number || '-'
    }));
    exportToStandardXLSX(
      [{ sheetName: "Financeiro", data, colWidths: [15, 30, 20, 20, 15, 12, 18, 15, 15, 18, 15] }],
      "Relatorio_Financeiro.xlsx"
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPartner('');
    setSelectedLocation('');
    setStatusFilter('all');
    setFilterPeriodo({ start: '', end: '' });
  };

  const hasActiveFilters = searchTerm || selectedPartner || selectedLocation || statusFilter !== 'all' || filterPeriodo.start || filterPeriodo.end;

  const statusOptions = [
    { label: 'Todos Status', value: 'all' },
    { label: 'A Faturar', value: 'pending' },
    { label: 'Faturado', value: 'paid' },
    { label: 'Vencidos', value: 'overdue' },
  ];


  // FilterBar: categorias, chips, count
  const filterCategories = useMemo((): FilterCategory[] => [
    {
      key: 'partner',
      label: 'Sócio',
      icon: Briefcase,
      type: 'single',
      options: partners.map(p => ({ label: p.name, value: p.id })),
      value: selectedPartner,
      onChange: (val: string) => setSelectedPartner(val),
    },
    {
      key: 'status',
      label: 'Status',
      icon: Clock,
      type: 'single',
      options: statusOptions.filter(o => o.value !== 'all'),
      value: statusFilter === 'all' ? '' : statusFilter,
      onChange: (val: string) => setStatusFilter(val || 'all'),
    },
    {
      key: 'location',
      label: 'Local',
      icon: MapPin,
      type: 'single',
      options: locations.map(l => ({ label: l, value: l })),
      value: selectedLocation,
      onChange: (val: string) => setSelectedLocation(val),
    },
    {
      key: 'periodo',
      label: 'Período',
      icon: CalendarDays,
      type: 'date_range',
      value: filterPeriodo,
      onChange: setFilterPeriodo,
    },
  ], [selectedPartner, statusFilter, selectedLocation, filterPeriodo, partners, locations]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedPartner) count++;
    if (statusFilter !== 'all') count++;
    if (selectedLocation) count++;
    if (filterPeriodo.start || filterPeriodo.end) count++;
    return count;
  }, [selectedPartner, statusFilter, selectedLocation, filterPeriodo]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (selectedPartner) {
      const name = partners.find(p => p.id === selectedPartner)?.name || selectedPartner;
      chips.push({ key: 'partner', label: `Sócio: ${name}`, onClear: () => setSelectedPartner('') });
    }
    if (statusFilter !== 'all') {
      const label = statusOptions.find(o => o.value === statusFilter)?.label || statusFilter;
      chips.push({ key: 'status', label: `Status: ${label}`, onClear: () => setStatusFilter('all') });
    }
    if (selectedLocation) {
      chips.push({ key: 'location', label: `Local: ${selectedLocation}`, onClear: () => setSelectedLocation('') });
    }
    if (filterPeriodo.start || filterPeriodo.end) {
      let label = 'Período: ';
      if (filterPeriodo.start && filterPeriodo.end) {
         label += `${new Date(filterPeriodo.start + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(filterPeriodo.end + 'T12:00:00').toLocaleDateString('pt-BR')}`;
      } else if (filterPeriodo.start) {
         label += `A partir de ${new Date(filterPeriodo.start + 'T12:00:00').toLocaleDateString('pt-BR')}`;
      } else if (filterPeriodo.end) {
         label += `Até ${new Date(filterPeriodo.end + 'T12:00:00').toLocaleDateString('pt-BR')}`;
      }
      chips.push({
        key: 'periodo',
        label,
        onClear: () => setFilterPeriodo({ start: '', end: '' })
      });
    }
    return chips;
  }, [selectedPartner, statusFilter, selectedLocation, filterPeriodo, partners]);

  const clearAllFilters = () => {
    clearFilters();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Controle Financeiro</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão de faturamento e recebíveis</p>
          </div>
        </div>

        {/* Ícones redondos */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
            title="Exportar XLSX"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleNewInvoice}
            className="flex items-center justify-center w-10 h-10 bg-[#1e3a8a] text-white rounded-full hover:bg-[#112240] transition-all shadow-lg shadow-blue-500/30"
            title="Novo Lançamento"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Cards de Totais */}
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

      {/* 3. FilterBar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={filterCategories}
        activeFilterChips={activeFilterChips}
        activeFilterCount={activeFilterCount}
        onClearAll={clearAllFilters}
      />

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
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[1000px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                      <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">ID</th>
                      <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                      <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Data</th>
                      <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Cliente</th>
                      <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">HON</th>
                      <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Tipo</th>
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
                          <div className="flex justify-end gap-1 opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); handleEditDueDate(item); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-all" title="Alterar Vencimento"><CalendarDays className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDownloadContractPDF(item.contract!.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-all" title="Baixar Contrato"><FileDown className="w-4 h-4" /></button>

                            {item.status === 'pending' ? (
                              <button onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(item); }} className="ml-2 bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-100 text-[9px] font-black uppercase tracking-widest flex items-center transition-all">
                                <DollarSign className="w-3 h-3 mr-1" /> Faturar
                              </button>
                            ) : (
                              <div className="ml-2 bg-emerald-50/50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Faturado
                              </div>
                            )}
                          </div>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
      {isDateModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-[#0a192f]/40 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDateModalOpen(false);
          }}
        >
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-3xl animate-in zoom-in-95 border border-gray-100 relative">
            <button 
              onClick={() => setIsDateModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1.5 transition-all"
            >
              <X className="w-5 h-5 pointer-events-none" />
            </button>

            <h3 className="text-lg font-black text-[#0a192f] mb-2 uppercase tracking-tight">Confirmar Faturamento</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Confirma o recebimento desta parcela e informações fiscais?</p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Emissão</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-700 focus:border-[#1e3a8a] outline-none transition-all" value={nfIssueDate} onChange={(e) => setNfIssueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Vencimento</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-700 focus:border-[#1e3a8a] outline-none transition-all" value={nfDueDate} onChange={(e) => setNfDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Pagamento</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-700 focus:border-[#1e3a8a] outline-none transition-all" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Local do Fat.</label>
                  <div className="relative">
                    <select className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#1e3a8a] outline-none transition-all bg-white shadow-sm hover:border-gray-300" value={nfLocation} onChange={(e) => setNfLocation(e.target.value)}>
                      <option value="">Selecione...</option>
                      {officeLocations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Natureza</label>
                  <div className="relative">
                    <select className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#1e3a8a] outline-none transition-all bg-white shadow-sm hover:border-gray-300" value={nfNature} onChange={(e) => setNfNature(e.target.value)}>
                      <option value="">Selecione...</option>
                      <option value="COND">COND</option>
                      <option value="EXT">EXT</option>
                      <option value="PF">PF</option>
                      <option value="PJ">PJ</option>
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">NF (Opcional)</label>
                  <input type="text" placeholder="Nº NF/Boleto" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] focus:border-[#1e3a8a] shadow-sm hover:border-gray-300 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal" value={nfNumber} onChange={(e) => setNfNumber(e.target.value)} />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Valor Bruto (R$)</label>
                  <input type="text" className="w-full border border-[#1e3a8a]/20 bg-blue-50/30 rounded-xl p-3 text-sm font-black text-[#1e3a8a] focus:border-[#1e3a8a] outline-none transition-all" placeholder="R$ 0,00" value={nfValue} onChange={(e) => setNfValue(maskMoney(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-2">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">IRPJ (R$)</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] shadow-sm hover:border-gray-300 focus:border-[#1e3a8a] outline-none transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="R$ 0,00" value={nfIrpj} onChange={(e) => setNfIrpj(maskMoney(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">PIS (R$)</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] shadow-sm hover:border-gray-300 focus:border-[#1e3a8a] outline-none transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="R$ 0,00" value={nfPis} onChange={(e) => setNfPis(maskMoney(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">COFINS (R$)</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] shadow-sm hover:border-gray-300 focus:border-[#1e3a8a] outline-none transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="R$ 0,00" value={nfCofins} onChange={(e) => setNfCofins(maskMoney(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">CSLL (R$)</label>
                  <input type="text" className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold text-[#0a192f] shadow-sm hover:border-gray-300 focus:border-[#1e3a8a] outline-none transition-all placeholder:text-gray-400 placeholder:font-normal" placeholder="R$ 0,00" value={nfCsll} onChange={(e) => setNfCsll(maskMoney(e.target.value))} />
                </div>
              </div>

              <div className="mt-4 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center transition-all">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Valor Líquido Recebido</span>
                <span className="text-2xl font-black text-emerald-600">R$ {nfNetValue || '0,00'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsDateModalOpen(false)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
              <button onClick={confirmPayment} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-black text-[10px] uppercase tracking-widest transition-all">Confirmar Pagamento</button>
            </div>
          </div>
        </div>
      , document.body)}

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