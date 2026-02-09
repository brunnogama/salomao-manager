import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  DollarSign, Search, Download, CheckCircle2, Circle, Clock, Loader2, 
  CalendarDays, Receipt, X, Filter, MapPin, Hash, FileText, 
  AlertTriangle, Plus, ChevronDown, FileDown, Briefcase
} from 'lucide-react';
import { FinancialInstallment, Partner, Contract, ContractProcess, ContractDocument } from '../../../types/controladoria';
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
        className="flex items-center bg-white px-4 py-2 rounded-xl border border-gray-200 cursor-pointer hover:border-[#0a192f] transition-all select-none shadow-sm h-[44px]"
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

interface FinanceProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Finance({ userName, onModuleHome, onLogout }: FinanceProps) {
  // REMOVER: const navigate = useNavigate();  const navigate = useNavigate();
  
  // --- STATES ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const [installments, setInstallments] = useState<FinancialInstallment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  // NOVO: Modal de Detalhes do Contrato (usando o modal existente do sistema)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedContractData, setSelectedContractData] = useState<Contract | null>(null);
  const [contractProcesses, setContractProcesses] = useState<ContractProcess[]>([]);
  const [contractDocuments, setContractDocuments] = useState<ContractDocument[]>([]);

  useEffect(() => {
    checkUserRole();
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (!searchTerm) setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef, searchTerm]);

  // --- LOGIC ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    const { data: partnersData } = await supabase.from('partners').select('*').order('name');
    if (partnersData) setPartners(partnersData);

    const { data: installmentsData } = await supabase
      .from('financial_installments')
      .select(`
        *,
        contracts (
          id, seq_id, hon_number, client_name, partner_id, billing_location, status,
          partners (name)
        )
      `)
      .order('due_date', { ascending: true });

