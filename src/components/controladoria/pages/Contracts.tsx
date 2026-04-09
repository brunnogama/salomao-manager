import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus, Filter, Calendar, User, Briefcase,
  Loader2,
  FileDown, Bell,
  FileSignature, FileSearch
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

import { Contract, Partner, ContractProcess, TimelineEvent, Analyst } from '../../../types/controladoria';
import { ContractFormModal } from '../contracts/ContractFormModal';
import { ContractDetailsModal } from '../contracts/ContractDetailsModal';
import { PartnerManagerModal } from '../partners/PartnerManagerModal';
import { AnalystManagerModal } from '../analysts/AnalystManagerModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { parseCurrency, safeDate } from '../utils/masks';
import { FilterBar, FilterCategory } from '../../collaborators/components/FilterBar';
import { useDatabaseSync } from '../../../hooks/useDatabaseSync';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'rascunho': return 'bg-slate-800 text-white border-slate-700 shadow-md font-bold';
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'analysis': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'proposal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'probono': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'baixado': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'rascunho': return 'Rascunho';
    case 'active': return 'Contrato Fechado';
    case 'analysis': return 'Sob Análise';
    case 'proposal': return 'Proposta Enviada';
    case 'rejected': return 'Rejeitada';
    case 'probono': return 'Probono';
    case 'baixado': return 'Baixado';
    default: return status;
  }
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

const getSuccessDisplay = (c: Contract) => {
  let totalBrl = 0;
  const otherParts: string[] = [];

  const processFee = (val: string | undefined | null) => {
    if (!val) return;
    const str = String(val).trim();
    if (str === 'R$ 0,00' || str === '0%' || str === '0' || str === '') return;
    if (str.includes('%') || (str.includes('$') && !str.includes('R$')) || str.includes('€')) {
      otherParts.push(str);
      return;
    }
    totalBrl += parseCurrency(str);
  };

  processFee(c.final_success_fee);
  processFee((c as any).final_success_percent);
  if ((c as any).final_success_extras && Array.isArray((c as any).final_success_extras)) {
    (c as any).final_success_extras.forEach(processFee);
  }
  if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
    c.intermediate_fees.forEach(processFee);
  }
  if ((c as any).percent_extras && Array.isArray((c as any).percent_extras)) {
    (c as any).percent_extras.forEach(processFee);
  }

  const parts = [];
  if (totalBrl > 0 || (totalBrl === 0 && otherParts.length === 0)) {
    parts.push(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBrl));
  }
  if (otherParts.length > 0) parts.push(...otherParts);
  return parts.join(' + ');
};



const getProLaboreDisplay = (c: Contract) => {
  let totalBrl = 0;
  const otherParts: string[] = [];

  const processFee = (val: string | undefined | null) => {
    if (!val) return;
    const str = String(val).trim();
    if (str === 'R$ 0,00' || str === '0%' || str === '0' || str === '') return;
    if (str.includes('%') || (str.includes('$') && !str.includes('R$')) || str.includes('€')) {
      otherParts.push(str);
      return;
    }
    totalBrl += parseCurrency(str);
  };

  processFee(c.pro_labore);
  if ((c as any).pro_labore_extras && Array.isArray((c as any).pro_labore_extras)) {
    (c as any).pro_labore_extras.forEach(processFee);
  }

  const parts = [];
  if (totalBrl > 0 || (totalBrl === 0 && otherParts.length === 0)) {
    parts.push(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBrl));
  }
  if (otherParts.length > 0) parts.push(...otherParts);
  return parts.join(' + ');
};

