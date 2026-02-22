import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  X, Save,
  User, DollarSign, Gavel, Files, Loader2
} from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, ContractDocument, Analyst } from '../../../types/controladoria';
import { maskCNPJ, maskMoney, maskHon, toTitleCase } from '../utils/masks';
import { decodeCNJ } from '../utils/cnjDecoder';
import { addDays } from 'date-fns';
import { toast } from 'sonner';

// Componentes Modularizados
import { OptionManager } from './components/OptionManager';
import { ContractDocuments } from './components/ContractDocuments';
import { ProcessDetailsModal } from './components/ProcessDetailsModal';
import { StatusAndDatesSection } from './components/StatusAndDatesSection';
import { ClientFormSection } from './components/ClientFormSection';
import { LegalProcessForm } from './components/LegalProcessForm';
import { LegalProcessList } from './components/LegalProcessList';

// Utilitários e Hooks
import { formatForInput, ensureDateValue, localMaskCNJ, safeParseFloat, ensureArray, getThemeBackground } from '../utils/contractHelpers';
import { generateFinancialInstallments, forceUpdateFinancials } from '../services/contractFinancialService';
import { useContractOptions } from '../hooks/useContractOptions';

const UFS = [{ sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' }, { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' }, { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' }, { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' }, { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }];

interface Props {
  isOpen: boolean; onClose: () => void; formData: Contract; setFormData: React.Dispatch<React.SetStateAction<Contract>>; onSave: () => void; loading: boolean; isEditing: boolean;
  partners: Partner[]; onOpenPartnerManager: () => void; analysts: Analyst[]; onOpenAnalystManager: () => void;
  onCNPJSearch: () => void; processes: ContractProcess[]; currentProcess: ContractProcess; setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>; editingProcessIndex: number | null; handleProcessAction: () => void; editProcess: (idx: number) => void; removeProcess: (idx: number) => void; newIntermediateFee: string; setNewIntermediateFee: (v: string) => void; addIntermediateFee: () => void; removeIntermediateFee: (idx: number) => void; timelineData: TimelineEvent[]; getStatusColor: (s: string) => string; getStatusLabel: (s: string) => string;
}