    if (installmentsData) {
      const activeInstallments = installmentsData.filter((i: any) => i.contracts?.status === 'active');

      const formatted = activeInstallments.map((i: any) => ({
        ...i,
        contract: {
          ...i.contracts,
          partner_name: i.contracts?.partners?.name,
          display_id: i.contracts?.seq_id ? String(i.contracts.seq_id).padStart(6, '0') : '-'
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
    setIsSearchOpen(false);
    
    const overdueCount = installments.filter(i => isOverdue(i)).length;
    toast.info(`Filtrando ${overdueCount} parcela${overdueCount !== 1 ? 's' : ''} vencida${overdueCount !== 1 ? 's' : ''}`, {
      description: 'Exibindo apenas parcelas com vencimento atrasado',
      duration: 3000,
    });
  };

  // NOVA FUNÇÃO: Buscar dados completos do contrato e abrir modal
  const handleOpenContractModal = async (contractId: string) => {
    try {
      // Buscar contrato completo (SEM analyzed_by para evitar erro de relacionamento)
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          partners (name)
        `)
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      // Buscar processos do contrato
      const { data: processesData } = await supabase
        .from('contract_processes')
        .select('*')
        .eq('contract_id', contractId);

      // Buscar documentos do contrato
      const { data: documentsData } = await supabase
        .from('contract_documents')
        .select('*')
        .eq('contract_id', contractId)
        .order('uploaded_at', { ascending: false });

      // Buscar nome do analista separadamente (se existir analyzed_by)
      let analyzedByName = null;
      if (contractData.analyzed_by) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', contractData.analyzed_by)
          .single();
        
        analyzedByName = profileData?.name;
      }

      // Formatar dados do contrato
      const formattedContract: Contract = {
        ...contractData,
        partner_name: contractData.partners?.name,
        analyzed_by_name: analyzedByName,
        display_id: contractData.seq_id ? String(contractData.seq_id).padStart(6, '0') : '-'
      };

      setSelectedContractData(formattedContract);
      setContractProcesses(processesData || []);
      setContractDocuments(documentsData || []);
      setSelectedContractId(contractId);
      setIsContractModalOpen(true);
    } catch (error: any) {
      console.error('Erro ao carregar contrato:', error);
      toast.error('Erro ao carregar detalhes do contrato');
    }
  };

  // --- FILTROS ---
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

  // --- TOTAIS E CÁLCULOS ---
  const totalPending = filteredInstallments.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = filteredInstallments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPendingCount = filteredInstallments.filter(i => i.status === 'pending').length;
  const totalOverdueCount = installments.filter(i => isOverdue(i)).length;

  // --- AÇÕES ---
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
      // Buscar documentos do contrato
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

      // Pegar o primeiro documento (mais recente)
      const doc = documents[0];

      // Download do arquivo do Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('contract-documents')
        .download(doc.file_path);

      if (downloadError) throw downloadError;

      // Criar URL e fazer download
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
      toast.error('Erro ao baixar documento: ' + (error.message || 'Erro desconhecido'));
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
      setIsSearchOpen(false);
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
    <div className="p-8 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-amber-500" /> Fluxo Financeiro
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão centralizada de recebíveis e faturamento.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <FilterSelect icon={Filter} value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="Status" />
            <FilterSelect icon={MapPin} value={selectedLocation} onChange={setSelectedLocation} options={locationOptions} placeholder="Locais" />
            <FilterSelect icon={Briefcase} value={selectedPartner} onChange={setSelectedPartner} options={partnerOptions} placeholder="Sócios" />
            
            {userRole !== 'viewer' && (
                <button onClick={handleNewInvoice} className="bg-[#0a192f] hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center text-[10px] font-black uppercase tracking-widest h-[44px] active:scale-95">
                    <Plus className="w-4 h-4 mr-2 text-amber-500" /> Novo Registro
                </button>
            )}
        </div>
      </div>

      {/* CARDS DE TOTAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={totalOverdueCount > 0 ? handleFilterOverdue : undefined}
          className={`p-6 rounded-[2rem] border transition-all duration-500 ${
            totalOverdueCount > 0 
              ? 'bg-red-50/50 border-red-100 cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]' 
              : 'bg-white border-gray-100 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 ${totalOverdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    Parcelas a Receber
                </p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-[#0a192f]">{totalPendingCount}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lançamentos</span>
                </div>
                {totalOverdueCount > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-100/50 px-3 py-1.5 rounded-lg border border-red-200 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{totalOverdueCount} em atraso</span>
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-2xl ${totalOverdueCount > 0 ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-gray-50 text-gray-300'}`}>
                <Hash className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Pendente Global</p>
              <h3 className="text-3xl font-black text-[#0a192f]">{totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl"><Clock className="w-6 h-6" /></div>
        </div>

        <div className="bg-[#0a192f] p-6 rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-between">
          <div>
              <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-2">Total Faturado</p>
              <h3 className="text-3xl font-black text-white">{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
          <div className="p-4 bg-white/10 text-amber-500 rounded-2xl"><CheckCircle2 className="w-6 h-6" /></div>
        </div>
      </div>

      {/* BARRA DE CONTROLES */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm items-center justify-between">
         <div className="flex items-center gap-4 pr-6 border-r border-gray-100 mr-2 min-w-[220px]">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Receipt className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Total Lançamentos</p>
                <p className="text-2xl font-black text-[#0a192f] leading-none mt-1">{filteredInstallments.length}</p>
            </div>
         </div>

         <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end flex-1">
            <div 
              ref={searchRef}
              className={`flex items-center overflow-hidden transition-all duration-500 ease-in-out bg-white ${isSearchOpen ? 'w-72 border-[#0a192f] shadow-xl px-4 rounded-xl' : 'w-11 border-transparent justify-center cursor-pointer hover:bg-gray-100 rounded-xl'} h-[44px] border`}
              onClick={() => !isSearchOpen && setIsSearchOpen(true)}
            >
                <Search className={`w-5 h-5 text-gray-400 shrink-0 ${isSearchOpen ? 'text-[#0a192f]' : ''}`} />
                <input
                    type="text"
                    placeholder="BUSCAR CLIENTE OU ID..."
                    className={`ml-3 bg-transparent outline-none text-[10px] font-bold uppercase tracking-widest w-full text-[#0a192f] placeholder:text-gray-300 ${!isSearchOpen && 'hidden'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus={isSearchOpen}
                />
                {isSearchOpen && searchTerm && (
                    <button onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }} className="ml-2 text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                )}
            </div>

            <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-200 h-[44px]">
                 <span className="text-[9px] font-black text-gray-400 uppercase mr-2">De</span>
                 <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[11px] font-bold text-[#0a192f] outline-none w-[115px] cursor-pointer" />
              </div>
              <div className="flex items-center bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-200 h-[44px]">
                 <span className="text-[9px] font-black text-gray-400 uppercase mr-2">Até</span>
                 <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[11px] font-bold text-[#0a192f] outline-none w-[115px] cursor-pointer" />
              </div>
            </div>

            <button onClick={exportToExcel} className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all text-[10px] font-black uppercase tracking-widest h-[44px] shadow-sm">
                <Download className="w-4 h-4 mr-2" /> XLS
            </button>

            {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition-all h-[44px]" title="Limpar Filtros">
                    <X className="w-5 h-5" />
                </button>
            )}
         </div>
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex flex-col justify-center items-center p-20 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a192f]"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando dados...</p>
        </div>
      ) : filteredInstallments.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 min-h-[400px] flex items-center justify-center">
               <EmptyState
                  icon={Receipt}
                  title="Lançamentos inexistentes"
                  description={hasActiveFilters ? "Nenhum resultado para os parâmetros aplicados." : "O módulo financeiro está sincronizado, porém não há lançamentos cadastrados para os filtros atuais."}
                  actionLabel={hasActiveFilters ? "Limpar Filtros" : undefined}
                  onAction={hasActiveFilters ? clearFilters : undefined}
               />
          </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-[#0a192f] text-white">
                <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest pl-8">ID</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Vencimento</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Cliente</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Contrato / Base</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Tipo / Parcela</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest">Sócio Resp.</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Valor</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right pr-8">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInstallments.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    onClick={() => handleOpenContractModal(item.contract!.id)}
                  >
                    <td className="p-4 pl-8 font-black text-[10px] text-gray-300 tracking-widest">{(item.contract as any)?.display_id}</td>
                    <td className="p-4">
                      {item.status === 'paid' 
                        ? <span className="flex items-center text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1.5" /> Faturado</span> 
                        : <span className="flex items-center text-amber-600 font-black text-[9px] uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg border border-amber-100"><Circle className="w-3 h-3 mr-1.5" /> Pendente</span>
                      }
                    </td>
                    <td className="p-4">
                      {item.paid_at ? (
                        <span className="text-emerald-600 font-bold text-[10px]">PAG: {new Date(item.paid_at).toLocaleDateString()}</span>
                      ) : (
                        <span className={`text-[10px] font-black tracking-widest uppercase ${isOverdue(item) ? "text-red-600 flex items-center" : "text-gray-700"}`}>
                          {isOverdue(item) && <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />}
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-black text-[#0a192f] uppercase tracking-tight">{item.contract?.client_name}</td>
                    <td className="p-4">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">HON: {item.contract?.hon_number || '-'}</div>
                        <div className="text-[9px] text-gray-400 truncate max-w-[150px] uppercase font-bold">{(item as any).clause}</div>
                    </td>
                    <td className="p-4">
                        <div className="text-[10px] font-black text-[#0a192f] uppercase tracking-tight">{getTypeLabel(item.type)}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Parc. {item.installment_number}/{item.total_installments}</div>
                    </td>
                    <td className="p-4">
                        <div className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest">{item.contract?.partner_name || '-'}</div>
                        <div className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">{item.contract?.billing_location || '-'}</div>
                    </td>
                    <td className="p-4 text-right font-black text-[#0a192f] text-xs">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-4 text-right pr-8">
                      {item.status === 'pending' && userRole !== 'viewer' && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); handleEditDueDate(item); }} className="p-2 text-blue-500 hover:bg-white hover:shadow-sm rounded-xl transition-all" title="Ajustar Vencimento"><CalendarDays className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadContractPDF(item.contract!.id); }} className="p-2 text-gray-400 hover:text-[#0a192f] hover:bg-white hover:shadow-sm rounded-xl transition-all" title="Baixar Contrato"><FileDown className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(item); }} className="ml-2 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md">Confirmar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    toast.info('Para editar este contrato, acesse o módulo Contratos');
    setIsContractModalOpen(false);
  }}
          onDelete={() => {
            // Função de deletar (se necessário)
            toast.info('Função de exclusão não implementada');
          }}
          processes={contractProcesses}
          documents={contractDocuments}
          canEdit={userRole === 'admin' || userRole === 'editor'}
          canDelete={userRole === 'admin'}
        />
      )}

      {/* MODAL: DATA DE FATURAMENTO */}
      {isDateModalOpen && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 animate-in zoom-in-95">
            <div className="p-8 border-b border-gray-100 bg-[#0a192f]">
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Confirmar Recebimento</h3>
            </div>
            <div className="p-8 bg-gray-50/50">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6">Confirma o recebimento desta parcela?</p>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data do Recebimento</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white" value={billingDate} onChange={(e) => setBillingDate(e.target.value)}/>
            </div>
            <div className="p-6 bg-white flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setIsDateModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={confirmPayment} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl shadow-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR VENCIMENTO */}
      {isDueDateModalOpen && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 animate-in zoom-in-95">
            <div className="p-8 border-b border-gray-100 bg-[#0a192f]">
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Ajustar Vencimento</h3>
            </div>
            <div className="p-8 bg-gray-50/50">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nova Data de Vencimento</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl p-4 text-sm font-bold text-[#0a192f] focus:border-[#0a192f] outline-none shadow-sm transition-all bg-white" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}/>
            </div>
            <div className="p-6 bg-white flex justify-end gap-3 border-t border-gray-100">
              <button onClick={() => setIsDueDateModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={confirmDueDateChange} className="px-6 py-2.5 bg-[#0a192f] text-white rounded-xl shadow-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}