export function Contracts() {


  const [contracts, setContracts] = useState<Contract[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);


  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState(location.state?.status || '');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState<{ start: string; end: string }>({ start: '', end: '' });



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
    fetchData();
    fetchNotifications();
  }, []);

  useDatabaseSync(() => {
    fetchData();
    fetchNotifications();
  }, ['contracts']);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        // Search bar is always visible, so no need to manage open state
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef, searchTerm]);



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
        process_count: c.processes?.length || 0
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
    setFormData(emptyContract);
    setProcesses([]);
    setCurrentProcess({ process_number: '' });
    setTimelineData([]);
    setIsEditing(false);
    setNewIntermediateFee('');
    setIsModalOpen(true);
  };

  const fetchContractDetailsData = async (contractId: string) => {
    const [procRes, timeRes] = await Promise.all([
      supabase.from('contract_processes').select('*').eq('contract_id', contractId),
      supabase.from('contract_timeline').select('*').eq('contract_id', contractId).order('changed_at', { ascending: false })
    ]);
    return {
      processes: procRes.data?.map((p: any) => ({
        ...p,
        cause_value: p.value_of_cause ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value_of_cause) : ''
      })) || [],
      timeline: timeRes.data || []
    };
  };

  const handleView = async (contract: Contract) => {
    setFormData(contract);
    if (contract.id) {
      const data = await fetchContractDetailsData(contract.id);
      setProcesses(data.processes);
      setTimelineData(data.timeline);
    }
    setNewIntermediateFee('');
    setIsDetailsModalOpen(true);
  };

  const handleNext = async () => {
    const currentIndex = filteredContracts.findIndex((c: Contract) => c.id === formData.id);
    if (currentIndex >= 0 && currentIndex < filteredContracts.length - 1) {
      const nextContract = filteredContracts[currentIndex + 1];
      setFormData(nextContract);
      if (nextContract.id) {
        const data = await fetchContractDetailsData(nextContract.id);
        setProcesses(data.processes);
        setTimelineData(data.timeline);
      }
      setNewIntermediateFee('');
    }
  };

  const handlePrev = async () => {
    const currentIndex = filteredContracts.findIndex((c: Contract) => c.id === formData.id);
    if (currentIndex > 0) {
      const prevContract = filteredContracts[currentIndex - 1];
      setFormData(prevContract);
      if (prevContract.id) {
        const data = await fetchContractDetailsData(prevContract.id);
        setProcesses(data.processes);
        setTimelineData(data.timeline);
      }
      setNewIntermediateFee('');
    }
  };

  const handleEdit = () => {
    setIsDetailsModalOpen(false);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const triggerDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsConfirmModalOpen(true);
  };

  const handleDelete = () => {
    if (!formData.id) return;
    triggerDelete(formData.id);
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
    // Se não tiver número, mas for um tipo não judicial (opcional), podemos permitir ou exigir algo
    if (!currentProcess.process_number && !currentProcess.court) return;

    if (editingProcessIndex !== null) {
      const updated = [...processes];
      updated[editingProcessIndex] = currentProcess;
      setProcesses(updated);
      setEditingProcessIndex(null);
    } else {
      setProcesses([...processes, currentProcess]);
    }
    // Limpa o objeto completo, não apenas o número
    setCurrentProcess({
      process_number: '',
      opponent: '',
      court: '',
      vara: '',
      uf: '',
      position: '',
      author: '',
      subject: '',
      magistrates: [],
      cause_value: '',
      value_of_cause: 0
    });
  };

  const editProcess = (idx: number) => {
    setCurrentProcess(processes[idx]);
    setEditingProcessIndex(idx);
  };

  const cancelEditProcess = () => {
    setEditingProcessIndex(null);
    setCurrentProcess({
      process_number: '',
      opponent: '',
      court: '',
      vara: '',
      uf: '',
      position: '',
      author: '',
      subject: '',
      magistrates: [],
      cause_value: '',
      value_of_cause: 0
    });
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
      case 'rascunho': return c.created_at;
      case 'analysis': return c.prospect_date || c.created_at;
      case 'proposal': return c.proposal_date || c.created_at;
      case 'active': return c.contract_date || c.created_at;
      case 'rejected': return c.rejection_date || c.created_at;
      case 'probono': return c.probono_date || c.contract_date || c.created_at;
      case 'baixado': return c.updated_at || c.contract_date || c.created_at;
      default: return c.created_at;
    }
  };

  const filteredContracts = contracts.filter((c: Contract) => {
    const term = searchTerm.toLowerCase().trim();
    const numericTerm = term.replace(/\D/g, '');

    const matchesSearch = !term ? true :
      Boolean(c.client_name?.toLowerCase().includes(term)) ||
      Boolean(c.hon_number?.toLowerCase().includes(term)) ||
      Boolean(numericTerm && c.hon_number?.replace(/\D/g, '').includes(numericTerm)) ||
      Boolean(c.proposal_code?.toLowerCase().includes(term)) ||
      Boolean(c.cnpj?.includes(term)) ||
      Boolean(numericTerm && c.cnpj?.replace(/\D/g, '').includes(numericTerm)) ||
      Boolean(c.display_id?.includes(term)) ||
      c.observations?.toLowerCase().includes(term) ||
      c.reference?.toLowerCase().includes(term) ||
      c.partner_name?.toLowerCase().includes(term) ||
      c.analyzed_by_name?.toLowerCase().includes(term) ||
      (Array.isArray(c.processes) && c.processes.some(p =>
        p.process_number.toLowerCase().includes(term) ||
        p.author?.toLowerCase().includes(term) ||
        p.opponent?.toLowerCase().includes(term) ||
        p.court?.toLowerCase().includes(term) ||
        p.vara?.toLowerCase().includes(term) ||
        p.comarca?.toLowerCase().includes(term) ||
        (Array.isArray(p.magistrates) && p.magistrates.some((m: any) => m?.name?.toLowerCase().includes(term)))
      ));

    const matchesStatus = statusFilter === '' || c.status === statusFilter;
    const matchesPartner = partnerFilter === '' || c.partner_id === partnerFilter;

    let matchesDate = true;
    if (filterPeriodo.start || filterPeriodo.end) {
      const relevantDateStr = getRelevantDate(c);
      if (relevantDateStr) {
        const relevantDate = safeDate(relevantDateStr);
        if (relevantDate) {
          relevantDate.setHours(0, 0, 0, 0);

          if (filterPeriodo.start) {
            const start = safeDate(filterPeriodo.start);
            if (start) {
              start.setHours(0, 0, 0, 0);
              if (relevantDate < start) matchesDate = false;
            }
          }

          if (filterPeriodo.end) {
            const end = safeDate(filterPeriodo.end);
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
  }).sort((a: Contract, b: Contract) => {
    if (a.status === 'rascunho' && b.status !== 'rascunho') return -1;
    if (a.status !== 'rascunho' && b.status === 'rascunho') return 1;

    const da = safeDate(getRelevantDate(a)) || new Date(0);
    const db = safeDate(getRelevantDate(b)) || new Date(0);
    return db.getTime() - da.getTime(); // newest to oldest
  });

  const getPartnerDisplay = (c: Contract) => {
    let text = c.partner_name || '-';
    if (c.co_partner_ids && c.co_partner_ids.length > 0) {
      const coNames = c.co_partner_ids.map(id => partners.find(p => p.id === id)?.name).filter(Boolean);
      if (coNames.length > 0) {
        text += ` + ${coNames.join(', ')}`;
      }
    }
    return text;
  };

  const getHonDisplay = (c: Contract) => {
    if (c.status === 'proposal') return c.proposal_code || '-';
    if (c.status === 'active') {
      if (!c.hon_number) return '-';
      return c.hon_number.toUpperCase().startsWith('HON') ? c.hon_number : `HON - ${c.hon_number}`;
    }
    return c.hon_number || c.proposal_code || '-';
  };

  const exportToExcel = async () => {
    toast.info('Coletando dados e convertendo moedas...', { duration: 3000 });
    let usdRate = 5.0;
    let eurRate = 5.4;
    try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
        const data = await res.json();
        if (data && data.USDBRL) usdRate = parseFloat(data.USDBRL.ask);
        if (data && data.EURBRL) eurRate = parseFloat(data.EURBRL.ask);
    } catch(e) {
        console.warn('Falha ao buscar cotacao, valores base mantidos', e);
    }
    let sumPro = 0;
    let sumOther = 0;
    let sumFixed = 0;
    let sumInter = 0;
    let sumFinal = 0;
    let sumTotalSuccess = 0;
    let sumTotalContrato = 0;

    const header = [
      'ID', 'Status', 'Cliente', 'Sócio', 'HON/PROP', 'Data Relevante', 'Local Faturamento',
      'Total Pró-Labore', 'Total Êxito Intermediário', 'Total Êxito Final', 'Total Outros Honorários', 'Fixo Mensal', 'Timesheet (Previsto)', 'Timesheet (Realizado)', 'Data Pagtº (Realizado)', 'Total Contrato',
      'Valores em %',
      'Posição do Cliente', 'Nº Processo', 'UF (Processo)', 'Tribunal', 'Comarca', 'Vara',
      'Autor', 'CNPJ Autor', 'Réu / Parte Adversa', 'CNPJ Réu', 'Assunto / Objeto',
      'Valor da Causa', 'Magistrados',
      'Observações'
    ];

    const rows: any[] = [];

    filteredContracts.forEach(c => {
      const foreignCurrencies: string[] = [];
      const percentsList: string[] = [];
      const processField = (val: string | undefined | null) => {
         if (!val) return 0;
         const str = String(val).trim();
         if (str === '0%' || str === '0' || str === '' || str === 'R$ 0,00') return 0;
         
         const percentMatch = str.match(/(\d+(?:[.,]\d+)?\s*%)/g);
         if (percentMatch) {
             percentMatch.forEach(p => percentsList.push(p));
         }

         const eurMatch = str.match(/(?:€|EUR)\s*([\d\.]+(?:,\d{2})?)/i);
         if (eurMatch) {
             const clean = eurMatch[1].replace(/\./g, '').replace(',', '.');
             const parsed = parseFloat(clean);
             if (!isNaN(parsed)) {
                 foreignCurrencies.push(`€ ${eurMatch[1]}`);
                 return parsed * eurRate;
             }
         }

         const usdMatch = str.match(/(?:U\$|US\$|USD|U\$\$)\s*([\d\.]+(?:,\d{2})?)/i);
         if (usdMatch) {
             const clean = usdMatch[1].replace(/\./g, '').replace(',', '.');
             const parsed = parseFloat(clean);
             if (!isNaN(parsed)) {
                 foreignCurrencies.push(`US$ ${usdMatch[1]}`);
                 return parsed * usdRate;
             }
         }

         const brlMatch = str.match(/R\$\s*([\d\.]+(?:,\d{2})?)/);
         if (brlMatch) {
             const clean = brlMatch[1].replace(/\./g, '').replace(',', '.');
             const parsed = parseFloat(clean);
             if (!isNaN(parsed)) return parsed;
         }
         
         let noPercentStr = str.replace(/(\d+(?:[.,]\d+)?\s*%)/g, '');
         noPercentStr = noPercentStr.replace(/^[\w\.\(\)]+\s*-\s*/, '');
         return parseCurrency(noPercentStr);
      };

      let vPro = processField(c.pro_labore);
      if ((c as any).pro_labore_extras && Array.isArray((c as any).pro_labore_extras)) {
        (c as any).pro_labore_extras.forEach((f: string) => vPro += processField(f));
      }

      let vOther = processField(c.other_fees);
      if ((c as any).other_fees_extras && Array.isArray((c as any).other_fees_extras)) {
        (c as any).other_fees_extras.forEach((f: string) => vOther += processField(f));
      }

      let vFixed = processField(c.fixed_monthly_fee);
      if ((c as any).fixed_monthly_extras && Array.isArray((c as any).fixed_monthly_extras)) {
        (c as any).fixed_monthly_extras.forEach((f: string) => vFixed += processField(f));
      }

      let vFinal = processField(c.final_success_fee);
      if ((c as any).final_success_extras && Array.isArray((c as any).final_success_extras)) {
        (c as any).final_success_extras.forEach((f: string) => vFinal += processField(f));
      }

      const successPercentVal = (c as any).final_success_percent;
      if (successPercentVal && String(successPercentVal).trim() !== '0%') {
          if (String(successPercentVal).includes('%')) percentsList.push(String(successPercentVal));
          else percentsList.push(String(successPercentVal) + '%');
      }

      let vInter = 0;
      if (c.intermediate_fees && Array.isArray(c.intermediate_fees)) {
        c.intermediate_fees.forEach((f: string) => vInter += processField(f));
      }
      
      if ((c as any).percent_extras && Array.isArray((c as any).percent_extras)) {
          (c as any).percent_extras.forEach((f: string) => {
              if (f && f !== '0%') {
                 if (f.includes('%')) percentsList.push(f);
                 else percentsList.push(f + '%');
              }
          });
      }

      const vTimesheetForecast = (c as any).timesheet ? processField((c as any).timesheet_forecast_value) : 0;
      const vTimesheetRealized = (c as any).timesheet ? processField((c as any).timesheet_realized_value) : 0;
      const vTimesheetConsidered = vTimesheetRealized > 0 ? vTimesheetRealized : vTimesheetForecast;

      const vTotalSuccess = vFinal + vInter;
      const vTotalContrato = vPro + vOther + vFixed + vTotalSuccess + vTimesheetConsidered;
      const percentsStr = percentsList.length > 0 ? percentsList.join(' + ') : '-';

      sumPro += vPro;
      sumOther += vOther;
      sumFixed += vFixed;
      sumInter += vInter;
      sumFinal += vFinal;
      sumTotalContrato += vTotalContrato;

      let sumTimesheetForecast = 0;
      let sumTimesheetRealized = 0;
      if ((c as any).timesheet) {
          sumTimesheetForecast += vTimesheetForecast;
          sumTimesheetRealized += vTimesheetRealized;
      }

      rows.push([
        c.display_id,
        getStatusLabel(c.status),
        c.client_name,
        getPartnerDisplay(c),
        getHonDisplay(c),
        safeDate(getRelevantDate(c))?.toLocaleDateString('pt-BR') || '-',
        c.billing_location || '-',
        vPro,
        vInter,
        vFinal,
        vOther,
        vFixed,
        vTimesheetForecast || 0,
        vTimesheetRealized || 0,
        ((c as any).timesheet_payment_date ? safeDate((c as any).timesheet_payment_date)?.toLocaleDateString('pt-BR') : '') || '-',
        vTotalContrato,
        percentsStr,
        c.client_position || '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.process_number || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.uf || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.court || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.comarca || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.vara || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.author || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.author_cnpj || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.opponent || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.opponent_cnpj || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.subject || '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.value_of_cause ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value_of_cause) : '-').join('\n') : '-',
        c.processes && c.processes.length > 0 ? c.processes.map((p: any) => p.magistrates && Array.isArray(p.magistrates) && p.magistrates.length > 0 ? p.magistrates.map((m: any) => `${m.title || ''} ${m.name}`.trim()).join(' / ') : '-').join('\n') : '-',
        foreignCurrencies.length > 0 
            ? (c.observations ? c.observations + '\n\n' : '') + '⚠️ CONVERSÃO (Cotação do dia): ' + foreignCurrencies.join(' | ') 
            : (c.observations || '-')
      ]);
    });

    const totalRow = [
      'TOTAIS', '', '', '', '', '', '',
      sumPro, sumInter, sumFinal, sumOther, sumFixed, 
      0, // The timesheet sums will be added down the line, but keeping placeholders empty or correct
      0, '', sumTotalContrato,
      '',
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      ''
    ];
    // Fix sum for totalRow
    totalRow[12] = filteredContracts.reduce((acc, c) => acc + ((c as any).timesheet ? parseCurrency((c as any).timesheet_forecast_value) : 0), 0);
    totalRow[13] = filteredContracts.reduce((acc, c) => acc + ((c as any).timesheet ? parseCurrency((c as any).timesheet_realized_value) : 0), 0);

    const dataWithHeader = [header, ...rows, [], totalRow];

    const ws = XLSX.utils.aoa_to_sheet(dataWithHeader);

    const currencyFormat = '"R$" #,##0.00';
    const range = XLSX.utils.decode_range(ws['!ref']!);
    const moneyCols = [7, 8, 9, 10, 11, 12, 13, 15];

    // -- STYLING PADRÃO CORPORATIVO --
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0A192F" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    const colWidths = header.map((_, colIndex) => {
        let maxLen = header[colIndex].length;
        dataWithHeader.forEach(row => {
            const cellVal = row[colIndex];
            if (cellVal !== undefined && cellVal !== null) {
                const len = String(cellVal).split('\n').map(l => l.length).reduce((a, b) => Math.max(a, b), 0);
                if (len > maxLen) maxLen = len;
            }
        });
        return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
    });
    ws['!cols'] = colWidths;
    // -------------------------------

    const obsColIdx = header.indexOf('Observações');

    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellRef]) {
            if (typeof ws[cellRef].v === 'string') {
                ws[cellRef].s = {
                    ...ws[cellRef].s,
                    alignment: { vertical: "center", horizontal: "center", wrapText: true }
                };
            }
        }
      }
      
      moneyCols.forEach(C => {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = currencyFormat;
          ws[cellRef].t = 'n';
        }
      });
      if (obsColIdx !== -1) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: obsColIdx });
        if (ws[cellRef] && typeof ws[cellRef].v === 'string' && ws[cellRef].v.includes('⚠️ CONVERSÃO')) {
            ws[cellRef].s = {
                font: { color: { rgb: "FF0000" }, bold: true },
                alignment: { vertical: "top", wrapText: true }
            };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos");

    const statusName = statusFilter === '' ? 'Geral' : getStatusLabel(statusFilter).replace(/ /g, '_');
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const fileName = `Salomão_${statusName}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success('Relatório gerado com sucesso!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPartnerFilter('');
    setFilterPeriodo({ start: '', end: '' });
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== '' || partnerFilter !== '' || filterPeriodo.start !== '' || filterPeriodo.end !== '';

  const statusOptions = [
    { label: 'Rascunho', value: 'rascunho' },
    { label: 'Sob Análise', value: 'analysis' },
    { label: 'Proposta Enviada', value: 'proposal' },
    { label: 'Contrato Fechado', value: 'active' },
    { label: 'Rejeitada', value: 'rejected' },
    { label: 'Probono', value: 'probono' },
    { label: 'Baixado', value: 'baixado' }
  ];

  const partnerOptions = partners.map(p => ({ label: p.name, value: p.id }));

  // FilterBar: categorias, chips, count
  const filterCategories = useMemo((): FilterCategory[] => [
    {
      key: 'status',
      label: 'Status',
      icon: Filter,
      type: 'single',
      options: statusOptions,
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      key: 'partner',
      label: 'Sócio',
      icon: User,
      type: 'single',
      options: partnerOptions,
      value: partnerFilter,
      onChange: setPartnerFilter,
    },
    {
      key: 'periodo',
      label: 'Período',
      icon: Calendar,
      type: 'date_range',
      value: filterPeriodo,
      onChange: setFilterPeriodo,
    },
  ], [statusFilter, partnerFilter, filterPeriodo, statusOptions, partnerOptions]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (partnerFilter) count++;
    if (filterPeriodo.start || filterPeriodo.end) count++;
    return count;
  }, [statusFilter, partnerFilter, filterPeriodo]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (statusFilter) {
      const label = statusOptions.find(s => s.value === statusFilter)?.label || statusFilter;
      chips.push({ key: 'status', label: `Status: ${label}`, onClear: () => setStatusFilter('') });
    }
    if (partnerFilter) {
      const label = partnerOptions.find(p => p.value === partnerFilter)?.label || partnerFilter;
      chips.push({ key: 'partner', label: `Sócio: ${label}`, onClear: () => setPartnerFilter('') });
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
  }, [statusFilter, partnerFilter, filterPeriodo, statusOptions, partnerOptions]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Esquerda: Ícone + Título */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <FileSignature className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Casos</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão completa de casos e propostas</p>
          </div>
        </div>

        {/* Direita: Ícones redondos */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Exportar XLSX */}
          <button
            onClick={exportToExcel}
            className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 bg-white text-[#00b87c] hover:bg-gray-50 border border-gray-200 shrink-0"
            title="Exportar XLSX"
          >
            <FileDown className="w-5 h-5" />
          </button>

          {/* Novo Caso */}
          <button
            onClick={handleNew}
            className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 bg-white text-[#1e3a8a] hover:bg-gray-50 border border-gray-200 shrink-0"
            title="Novo Caso"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Notificações */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 border ${notifications.length > 0
                ? 'bg-white text-red-500 hover:bg-gray-50 border-gray-200'
                : 'bg-white text-gray-400 hover:bg-gray-50 border-gray-200'
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
                          Vence: {safeDate(notif.due_date)?.toLocaleDateString()}
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

      {/* KPI Card + FilterBar */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {/* Cards de KPI */}
        <div className="flex items-stretch shrink-0 gap-3 overflow-x-auto custom-scrollbar pb-2 lg:pb-0">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm shrink-0">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 leading-none mb-1">Sob Análise</span>
              <span className="text-xl font-black text-[#0a192f] leading-tight">{filteredContracts.filter(c => c.status === 'analysis').length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm shrink-0">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1e3a8a] leading-none mb-1">Propostas Env.</span>
              <span className="text-xl font-black text-[#0a192f] leading-tight">{filteredContracts.filter(c => c.status === 'proposal').length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm shrink-0">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 leading-none mb-1">Contr. Fechados</span>
              <span className="text-xl font-black text-[#0a192f] leading-tight">{filteredContracts.filter(c => c.status === 'active').length}</span>
            </div>
          </div>
        </div>

        {/* FilterBar */}
        <div className="flex-1">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categories={filterCategories}
            activeFilterChips={activeFilterChips}
            activeFilterCount={activeFilterCount}
            onClearAll={clearFilters}
          />
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar">
            <div className="min-w-[1000px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Cliente</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Responsável</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">HON/PROP</th>
                    <th className="p-4 text-right text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Pró-Labore</th>
                    <th className="p-4 text-right text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Êxitos</th>
                    <th className="p-4 text-right text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredContracts.map(contract => (
                    <tr 
                      key={contract.id} 
                      onClick={() => handleView(contract)} 
                      className={`cursor-pointer group transition-all duration-200 ${
                        contract.status === 'rascunho' 
                          ? 'bg-amber-50/60 hover:bg-amber-100/80 border-b border-amber-100' 
                          : 'hover:bg-blue-50/30 bg-white border-b border-gray-50'
                      }`}
                    >
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-black text-[#0a192f] uppercase tracking-tight truncate max-w-[200px]" title={contract.client_name}>{contract.client_name}</td>
                      <td className="p-4 text-xs font-black text-[#0a192f] uppercase tracking-tight truncate max-w-[150px]" title={getPartnerDisplay(contract)}>{getPartnerDisplay(contract)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="bg-slate-100/80 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md font-mono text-[10px] font-black tracking-widest">
                          {getHonDisplay(contract)}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap text-[11px] font-black text-[#0a192f]">
                        {getProLaboreDisplay(contract)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap text-[11px] font-black text-[#0a192f]">
                        {getSuccessDisplay(contract)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span className="bg-blue-50/50 text-[#1e3a8a] border border-blue-100/50 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest">
                          {safeDate(getRelevantDate(contract))?.toLocaleDateString() || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {React.useMemo(() => {
        const currentIndex = filteredContracts.findIndex((c: Contract) => c.id === formData.id);
        const hasNext = currentIndex >= 0 && currentIndex < filteredContracts.length - 1;
        const hasPrev = currentIndex > 0;

        return (
          <>
            <ContractDetailsModal
              isOpen={isDetailsModalOpen}
              onClose={() => setIsDetailsModalOpen(false)}
              contract={formData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              processes={processes}
              documents={(formData as any).documents}
              partners={partners}
              canEdit={true}
              canDelete={true}
              onNext={handleNext}
              onPrev={handlePrev}
              hasNext={hasNext}
              hasPrev={hasPrev}
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
              cancelEditProcess={cancelEditProcess}
              editProcess={editProcess}
              removeProcess={removeProcess}
              newIntermediateFee={newIntermediateFee}
              setNewIntermediateFee={setNewIntermediateFee}
              addIntermediateFee={addIntermediateFee}
              removeIntermediateFee={removeIntermediateFee}
              timelineData={timelineData}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              onNext={handleNext}
              onPrev={handlePrev}
              hasNext={hasNext}
              hasPrev={hasPrev}
            />
          </>
        );
      }, [
        isDetailsModalOpen, isModalOpen, formData, processes, loading, isEditing, 
        partners, analysts, currentProcess, editingProcessIndex, newIntermediateFee, 
        timelineData, filteredContracts
      ])}

      <PartnerManagerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} onUpdate={handlePartnerUpdate} />
      <AnalystManagerModal isOpen={isAnalystModalOpen} onClose={() => setIsAnalystModalOpen(false)} onUpdate={handleAnalystUpdate} />
    </div>
  );
}