export function ContractFormModal(props: Props) {
  const {
    isOpen, onClose, formData, setFormData, onSave, loading: parentLoading, isEditing,
    partners, onOpenPartnerManager, analysts, onOpenAnalystManager,
    processes, currentProcess, setCurrentProcess, editingProcessIndex, handleProcessAction, editProcess, removeProcess,
    newIntermediateFee, setNewIntermediateFee, addIntermediateFee, removeIntermediateFee, getStatusLabel
  } = props;

  const [localLoading, setLocalLoading] = useState(false);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchingCNJ, setSearchingCNJ] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{ label: string, value: string }[]>([]);
  const [clientExtraData, setClientExtraData] = useState({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
  const [interimInstallments, setInterimInstallments] = useState('1x');
  const [interimClause, setInterimClause] = useState('');

  const [activeManager, setActiveManager] = useState<string | null>(null);

  const [initialFormData, setInitialFormData] = useState<Contract | null>(null);

  const [duplicateClientCases, setDuplicateClientCases] = useState<any[]>([]);
  const [duplicateOpponentCases, setDuplicateOpponentCases] = useState<any[]>([]);
  const [duplicateAuthorCases, setDuplicateAuthorCases] = useState<any[]>([]);
  const [duplicateHonCase, setDuplicateHonCase] = useState<any | null>(null);
  const [duplicateProcessData, setDuplicateProcessData] = useState<any | null>(null);
  const [tempFiles, setTempFiles] = useState<{ file: File, type: string }[]>([]);

  const [authorHasNoCnpj, setAuthorHasNoCnpj] = useState(false);
  const [opponentHasNoCnpj, setOpponentHasNoCnpj] = useState(false);

  const [newMagistrateTitle, setNewMagistrateTitle] = useState('');
  const [newMagistrateName, setNewMagistrateName] = useState('');
  const [isStandardCNJ, setIsStandardCNJ] = useState(true);
  const [otherProcessType, setOtherProcessType] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [viewProcess, setViewProcess] = useState<ContractProcess | null>(null);
  const [viewProcessIndex, setViewProcessIndex] = useState<number | null>(null);
  const numeralOptions = Array.from({ length: 100 }, (_, i) => ({ label: `${i + 1}º`, value: `${i + 1}º` }));

  const [activeTab, setActiveTab] = useState(1);

  const steps = [
    { id: 1, label: 'Dados do Cliente', icon: User },
    { id: 2, label: 'Status & Valores', icon: DollarSign },
    { id: 3, label: 'Dados do Objeto', icon: Gavel },
    { id: 4, label: 'GED (Arquivos)', icon: Files }
  ];

  const options = useContractOptions({ formData, setFormData, currentProcess, setCurrentProcess, activeManager });

  const isLoading = parentLoading || localLoading;

  const [dateWarningMessage, setDateWarningMessage] = useState<string | null>(null);

  // --- USE EFFECTS (MANTIDOS) ---
  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
      options.fetchAuxiliaryTables();
      if (formData.id) fetchDocuments();
      setInitialFormData(JSON.parse(JSON.stringify(formData)));

      if (!formData.pro_labore_installments) setFormData(prev => ({ ...prev, pro_labore_installments: '1x' }));
      if (!formData.final_success_fee_installments) setFormData(prev => ({ ...prev, final_success_fee_installments: '1x' }));
      if (!formData.fixed_monthly_fee_installments) setFormData(prev => ({ ...prev, fixed_monthly_fee_installments: '1x' }));
      if (!formData.other_fees_installments) setFormData(prev => ({ ...prev, other_fees_installments: '1x' }));

      setCurrentProcess(prev => ({ ...prev, position: prev.position || '' }));

      if (!formData.id) {
        setFormData(prev => ({ ...prev, physical_signature: undefined }));
      }

    } else {
      setDocuments([]);
      setClientExtraData({ address: '', number: '', complement: '', city: '', email: '', is_person: false });
      setInterimInstallments('1x');
      setInterimClause('');
      setIsStandardCNJ(true);
      setOtherProcessType('');
      setCurrentProcess(prev => ({ ...prev, process_number: '', uf: '', position: '' }));
      setNewSubject('');

      setDuplicateClientCases([]);
      setDuplicateOpponentCases([]);
      setDuplicateAuthorCases([]);
      setDuplicateHonCase(null);
      setDuplicateProcessData(null);
      setAuthorHasNoCnpj(false);
      setOpponentHasNoCnpj(false);

      setInitialFormData(null);
      setActiveManager(null);
      setActiveTab(1);
      setTempFiles([]);
    }
  }, [isOpen, formData.id]);

  useEffect(() => {
    let msg = null;
    if (formData.status === 'analysis' && !formData.prospect_date) {
      msg = "Data de Prospecção é necessária para o status Análise.";
    } else if (formData.status === 'proposal' && !formData.proposal_date) {
      msg = "Data da Proposta é necessária para o status Proposta Enviada.";
      if (formData.proposal_code) {
        // proposal_code is valid here
      }
    } else if (formData.status === 'active' && !formData.contract_date) {
      msg = "Data de Assinatura é necessária para o status Contrato Fechado.";
    }
    setDateWarningMessage(msg);
  }, [formData.status, formData.prospect_date, formData.proposal_date, formData.contract_date]);

  useEffect(() => {
    const checkClientDuplicates = async () => {
      if (!formData.client_name || formData.client_name.length < 3) return setDuplicateClientCases([]);
      const { data } = await supabase.from('contracts').select('id, hon_number, status, seq_id').ilike('client_name', `%${formData.client_name}%`).neq('id', formData.id || '00000000-0000-0000-0000-000000000000').limit(5);
      if (data) {
        const formatted = data.map(c => ({
          ...c,
          display_id: String((c as any).seq_id || 0).padStart(6, '0')
        }));
        setDuplicateClientCases(formatted);
      }
    };
    const timer = setTimeout(checkClientDuplicates, 800);
    return () => clearTimeout(timer);
  }, [formData.client_name, formData.id]);

  useEffect(() => {
    const checkHonDuplicates = async () => {
      if (!formData.hon_number || formData.hon_number.length < 2) return setDuplicateHonCase(null);
      const { data } = await supabase.from('contracts').select('id, client_name, seq_id, status').eq('hon_number', formData.hon_number).neq('id', formData.id || '00000000-0000-0000-0000-000000000000').limit(1);
      if (data && data.length > 0) {
        setDuplicateHonCase({
          ...data[0],
          display_id: String((data[0] as any).seq_id || 0).padStart(6, '0')
        });
      } else {
        setDuplicateHonCase(null);
      }
    };
    const timer = setTimeout(checkHonDuplicates, 800);
    return () => clearTimeout(timer);
  }, [formData.hon_number, formData.id]);

  useEffect(() => {
    const checkOpponentDuplicates = async () => {
      if (!currentProcess.opponent || currentProcess.opponent.length < 3) return setDuplicateOpponentCases([]);
      const { data } = await supabase.from('contract_processes').select('contract_id, contracts(id, client_name, hon_number, seq_id)').ilike('opponent', `%${currentProcess.opponent}%`).limit(5);
      if (data) {
        const uniqueCases = data.reduce((acc: any[], current: any) => {
          const x = acc.find(item => item.contracts?.id === current.contracts?.id);
          if (!x && current.contracts) {
            const formatted = {
              ...current,
              contracts: {
                ...current.contracts,
                display_id: String(current.contracts.seq_id || 0).padStart(6, '0')
              }
            };
            return acc.concat([formatted]);
          }
          return acc;
        }, []);
        setDuplicateOpponentCases(uniqueCases);
      }
    };
    const timer = setTimeout(checkOpponentDuplicates, 800);
    return () => clearTimeout(timer);
  }, [currentProcess.opponent]);

  useEffect(() => {
    const checkAuthorDuplicates = async () => {
      const authorName = (currentProcess as any).author;
      if (!authorName || authorName.length < 3) return setDuplicateAuthorCases([]);

      const { data } = await supabase.from('contract_processes').select('contract_id, contracts(id, client_name, hon_number, seq_id)').ilike('author', `%${authorName}%`).limit(5);

      if (data) {
        const uniqueCases = data.reduce((acc: any[], current: any) => {
          const x = acc.find(item => item.contracts?.id === current.contracts?.id);
          if (!x && current.contracts) {
            const formatted = {
              ...current,
              contracts: {
                ...current.contracts,
                display_id: String(current.contracts.seq_id || 0).padStart(6, '0')
              }
            };
            return acc.concat([formatted]);
          }
          return acc;
        }, []);
        setDuplicateAuthorCases(uniqueCases);
      }
    };
    const timer = setTimeout(checkAuthorDuplicates, 800);
    return () => clearTimeout(timer);
  }, [(currentProcess as any).author]);

  useEffect(() => {
    const checkProcessNumber = async () => {
      if (otherProcessType) return setDuplicateProcessData(null);
      if (!currentProcess.process_number || currentProcess.process_number.length < 15 || ['CONSULTORIA', 'ASSESSORIA JURÍDICA', 'PROCESSO ADMINISTRATIVO', 'OUTROS'].includes(currentProcess.process_number)) return setDuplicateProcessData(null);

      const { data } = await supabase.from('contract_processes')
        .select('contract_id, contracts(id, client_name, hon_number, seq_id)')
        .eq('process_number', currentProcess.process_number)
        .neq('contract_id', formData.id || '00000000-0000-0000-0000-000000000000')
        .limit(1);

      if (data && data.length > 0) {
        const firstMatch = data[0];
        if (firstMatch.contracts) {
          const contractInfo = Array.isArray(firstMatch.contracts) ? firstMatch.contracts[0] : firstMatch.contracts;
          setDuplicateProcessData({
            ...firstMatch,
            contracts: {
              ...contractInfo,
              display_id: String(contractInfo.seq_id || 0).padStart(6, '0')
            }
          });
        } else {
          setDuplicateProcessData(null);
        }
      } else {
        setDuplicateProcessData(null);
      }
    };
    const timer = setTimeout(checkProcessNumber, 800);
    return () => clearTimeout(timer);
  }, [currentProcess.process_number, otherProcessType, formData.id]);

  useEffect(() => {
    if (authorHasNoCnpj) {
      setCurrentProcess(prev => ({ ...prev, author_cnpj: '' }));
      return;
    }
    const fetchAuthorCNPJ = async () => {
      const authorName = (currentProcess as any).author;
      if (!authorName || authorName.length < 3) return;
      const { data, error } = await supabase.from('authors').select('cnpj').eq('name', authorName).maybeSingle();
      if (!error && data && data.cnpj) setCurrentProcess(prev => ({ ...prev, author_cnpj: maskCNPJ(data.cnpj) }));
    };
    const timer = setTimeout(fetchAuthorCNPJ, 800);
    return () => clearTimeout(timer);
  }, [(currentProcess as any).author, authorHasNoCnpj]);

  useEffect(() => {
    if (opponentHasNoCnpj) {
      setCurrentProcess(prev => ({ ...prev, opponent_cnpj: '' }));
      return;
    }
    const fetchOpponentCNPJ = async () => {
      if (!currentProcess.opponent || currentProcess.opponent.length < 3) return;
      const { data, error } = await supabase.from('opponents').select('cnpj').eq('name', currentProcess.opponent).maybeSingle();
      if (!error && data && data.cnpj) setCurrentProcess(prev => ({ ...prev, opponent_cnpj: maskCNPJ(data.cnpj) }));
    };
    const timer = setTimeout(fetchOpponentCNPJ, 800);
    return () => clearTimeout(timer);
  }, [currentProcess.opponent, opponentHasNoCnpj]);

  useEffect(() => {
    if (!['proposal', 'active'].includes(formData.status)) return;

    const fees = [
      { field: 'pro_labore', installField: 'pro_labore_installments', breakdownField: 'pro_labore_breakdown' },
      { field: 'final_success_fee', installField: 'final_success_fee_installments', breakdownField: 'final_success_fee_breakdown' },
      { field: 'fixed_monthly_fee', installField: 'fixed_monthly_fee_installments', breakdownField: 'fixed_monthly_fee_breakdown' },
      { field: 'other_fees', installField: 'other_fees_installments', breakdownField: 'other_fees_breakdown' }
    ];

    let hasChanges = false;
    let newFormData = { ...formData };

    fees.forEach(({ field, installField, breakdownField }) => {
      const valStr = (formData as any)[field];
      const instStr = (formData as any)[installField];

      if (!valStr || !instStr || instStr === '1x' || valStr === 'R$ 0,00' || valStr === '') {
        return;
      }

      const count = parseInt(instStr.replace('x', '')) || 1;
      const currentBreakdown = (formData as any)[breakdownField] || [];

      if (currentBreakdown.length !== count && count > 1) {
        const total = safeParseFloat(valStr);
        const baseValue = total / count;

        const newBreakdown = Array.from({ length: count }, (_, i) => ({
          date: addDays(new Date(), i * 30).toISOString().split('T')[0],
          value: maskMoney(baseValue.toFixed(2))
        }));

        (newFormData as any)[breakdownField] = newBreakdown;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setFormData(newFormData);
    }
  }, [
    formData.status,
    formData.pro_labore, formData.pro_labore_installments,
    formData.final_success_fee, formData.final_success_fee_installments,
    formData.fixed_monthly_fee, formData.fixed_monthly_fee_installments,
    formData.other_fees, formData.other_fees_installments
  ]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // --- FUNÇÕES AUXILIARES (MANTIDAS) ---

  const fetchStatuses = async () => {
    const { data } = await supabase.from('contract_statuses').select('*');
    const defaultStatuses = [
      { label: 'Sob Análise', value: 'analysis' },
      { label: 'Proposta Enviada', value: 'proposal' },
      { label: 'Contrato Fechado', value: 'active' },
      { label: 'Probono', value: 'probono' },
      { label: 'Rejeitada', value: 'rejected' }
    ];

    if (data && data.length > 0) {
      const order = ['analysis', 'proposal', 'active', 'rejected', 'probono'];
      const sortedData = data.sort((a, b) => {
        const iA = order.indexOf(a.value), iB = order.indexOf(b.value);
        if (iA !== -1 && iB !== -1) return iA - iB;
        return (iA !== -1 ? -1 : (iB !== -1 ? 1 : a.label.localeCompare(b.label)));
      });
      setStatusOptions([{ label: 'Selecione', value: '' }, ...sortedData.map(s => ({ label: s.label, value: s.value }))]);
    } else {
      setStatusOptions([{ label: 'Selecione', value: '' }, ...defaultStatuses]);
    }
  };

  const handleCreateStatus = async () => {
    const newLabel = window.prompt("Digite o nome do novo Status:");
    if (!newLabel) return;
    const newValue = newLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    if (statusOptions.some(s => s.value === newValue)) return alert("Este status já existe.");
    try {
      const { error } = await supabase.from('contract_statuses').insert({ label: toTitleCase(newLabel.trim()), value: newValue, color: 'bg-gray-100 text-gray-800 border-gray-200' });
      if (error) throw error;
      await fetchStatuses();
      setFormData({ ...formData, status: newValue as any });
    } catch (err) { alert("Erro ao criar status."); }
  };

  const fetchDocuments = async () => {
    const { data } = await supabase.from('contract_documents').select('*').eq('contract_id', formData.id).order('uploaded_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const upsertClient = async () => {
    if (!formData.client_name) return null;
    const clientData = {
      name: formData.client_name,
      cnpj: (formData.has_no_cnpj || !formData.cnpj) ? null : formData.cnpj,
      is_person: clientExtraData.is_person || formData.has_no_cnpj || ((formData.cnpj || '').length > 0 && (formData.cnpj || '').length <= 14),
      uf: formData.uf,
      address: clientExtraData.address || undefined,
      city: clientExtraData.city || undefined,
      complement: clientExtraData.complement || undefined,
      number: clientExtraData.number || undefined,
      email: clientExtraData.email || undefined,
      partner_id: formData.partner_id
    };

    if (clientData.cnpj) {
      const { data: existingClient } = await supabase.from('clients').select('id').eq('cnpj', clientData.cnpj).maybeSingle();
      if (existingClient) {
        await supabase.from('clients').update(clientData).eq('id', existingClient.id);
        return existingClient.id;
      } else {
        const { data: newClient, error } = await supabase.from('clients').insert(clientData).select().single();
        if (error) return console.error('Erro ao criar cliente com CNPJ:', error), null;
        return newClient.id;
      }
    } else {
      if (formData.client_id) {
        await supabase.from('clients').update(clientData).eq('id', formData.client_id);
        return formData.client_id;
      } else {
        const { data: newClient, error } = await supabase.from('clients').insert(clientData).select().single();
        if (error) return console.error('Erro ao criar cliente sem CNPJ:', error), null;
        return newClient.id;
      }
    }
  };

  const handleAddToList = (listField: string, valueField: keyof Contract, installmentsListField?: string, installmentsSourceField?: keyof Contract) => {
    const value = (formData as any)[valueField], clauseValue = (formData as any)[valueField + '_clause'];
    if (!value || value === 'R$ 0,00' || value === '') return;
    const currentList = (formData as any)[listField] || [];
    const currentClausesList = ensureArray((formData as any)[listField + '_clauses']);
    const updates: any = { [listField]: [...currentList, value], [listField + '_clauses']: [...currentClausesList, clauseValue || ''], [valueField]: '', [valueField + '_clause']: '' };
    if (installmentsListField && installmentsSourceField) {
      updates[installmentsListField] = [...ensureArray((formData as any)[installmentsListField]), (formData as any)[installmentsSourceField] || '1x'];
      updates[installmentsSourceField] = '1x';
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const removeExtra = (field: string, index: number, installmentsListField?: string) => {
    setFormData((prev: any) => {
      const newList = [...(prev[field] || [])], newClausesList = [...ensureArray(prev[field + '_clauses'])];
      newList.splice(index, 1);
      if (newClausesList.length > index) newClausesList.splice(index, 1);
      const updates: any = { [field]: newList, [field + '_clauses']: newClausesList };
      if (installmentsListField) {
        const newInstList = [...ensureArray(prev[installmentsListField])];
        if (newInstList.length > index) newInstList.splice(index, 1);
        updates[installmentsListField] = newInstList;
      }
      return { ...prev, ...updates };
    });
  };

  const handleAddIntermediateFee = () => {
    if (!newIntermediateFee) return;
    addIntermediateFee();
    setFormData(prev => ({ ...prev, intermediate_fees_clauses: [...ensureArray((prev as any).intermediate_fees_clauses), interimClause], intermediate_fees_installments: [...ensureArray((prev as any).intermediate_fees_installments), interimInstallments] } as any));
    setInterimClause('');
    setInterimInstallments('1x');
  };

  const handleRemoveIntermediateFee = (idx: number) => {
    removeIntermediateFee(idx);
    const currentClauses = [...ensureArray((formData as any).intermediate_fees_clauses)]; currentClauses.splice(idx, 1);
    const currentInst = [...ensureArray((formData as any).intermediate_fees_installments)]; currentInst.splice(idx, 1);
    setFormData(prev => ({ ...prev, intermediate_fees_clauses: currentClauses, intermediate_fees_installments: currentInst } as any));
  };

  const addMagistrate = (magistrateName = newMagistrateName) => {
    if (!magistrateName.trim()) return;
    setCurrentProcess(prev => ({ ...prev, magistrates: [...(prev.magistrates || []), { title: newMagistrateTitle, name: magistrateName }] }));
    setNewMagistrateName('');
  };

  const removeMagistrate = (index: number) => {
    setCurrentProcess(prev => {
      const newList = [...(prev.magistrates || [])];
      newList.splice(index, 1);
      return { ...prev, magistrates: newList };
    });
  };

  const addSubjectToProcess = () => {
    if (!newSubject.trim()) return;
    const cleanSubject = toTitleCase(newSubject.trim());
    const currentSubjects = currentProcess.subject ? currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '') : [];
    if (!currentSubjects.includes(cleanSubject)) setCurrentProcess(prev => ({ ...prev, subject: [...currentSubjects, cleanSubject].join('; ') }));
    setNewSubject('');
  };

  const removeSubject = (subjectToRemove: string) => {
    if (!currentProcess.subject) return;
    const updatedSubjects = currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '' && s !== subjectToRemove);
    setCurrentProcess(prev => ({ ...prev, subject: updatedSubjects.join('; ') }));
  };

  const handleSaveWithIntegrations = async () => {
    if (editingProcessIndex !== null) return alert('⚠️ Finalize a edição do processo (clique no check ✔️) antes de salvar o caso.');

    // Permitir salvar se for um tipo "Outro" (nacional/administrativo) sem número, ou se o usuário explicitamente quiser ignorar
    if (currentProcess.process_number || (currentProcess.court && !processes.some(p => p.court === currentProcess.court))) {
      // Se tem dados mas não adicionou, avisa, mas não bloqueia se for apenas um rastro
      // Original alert mantido mas relaxado
      if (currentProcess.process_number || otherProcessType) {
        const confirmSave = confirm('⚠️ Você inseriu dados de um processo mas não o adicionou.\n\nDeseja salvar o contrato assim mesmo (os dados não adicionados serão perdidos)?');
        if (!confirmSave) return;
      }
    }

    if (!formData.client_name) return alert('O "Nome do Cliente" é obrigatório.');
    if (!formData.partner_id) return alert('O "Responsável (Sócio)" é obrigatório.');
    if (formData.status === 'analysis' && !formData.prospect_date) return alert('A "Data Prospect" é obrigatória para contratos em Análise.');
    if (formData.status === 'proposal' && !formData.proposal_date) return alert('A "Data Proposta" é obrigatória para Propostas Enviadas.');
    if (formData.status === 'active') {
      if (!formData.contract_date) return alert('A "Data Assinatura" é obrigatória para Contratos Fechados.');
      if (!formData.hon_number) return alert('O "Número HON" é obrigatório para Contratos Fechados.');
      if (!formData.billing_location) return alert('O "Local Faturamento" é obrigatório para Contratos Fechados.');
      if (formData.physical_signature === undefined || formData.physical_signature === null || (formData.physical_signature as any) === '') return alert('Informe se "Possui Assinatura Física" para Contratos Fechados.');
    }

    setLocalLoading(true);
    try {
      const clientId = await upsertClient();
      if (!clientId) throw new Error("Falha ao salvar dados do cliente (CNPJ Duplicado ou Inválido).");

      const isTimesheet = (formData as any).timesheet === true;

      const contractPayload: any = {
        ...formData,
        client_id: clientId,
        pro_labore: isTimesheet ? 0 : safeParseFloat(formData.pro_labore),
        final_success_fee: isTimesheet ? 0 : safeParseFloat(formData.final_success_fee),
        fixed_monthly_fee: isTimesheet ? 0 : safeParseFloat(formData.fixed_monthly_fee),
        other_fees: isTimesheet ? 0 : safeParseFloat(formData.other_fees),
        pro_labore_extras: (formData as any).pro_labore_extras, final_success_extras: (formData as any).final_success_extras, fixed_monthly_extras: (formData as any).fixed_monthly_extras, other_fees_extras: (formData as any).other_fees_extras, timesheet: (formData as any).timesheet,
        pro_labore_clause: (formData as any).pro_labore_clause, final_success_fee_clause: (formData as any).final_success_fee_clause, fixed_monthly_fee_clause: (formData as any).fixed_monthly_fee_clause, other_fees_clause: (formData as any).other_fees_clause,
        pro_labore_extras_clauses: ensureArray((formData as any).pro_labore_extras_clauses), final_success_extras_clauses: ensureArray((formData as any).final_success_extras_clauses), fixed_monthly_extras_clauses: ensureArray((formData as any).fixed_monthly_extras_clauses), other_fees_extras_clauses: ensureArray((formData as any).other_fees_extras_clauses), intermediate_fees_clauses: ensureArray((formData as any).intermediate_fees_clauses),
        pro_labore_extras_installments: ensureArray((formData as any).pro_labore_extras_installments), final_success_extras_installments: ensureArray((formData as any).final_success_extras_installments), fixed_monthly_extras_installments: ensureArray((formData as any).fixed_monthly_extras_installments), other_fees_extras_installments: ensureArray((formData as any).other_fees_extras_installments), intermediate_fees_installments: ensureArray((formData as any).intermediate_fees_installments),
        pro_labore_breakdown: (formData as any).pro_labore_breakdown, final_success_fee_breakdown: (formData as any).final_success_fee_breakdown, fixed_monthly_fee_breakdown: (formData as any).fixed_monthly_fee_breakdown, other_fees_breakdown: (formData as any).other_fees_breakdown,
        partner_name: undefined, analyzed_by_name: undefined, process_count: undefined, analyst: undefined, analysts: undefined, client: undefined, partner: undefined, processes: undefined, partners: undefined, id: undefined, display_id: undefined, contract_documents: undefined, documents: undefined,
      };

      if (formData.status === 'active' && initialFormData && initialFormData.status === 'proposal') {
        contractPayload.proposal_snapshot = { pro_labore: initialFormData.pro_labore, final_success_fee: initialFormData.final_success_fee, fixed_monthly_fee: initialFormData.fixed_monthly_fee, other_fees: initialFormData.other_fees, pro_labore_extras: (initialFormData as any).pro_labore_extras, final_success_extras: (initialFormData as any).final_success_extras, fixed_monthly_extras: (initialFormData as any).fixed_monthly_extras, other_fees_extras: (initialFormData as any).other_fees_extras, proposal_date: initialFormData.proposal_date, saved_at: new Date().toISOString() };
      }
      Object.keys(contractPayload).forEach(key => contractPayload[key] === undefined && delete contractPayload[key]);

      let savedId = formData.id;
      if (formData.id) {
        const { error } = await supabase.from('contracts').update(contractPayload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('contracts').insert(contractPayload).select().single();
        if (error) throw error;
        savedId = data.id;
      }

      if (savedId) {
        await forceUpdateFinancials(savedId, formData);
        await generateFinancialInstallments(savedId, formData);
        if (processes.length > 0) {
          await supabase.from('contract_processes').delete().eq('contract_id', savedId);
          const processesToInsert = processes.map(p => {
            const {
              id,
              created_at,
              author_cnpj,
              opponent_cnpj,
              cause_value,
              ...rest
            } = p as any;

            return {
              ...rest,
              contract_id: savedId,
              value_of_cause: cause_value ? safeParseFloat(cause_value) : 0
            };
          });

          const { error: processError } = await supabase.from('contract_processes').insert(processesToInsert);
          if (processError) throw processError;
        }
        if (formData.status === 'active' && formData.physical_signature === false) {
          const { data: existingTask } = await supabase.from('kanban_tasks').select('id').eq('contract_id', savedId).eq('status', 'signature').maybeSingle();
          if (!existingTask) await supabase.from('kanban_tasks').insert({ title: `Coletar Assinatura: ${formData.client_name}`, description: `Contrato fechado em ${new Date().toLocaleDateString()}. Coletar assinatura física.`, priority: 'Alta', status: 'signature', contract_id: savedId, due_date: addDays(new Date(), 5).toISOString(), position: 0 });
        }
      }

      // Upload de arquivos temporários se houver
      if (savedId && tempFiles.length > 0) {
        for (const item of tempFiles) {
          try {
            const sanitizedName = item.file.name.replace(/[^a-z0-9.]/gi, '').replace(/\.{2,}/g, '.').toLowerCase();
            const finalName = sanitizedName.length > 60 ? sanitizedName.substring(sanitizedName.length - 60) : sanitizedName;
            const filePath = `${savedId}/${Date.now()}_${finalName}`;
            await supabase.storage.from('ged-documentos').upload(filePath, item.file);
            await supabase.from('contract_documents').insert({
              contract_id: savedId,
              file_name: item.file.name,
              file_path: filePath,
              file_type: item.type
            });
          } catch (err) {
            console.error("Erro ao subir arquivo temporário:", err);
          }
        }
      }

      onSave();
      onClose();
    } catch (error: any) {
      if (error.code === '23505' || error.message?.includes('contracts_hon_number_key')) {
        let msg = '⚠️ Duplicidade de Caso Detectada\n\nJá existe um contrato cadastrado com este Número HON.';
        if (error.details) msg += `\n\nDetalhes: ${error.details}`;
        if (error.message) msg += `\nErro Original: ${error.message}`;

        if (duplicateHonCase) {
          msg += `\n\n - ID: ${duplicateHonCase.display_id}\n - Cliente: ${duplicateHonCase.client_name}\n - Status: ${getStatusLabel(duplicateHonCase.status)
            }`;
        }
        alert(msg);
      }
      else if (error.code === 'PGRST204') alert(`Erro Técnico: Tentativa de salvar campo inválido.\n\nSOLUÇÃO: Rode o SQL fornecido no Supabase.`);
      else alert(`Não foi possível salvar as alterações.\n\n${error.message} `);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCNPJSearch = async () => {
    if (!formData.cnpj || formData.has_no_cnpj) return;
    const cnpjLimpo = (formData.cnpj || '').replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return alert('CNPJ inválido. Digite 14 dígitos.');

    setLocalLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) throw new Error('CNPJ não encontrado na Receita Federal');
      const data = await response.json();
      setFormData(prev => ({ ...prev, client_name: toTitleCase(data.razao_social || data.nome_fantasia || ''), uf: data.uf || prev.uf }));
      setClientExtraData({ address: toTitleCase(data.logradouro || ''), number: data.numero || '', complement: toTitleCase(data.complemento || ''), city: toTitleCase(data.municipio || ''), email: data.email || '', is_person: false });

      const { data: existingClient } = await supabase.from('clients').select('id, name').eq('cnpj', cnpjLimpo).maybeSingle();
      if (existingClient) setFormData(prev => ({ ...prev, client_id: existingClient.id }));
    } catch (error: any) { alert(`❌ ${error.message}\n\n💡 Você pode preencher manualmente.`); } finally { setLocalLoading(false); }
  };

  const handlePartyCNPJSearch = async (type: 'author' | 'opponent') => {
    if (type === 'author' && authorHasNoCnpj) return;
    if (type === 'opponent' && opponentHasNoCnpj) return;

    const cnpj = type === 'author' ? (currentProcess as any).author_cnpj : (currentProcess as any).opponent_cnpj;
    if (!cnpj) return;
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return alert('CNPJ inválido. Digite 14 dígitos.');

    setLocalLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (!response.ok) throw new Error('CNPJ não encontrado.');
      const data = await response.json();
      const name = toTitleCase(data.razao_social || data.nome_fantasia || '');
      const table = type === 'author' ? 'authors' : 'opponents';

      const { data: existing } = await supabase.from(table).select('id, name').ilike('name', name).maybeSingle();

      if (!existing) {
        const payload: any = { name };
        payload.cnpj = cleanCNPJ;
        const { error } = await supabase.from(table).insert(payload);
        if (error && error.code !== '23505' && error.code !== '42703') {
          await supabase.from(table).insert({ name });
        }
      }

      if (type === 'author') {
        if (!options.authorOptions.includes(name)) {
          options.setAuthorOptions(prev => [...prev, name].sort((a, b) => a.localeCompare(b)));
        }
        setCurrentProcess(prev => ({ ...prev, author: name, author_cnpj: maskCNPJ(cleanCNPJ) } as any));
      } else {
        if (!options.opponentOptions.includes(name)) {
          options.setOpponentOptions(prev => [...prev, name].sort((a, b) => a.localeCompare(b)));
        }
        setCurrentProcess(prev => ({ ...prev, opponent: name, opponent_cnpj: maskCNPJ(cleanCNPJ) }));
      }

    } catch (error: any) {
      alert(`Erro ao buscar CNPJ: ${error.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCNJSearch = async () => {
    if (!currentProcess.process_number) return;
    const numeroLimpo = currentProcess.process_number.replace(/\D/g, '');
    if (numeroLimpo.length !== 20) return alert('Número de processo inválido. Deve ter 20 dígitos.');
    searchingCNJ && setSearchingCNJ(true);
    try {
      const decoded = decodeCNJ(numeroLimpo);
      if (!decoded) throw new Error('Não foi possível decodificar o número do processo');
      const uf = decoded.tribunal === 'STF' ? 'DF' : decoded.uf;
      if (!options.courtOptions.includes(decoded.tribunal)) {
        await supabase.from('courts').insert({ name: decoded.tribunal }).select();
        options.setCourtOptions([...options.courtOptions, decoded.tribunal].sort((a, b) => a.localeCompare(b)));
      }
      setCurrentProcess(prev => ({ ...prev, court: decoded.tribunal, uf: uf }));
    } catch (error: any) { alert(`❌ Erro ao decodificar CNJ: ${error.message}`); } finally { setSearchingCNJ(false); }
  };

  const handleOpenJusbrasil = () => {
    if (currentProcess.process_number) window.open(`https://www.jusbrasil.com.br/processos/numero/${currentProcess.process_number.replace(/\D/g, '')}`, '_blank');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.id) {
      // Armazena temporariamente para subir após o save
      setTempFiles(prev => [...prev, { file, type }]);
      toast.info(`Arquivo "${file.name}" agendado para upload após salvar o contrato.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '').replace(/\.{2,}/g, '.').toLowerCase();
      const finalName = sanitizedName.length > 60 ? sanitizedName.substring(sanitizedName.length - 60) : sanitizedName;
      const filePath = `${formData.id}/${Date.now()}_${finalName}`;
      const { error: uploadError } = await supabase.storage.from('ged-documentos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: docData, error: dbError } = await supabase.from('contract_documents').insert({ contract_id: formData.id, file_name: file.name, file_path: filePath, file_type: type }).select().single();
      if (dbError) throw dbError;
      if (docData) setDocuments(prev => [docData, ...prev]);
    } catch (error: any) { alert("Erro ao anexar arquivo: " + error.message); } finally { setUploading(false); e.target.value = ''; }
  };

  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('ged-documentos').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data), a = document.createElement('a');
      a.href = url; a.download = path.split('_').slice(1).join('_') || 'documento.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (error: any) { alert("Erro ao baixar arquivo: " + error.message); }
  };

  const removeTempFile = (index: number) => {
    setTempFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteDocument = async (id: string, path: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      await supabase.storage.from('ged-documentos').remove([path]);
      const { error: dbError } = await supabase.from('contract_documents').delete().eq('id', id);
      if (dbError) throw dbError;
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error: any) { alert("Erro ao excluir documento: " + error.message); }
  };

  const handleClientChange = async (name: string) => {
    const newName = toTitleCase(name);
    setFormData(prev => ({ ...prev, client_name: newName }));
    if (!newName) return;
    const { data } = await supabase.from('clients').select('cnpj, id').eq('name', newName).maybeSingle();
    if (data && data.cnpj) setFormData(prev => ({ ...prev, client_name: newName, client_id: data.id, cnpj: maskCNPJ(data.cnpj) }));
  };

  const partnerSelectOptions = [{ label: 'Selecione', value: '' }, ...partners.map(p => ({ label: p.name, value: p.id }))];
  const analystSelectOptions = [{ label: 'Selecione', value: '' }, ...(analysts ? analysts.map(a => ({ label: a.name, value: a.id })) : [])];
  const ufOptions = [{ label: 'Selecione', value: '' }, ...UFS.map(uf => ({ label: uf.nome, value: uf.sigla }))];
  const billingOptions = [{ label: 'Selecione', value: '' }, ...options.billingLocations.map(l => ({ label: l, value: l }))];
  const signatureOptions = [{ label: 'Selecione', value: '' }, { label: 'Sim', value: 'true' }, { label: 'Não (Cobrar)', value: 'false' }];
  const rejectionByOptions = [{ label: 'Selecione', value: '' }, { label: 'Cliente', value: 'Cliente' }, { label: 'Escritório', value: 'Escritório' }];
  const rejectionReasonOptions = [{ label: 'Selecione', value: '' }, { label: 'Cliente declinou', value: 'Cliente declinou' }, { label: 'Cliente não retornou', value: 'Cliente não retornou' }, { label: 'Caso ruim', value: 'Caso ruim' }, { label: 'Conflito de interesses', value: 'Conflito de interesses' }];
  const areaOptions = [{ label: 'Selecione', value: '' }, ...options.legalAreas.map(a => ({ label: a, value: a }))];
  const positionOptions = [{ label: 'Selecione', value: '' }, ...options.positionsList.map(p => ({ label: p, value: p }))];
  const magistrateTypes = [{ label: 'Selecione', value: '' }, { label: 'Juiz', value: 'Juiz' }, { label: 'Desembargador', value: 'Desembargador' }, { label: 'Ministro', value: 'Ministro' }];

  const justiceSelectOptions = [{ label: 'Selecione', value: '' }, ...options.justiceOptions.map(j => ({ label: j, value: j }))];
  const varaSelectOptions = [{ label: 'Selecione', value: '' }, ...options.varaOptions.map(v => ({ label: v, value: v }))];
  const courtSelectOptions = [{ label: 'Selecione', value: '' }, ...options.courtOptions.map(c => ({ label: c, value: c }))];
  const comarcaSelectOptions = [{ label: 'Selecione', value: '' }, ...options.comarcaOptions.map(c => ({ label: c, value: c }))];
  const classSelectOptions = [{ label: 'Selecione', value: '' }, ...options.classOptions.map(c => ({ label: c, value: c }))];
  const subjectSelectOptions = [{ label: 'Selecione', value: '' }, ...options.subjectOptions.map(s => ({ label: s, value: s }))];
  const clientSelectOptions = [{ label: 'Selecione', value: '' }, ...options.clientOptions.map(c => ({ label: c, value: c }))];

  const handleTypeChange = (type: string) => {
    setOtherProcessType(type);
    setCurrentProcess(prev => ({ ...prev, process_number: '' }));
  };

  if (!isOpen) return null;

  // --- NOVA UI (SIDEBAR + CONTENT) ---

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 relative">

        {/* Left Sidebar */}
        <div className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-gray-100 flex flex-col py-4 md:py-8 px-4 md:px-5 shrink-0 z-10">
          <div className="mb-4 md:mb-8 px-2 flex justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-black text-[#0a192f] tracking-tight leading-tight">
                {isEditing ? 'Editar Caso' : 'Novo Caso'}
              </h2>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                {(formData as any).display_id ? `Caso ID: ${(formData as any).display_id}` : 'Insira os dados do caso'}
              </p>
            </div>
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
                    ? 'text-[#1e3a8a] bg-blue-50 font-bold shadow-sm'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                    }`}
                >
                  <div className={`p-1 rounded-lg transition-colors ${isActive ? 'text-[#1e3a8a]' : 'text-gray-300 group-hover:text-gray-500'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.1em] font-bold whitespace-nowrap">{step.label}</span>
                  {isActive && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#1e3a8a] rounded-r-full" />}
                  {isActive && <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#1e3a8a] rounded-t-full" />}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex mt-auto pt-6 border-t border-gray-100">
            <button onClick={onClose} className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
              <X className="w-4 h-4" /> Fechar
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className={`flex-1 flex flex-col min-w-0 ${getThemeBackground(formData.status)} transition-colors duration-300`}>
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8 custom-scrollbar">

            {activeTab === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <ClientFormSection
                  formData={formData}
                  setFormData={setFormData}
                  maskCNPJ={maskCNPJ}
                  handleCNPJSearch={handleCNPJSearch}
                  clientSelectOptions={clientSelectOptions}
                  handleClientChange={handleClientChange}
                  setActiveManager={setActiveManager}
                  duplicateClientCases={duplicateClientCases}
                  getStatusLabel={getStatusLabel}
                  areaOptions={areaOptions}
                  partnerSelectOptions={partnerSelectOptions}
                  onOpenPartnerManager={onOpenPartnerManager}
                />
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <StatusAndDatesSection
                  formData={formData}
                  setFormData={setFormData}
                  statusOptions={statusOptions}
                  handleCreateStatus={handleCreateStatus}
                  ensureDateValue={ensureDateValue}
                  analystSelectOptions={analystSelectOptions}
                  onOpenAnalystManager={onOpenAnalystManager}
                  rejectionByOptions={rejectionByOptions}
                  rejectionReasonOptions={rejectionReasonOptions}
                  partnerSelectOptions={partnerSelectOptions}
                  billingOptions={billingOptions}
                  maskHon={maskHon}
                  setActiveManager={setActiveManager}
                  signatureOptions={signatureOptions}
                  formatForInput={formatForInput}
                  handleAddToList={handleAddToList}
                  removeExtra={removeExtra}
                  newIntermediateFee={newIntermediateFee}
                  setNewIntermediateFee={setNewIntermediateFee}
                  interimInstallments={interimInstallments}
                  setInterimInstallments={setInterimInstallments}
                  handleAddIntermediateFee={handleAddIntermediateFee}
                  interimClause={interimClause}
                  setInterimClause={setInterimClause}
                  handleRemoveIntermediateFee={handleRemoveIntermediateFee}
                  ensureArray={ensureArray}
                  duplicateHonCase={duplicateHonCase}
                  dateWarningMessage={dateWarningMessage}
                  getStatusLabel={getStatusLabel}
                />


              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <section className="space-y-4 bg-white/60 p-5 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm relative z-30 overflow-visible">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Casos</h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={() => { handleTypeChange(''); setIsStandardCNJ(true); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!otherProcessType ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Processos Judiciais</button>
                    <button onClick={() => handleTypeChange('Processo Administrativo')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${otherProcessType === 'Processo Administrativo' ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Processo Administrativo</button>
                    <button onClick={() => handleTypeChange('Consultoria')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${otherProcessType === 'Consultoria' ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Consultoria</button>
                    <button onClick={() => handleTypeChange('Assessoria Jurídica')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${otherProcessType === 'Assessoria Jurídica' ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Assessoria Jurídica</button>
                    <button onClick={() => handleTypeChange('Outros')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${otherProcessType === 'Outros' ? 'bg-salomao-blue text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Outros</button>
                  </div>

                  <LegalProcessForm
                    formData={formData}
                    setFormData={setFormData}
                    currentProcess={currentProcess}
                    setCurrentProcess={setCurrentProcess}
                    isStandardCNJ={isStandardCNJ}
                    setIsStandardCNJ={setIsStandardCNJ}
                    otherProcessType={otherProcessType}
                    setOtherProcessType={setOtherProcessType}
                    searchingCNJ={searchingCNJ}
                    handleCNJSearch={handleCNJSearch}
                    handleOpenJusbrasil={handleOpenJusbrasil}
                    courtSelectOptions={courtSelectOptions}
                    ufOptions={ufOptions}
                    positionOptions={positionOptions}
                    authorOptions={options.authorOptions}
                    opponentOptions={options.opponentOptions}
                    duplicateOpponentCases={duplicateOpponentCases}
                    magistrateTypes={magistrateTypes}
                    magistrateOptions={options.magistrateOptions}
                    newMagistrateTitle={newMagistrateTitle}
                    setNewMagistrateTitle={setNewMagistrateTitle}
                    newMagistrateName={newMagistrateName}
                    setNewMagistrateName={setNewMagistrateName}
                    addMagistrate={addMagistrate}
                    removeMagistrate={removeMagistrate}
                    numeralOptions={numeralOptions}
                    varaSelectOptions={varaSelectOptions}
                    comarcaSelectOptions={comarcaSelectOptions}
                    justiceSelectOptions={justiceSelectOptions}
                    classSelectOptions={classSelectOptions}
                    subjectSelectOptions={subjectSelectOptions}
                    newSubject={newSubject}
                    setNewSubject={setNewSubject}
                    addSubjectToProcess={addSubjectToProcess}
                    removeSubject={removeSubject}
                    editingProcessIndex={editingProcessIndex}
                    handleProcessAction={handleProcessAction}
                    handlePartyCNPJSearch={handlePartyCNPJSearch}
                    localMaskCNJ={localMaskCNJ}
                    ensureDateValue={ensureDateValue}
                    setActiveManager={setActiveManager}
                    duplicateProcessData={duplicateProcessData}
                    duplicateAuthorCases={duplicateAuthorCases}
                    authorHasNoCnpj={authorHasNoCnpj}
                    setAuthorHasNoCnpj={setAuthorHasNoCnpj}
                    opponentHasNoCnpj={opponentHasNoCnpj}
                    setOpponentHasNoCnpj={setOpponentHasNoCnpj}
                  />
                  <LegalProcessList processes={processes} setViewProcess={setViewProcess} setViewProcessIndex={setViewProcessIndex} editProcess={editProcess} removeProcess={removeProcess} />
                </section>
                {(formData.status === 'proposal' || formData.status === 'active') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Referência</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:border-salomao-blue outline-none bg-white mb-4" value={(formData as any).reference || ''} onChange={e => setFormData({ ...formData, reference: e.target.value } as any)} placeholder="Ex: Proposta 123/2025" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label>
                  <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:border-salomao-blue outline-none bg-white" value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: toTitleCase(e.target.value) })}></textarea>
                </div>
              </div>
            )}

            {activeTab === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <ContractDocuments documents={documents} tempFiles={tempFiles} uploading={uploading} status={formData.status} onUpload={handleFileUpload} onDownload={handleDownload} onDelete={handleDeleteDocument} onRemoveTemp={removeTempFile} />
              </div>
            )}

          </div>

          {/* Footer - Moved Inside Content Area */}
          <div className="px-4 py-4 md:px-10 md:py-6 border-t border-black/5 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white/50 backdrop-blur-sm shrink-0">
            <button onClick={onClose} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 bg-white border border-gray-200 sm:border-transparent rounded-xl transition-colors text-center">Cancelar</button>
            <button
              onClick={handleSaveWithIntegrations}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 sm:py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#112240] hover:shadow-xl active:scale-95 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Caso
            </button>
          </div>
        </div>
      </div>

      {/* Overlays / Modals */}
      {activeManager && (
        <OptionManager
          title={activeManager === 'area' ? "Gerenciar Áreas" : activeManager === 'position' ? "Gerenciar Posições" : activeManager === 'court' ? "Gerenciar Tribunais" : activeManager === 'vara' ? "Gerenciar Varas" : activeManager === 'comarca' ? "Gerenciar Comarcas" : activeManager === 'class' ? "Gerenciar Classes" : activeManager === 'subject' ? "Gerenciar Assuntos" : activeManager === 'justice' ? "Gerenciar Justiças" : activeManager === 'magistrate' ? "Gerenciar Magistrados" : activeManager === 'opponent' ? "Gerenciar Contrário" : activeManager === 'author' ? "Gerenciar Autores" : activeManager === 'location' ? "Gerenciar Locais de Faturamento" : activeManager === 'client' ? "Gerenciar Clientes" : "Gerenciar"}
          options={activeManager === 'area' ? options.legalAreas : activeManager === 'position' ? options.positionsList : activeManager === 'court' ? options.courtOptions : activeManager === 'vara' ? options.varaOptions : activeManager === 'comarca' ? options.comarcaOptions : activeManager === 'class' ? options.classOptions : activeManager === 'subject' ? options.subjectOptions : activeManager === 'justice' ? options.justiceOptions : activeManager === 'magistrate' ? options.magistrateOptions : activeManager === 'opponent' ? options.opponentOptions : activeManager === 'author' ? options.authorOptions : activeManager === 'location' ? options.billingLocations : activeManager === 'client' ? options.clientOptions : []}
          onAdd={(v) => options.handleGenericAdd(v, { title: (formData as any).newMagistrateTitle, setNewSubject, setNewMagistrateName })}
          onRemove={options.handleGenericRemove}
          onEdit={options.handleGenericEdit}
          onClose={() => setActiveManager(null)}
          placeholder={activeManager === 'comarca' && !currentProcess.uf ? "Selecione a UF primeiro" : "Digite o nome"}
        />
      )}

      <ProcessDetailsModal process={viewProcess} onClose={() => setViewProcess(null)} onEdit={() => { if (viewProcessIndex !== null) { setViewProcess(null); editProcess(viewProcessIndex); } }} />
    </div>
  );
}
