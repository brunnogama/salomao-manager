import React, { useState, useEffect } from 'react';
import {
  FileText,
  Loader2,
  Eye,
  CheckCircle,
  FileSignature,
  Search,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { Contract, Partner, ContractProcess, TimelineEvent, Analyst, Collaborator } from '../../../types/controladoria';
import { ContractFormModal } from '../contracts/ContractFormModal';
import { generateProposalDocx } from '../../../utils/docxGenerator';
import { maskMoney, maskCNPJ } from '../utils/masks';
import { moedaPorExtenso, percentualPorExtenso } from '../../../utils/extenso';
import { CustomSelect } from '../ui/CustomSelect';
import { safeParseFloat } from '../utils/contractHelpers';

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

interface FeeClause {
  value: string;
  description: string;
  type: 'currency' | 'percent'; // Added type
}

export function Proposals() {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [clientOptions, setClientOptions] = useState<{ label: string; value: string }[]>([]);

  // Form State
  const [proposalData, setProposalData] = useState({
    clientName: '',
    cnpj: '',
    // partner_id: '', // REMOVED
    // partner_name: '', // REMOVED
    selectedPartners: [] as (Partner & { collaboratorData?: Collaborator })[], // New: Multiple Partners
    reference: '[incluir objeto da proposta]', // Referência da Proposta (Top)
    object: '[incluir o objeto da proposta]', // Objeto da Disputa (Clause 1.1)
    contractLocation: 'Rio de Janeiro', // New: Location

    // New Structure for multiple clauses with types
    pro_labore_clauses: [{ value: '', description: '', type: 'currency' }] as FeeClause[],
    intermediate_fee_clauses: [{ value: '', description: '', type: 'currency' }] as FeeClause[],

    // Unified Success Fees
    final_success_fee_clauses: [{ value: '', description: '', type: 'currency' }] as FeeClause[],
  });

  // Modal State (for after generation)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contractFormData, setContractFormData] = useState<Contract>({} as Contract);
  const [processes, setProcesses] = useState<ContractProcess[]>([]);
  const [currentProcess, setCurrentProcess] = useState<ContractProcess>({ process_number: '' });
  const [editingProcessIndex] = useState<number | null>(null);
  const [newIntermediateFee, setNewIntermediateFee] = useState('');
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);

  // Fetch Inputs
  useEffect(() => {
    fetchPartners();
    fetchClients();
  }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners(data);
    const { data: analystsData } = await supabase.from('analysts').select('*').eq('active', true).order('name');
    if (analystsData) setAnalysts(analystsData as Analyst[]);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('name, cnpj').order('name');
    if (data) {
      setClientOptions(data.map(c => ({ label: c.name, value: c.name }))); // Value is name for the proposal
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'cnpj') {
      setProposalData(prev => ({ ...prev, [name]: maskCNPJ(value) }));
    } else {
      setProposalData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePartnerAdd = async (partnerId: string) => {
    if (!partnerId) return;

    // Check if already selected
    if (proposalData.selectedPartners.find(p => p.id === partnerId)) {
      return toast.error("Este sócio já foi adicionado.");
    }

    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    // Fetch details from Collaborators
    let collaboratorData: Collaborator | undefined;

    // Attempt 1: Search by name (Assuming exact match or close enough)
    // We should probably rely on a linked ID if it existed, but name is what we have typically
    const { data: collabData } = await supabase
      .from('collaborators')
      .select('*')
      .ilike('name', partner.name)
      .eq('status', 'active') // Only active ones?
      .maybeSingle();

    if (collabData) {
      collaboratorData = collabData as Collaborator;
    } else {
      // Fallback: If partner table has info (it usually doesn't have details like OAB/Civil Status fully populated in types but let's check runtime)
      // For now, if not found, we just use partner data.
      toast.warning(`Dados detalhados não encontrados em Colaboradores para ${partner.name}.`);
    }

    setProposalData(prev => ({
      ...prev,
      selectedPartners: [...prev.selectedPartners, { ...partner, collaboratorData }]
    }));
  };

  const handlePartnerRemove = (index: number) => {
    setProposalData(prev => ({
      ...prev,
      selectedPartners: prev.selectedPartners.filter((_, i) => i !== index)
    }));
  };

  // Helper to update clauses
  const updateClause = (
    type: 'pro_labore_clauses' | 'final_success_fee_clauses' | 'intermediate_fee_clauses',
    index: number,
    field: 'value' | 'description' | 'type',
    value: string
  ) => {
    setProposalData(prev => {
      const newClauses = [...prev[type]];
      if (field === 'type') {
        newClauses[index].type = value as 'currency' | 'percent';
        newClauses[index].value = ''; // Reset value on type change to avoid mask confusion
      } else if (field === 'value') {
        const currentType = newClauses[index].type;
        if (currentType === 'currency') {
          newClauses[index][field] = maskMoney(value);
        } else {
          newClauses[index][field] = value;
        }
      } else {
        newClauses[index][field] = value;
      }
      return { ...prev, [type]: newClauses };
    });
  };

  const addClause = (type: 'pro_labore_clauses' | 'final_success_fee_clauses' | 'intermediate_fee_clauses') => {
    setProposalData(prev => ({
      ...prev,
      [type]: [...prev[type], {
        value: '',
        description: '',
        type: 'currency' // Default to currency, user can toggle
      }]
    }));
  };

  const removeClause = (type: 'pro_labore_clauses' | 'final_success_fee_clauses' | 'intermediate_fee_clauses', index: number) => {
    setProposalData(prev => {
      // Allow removing all if needed, but maybe keep 1 for UX? 
      // User requested distinct sections, so maybe empty sections are allowed?
      // Let's keep at least one empty row to be safe and visible.
      if (prev[type].length <= 1) {
        // If it's the last one, just clear it instead of removing
        const newClauses = [...prev[type]];
        newClauses[0] = { ...newClauses[0], value: '', description: '' };
        return { ...prev, [type]: newClauses };
      }
      return {
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      };
    });
  };

  const handleClientNameChange = async (name: string) => {
    setProposalData(prev => ({ ...prev, clientName: name }));
    // Try to find CNPJ if existing client selected
    if (name) {
      const { data } = await supabase.from('clients').select('cnpj').eq('name', name).maybeSingle();
      if (data && data.cnpj) {
        setProposalData(prev => ({ ...prev, cnpj: maskCNPJ(data.cnpj) }));
      }
    }
  };

  const handleCNPJSearch = async () => {
    if (!proposalData.cnpj) return;
    const cnpjLimpo = proposalData.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return toast.error('CNPJ inválido. Digite 14 dígitos.');

    const toastId = toast.loading('Buscando dados da empresa...');
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) throw new Error('CNPJ não encontrado na Receita Federal');
      const data = await response.json();

      const razaoSocial = toTitleCase(data.razao_social || data.nome_fantasia || '');

      setProposalData(prev => ({
        ...prev,
        clientName: razaoSocial,
        cnpj: maskCNPJ(cnpjLimpo)
      }));
      toast.success('Dados encontrados!', { id: toastId });
    } catch (error: any) {
      toast.error(`Erro na busca: ${error.message}`, { id: toastId });
    }
  };

  const handleGenerateProposal = async () => {
    if (!proposalData.clientName) return toast.error("Preencha o Nome do Cliente");
    if (proposalData.selectedPartners.length === 0) return toast.error("Selecione pelo menos um Sócio");

    setLoading(true);
    const toastId = toast.loading("Gerando proposta e documentos...");

    try {
      // 1. Create Contract Record

      const proLaboreMain = proposalData.pro_labore_clauses[0];
      const proLaboreExtras = proposalData.pro_labore_clauses.slice(1).map(c => c.value);
      const proLaboreExtrasClauses = proposalData.pro_labore_clauses.slice(1).map(c => c.description);

      // Unified Success Fees
      // We need to map these to the DB structure. 
      // The DB has `final_success_fee` (string), `final_success_percent` (string), and extras.
      // We should probably store the first currency one in `final_success_fee`, first percent in `final_success_percent`?
      // OR, since we are unifying, maybe we just treat them all as a list.
      // However, the DB/Contract interface expects specific fields. 
      // For legacy compatibility, let's try to map the first occurrence of each type to the main fields.

      const firstCurrencySuccess = proposalData.final_success_fee_clauses.find(c => c.type === 'currency');
      const firstPercentSuccess = proposalData.final_success_fee_clauses.find(c => c.type === 'percent');

      // Extras are those that are NOT the firstCurrency or firstPercent
      const successExtras = proposalData.final_success_fee_clauses.filter(c => c !== firstCurrencySuccess && c !== firstPercentSuccess);

      // We'll store extras in `final_success_extras` (for currency) and `percent_extras` (for percent)
      // Actually, let's just dump ALL mixed extras into `final_success_extras` with a marker? 
      // No, `final_success_extras` is usually just values. `final_success_extras_clauses` is descriptions.
      // `docxGenerator` needs to know the type to format properly.
      // Let's separate them:
      const currencyExtras = successExtras.filter(c => c.type === 'currency');
      const percentExtras = successExtras.filter(c => c.type === 'percent');

      const intermediateValues = proposalData.intermediate_fee_clauses.map(c => c.value).filter(Boolean);
      const intermediateClauses = proposalData.intermediate_fee_clauses.map(c => c.description).filter(Boolean);

      // Prepare Partners Data for JSON storage or Observations (if needed in DB)
      // The `contracts` table has `partner_id` and `partner_name`. We should set the primary one (first one) there.
      const primaryPartner = proposalData.selectedPartners[0];

      const newContract: any = {
        client_name: proposalData.clientName,
        cnpj: proposalData.cnpj,
        partner_id: primaryPartner.id, // Primary
        status: 'proposal',
        proposal_date: new Date().toISOString(),
        reference: proposalData.reference,
        observations: proposalData.object,

        // Mapped Fields
        pro_labore: safeParseFloat(proLaboreMain.value),
        pro_labore_clause: proLaboreMain.description,
        pro_labore_extras: proLaboreExtras.length ? proLaboreExtras.map(v => safeParseFloat(v)) : null,
        pro_labore_extras_clauses: proLaboreExtrasClauses.length ? proLaboreExtrasClauses : null,

        // Success Fees Mapped
        final_success_fee: firstCurrencySuccess ? safeParseFloat(firstCurrencySuccess.value) : null,
        final_success_fee_clause: firstCurrencySuccess?.description || null,

        final_success_percent: firstPercentSuccess?.value || null,
        final_success_percent_clause: firstPercentSuccess?.description || null,

        final_success_extras: currencyExtras.length ? currencyExtras.map(c => safeParseFloat(c.value)) : null,
        final_success_extras_clauses: currencyExtras.length ? currencyExtras.map(c => c.description) : null,

        percent_extras: percentExtras.length ? percentExtras.map(c => safeParseFloat(c.value)) : null,
        percent_extras_clauses: percentExtras.length ? percentExtras.map(c => c.description) : null,

        intermediate_fees: intermediateValues.length ? intermediateValues.map(v => safeParseFloat(v)) : null,
        intermediate_fees_clauses: intermediateClauses.length ? intermediateClauses : null,

        has_legal_process: false,
        uf: proposalData.contractLocation || 'RJ', // Use selected location or fallback

        // Store full partner list in a JSON field if possible, or we just rely on the DOCX generation
        // DB doesn't seem to have `partners_data` column yet. We won't persist other partners in DB for now, just the primary.
        // But we DO need to generate the doc with ALL of them.
      };

      // Clean up undefined/empty
      Object.keys(newContract).forEach(k => {
        if (newContract[k] === null || newContract[k] === undefined || newContract[k] === "") {
          delete newContract[k];
        }
      });

      const { data: existingClient } = await supabase.from('clients').select('id').eq('name', proposalData.clientName).maybeSingle();
      if (existingClient) {
        newContract.client_id = existingClient.id;
      } else if (proposalData.cnpj) {
        const { data: clientByCnpj } = await supabase.from('clients').select('id').eq('cnpj', proposalData.cnpj.replace(/\D/g, '')).maybeSingle();
        if (clientByCnpj) newContract.client_id = clientByCnpj.id;
      }

      const { data: insertedContract, error: insertError } = await supabase
        .from('contracts')
        .insert(newContract)
        .select()
        .single();

      if (insertError) {
        console.error("Insert Error Payload:", newContract); // For debugging
        throw insertError;
      }

      // 2. Generate Proposal Code
      const proposalCode = `PROP - ${String(insertedContract.seq_id).padStart(6, '0')}.1`;

      // Update contract with code
      await supabase
        .from('contracts')
        .update({ proposal_code: proposalCode })
        .eq('id', insertedContract.id);

      // 3. Generate DOCX
      // Prepare full data object for generator
      const fullContractData: Contract & { partners_data: any[], location: string, full_success_clauses: FeeClause[] } = {
        ...insertedContract,
        partner_name: primaryPartner.name,
        proposal_code: proposalCode,

        // Passing extended data
        partners_data: proposalData.selectedPartners.map(p => ({
          name: p.name,
          civil_status: p.collaboratorData?.civil_status || 'casado(a)', // Default fallback
          nacionalidade: p.collaboratorData?.nacionalidade || 'brasileiro(a)',
          oab_numero: p.collaboratorData?.oab_numero || p.oab_number || 'XXXXXX',
          oab_uf: p.collaboratorData?.oab_uf || p.oab_state || 'RJ',
          cpf: p.collaboratorData?.cpf || p.cpf || 'XXX.XXX.XXX-XX',
          gender: p.collaboratorData?.gender || p.gender || 'M', // Important for agreement
        })),

        location: proposalData.contractLocation,
        reference: proposalData.reference,

        // Ensure these are arrays for the generator
        pro_labore_extras: proLaboreExtras,
        pro_labore_extras_clauses: proLaboreExtrasClauses,

        final_success_extras: currencyExtras.length ? currencyExtras.map(c => c.value) : undefined,
        final_success_extras_clauses: currencyExtras.length ? currencyExtras.map(c => c.description) : undefined,

        percent_extras: percentExtras.length ? percentExtras.map(c => c.value) : undefined,
        percent_extras_clauses: percentExtras.length ? percentExtras.map(c => c.description) : undefined,

        intermediate_fees: intermediateValues,
        intermediate_fees_clauses: intermediateClauses,

        // Passing the raw mixed list helps the generator output in order if it supports it
        // But since we mapped to split fields, the generator logic (which iterates separately) might be fine.
        // Or we should update generator to use a mixed list.
        // Let's pass the mixed list too, so the generator can use it for exact ordering!
        full_success_clauses: proposalData.final_success_fee_clauses,
      };

      const docBlob = await generateProposalDocx(fullContractData, proposalCode);
      const fileName = `Proposta_${proposalData.clientName.replace(/[^a-z0-9]/gi, '_')}_${proposalCode}.docx`;

      // 4. Upload DOCX
      const filePath = `${insertedContract.id}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('ged-documentos')
        .upload(filePath, docBlob, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

      if (uploadError) throw uploadError;

      // 5. Register Document
      const { data: docData, error: docError } = await supabase
        .from('contract_documents')
        .insert({
          contract_id: insertedContract.id,
          file_name: fileName,
          file_path: filePath,
          file_type: 'proposal',
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (docError) throw docError;

      // 6. Download for User
      saveAs(docBlob, fileName);

      toast.success("Proposta gerada com sucesso!", { id: toastId });

      // 7. Open Modal
      setContractFormData({
        ...insertedContract,
        display_id: String(insertedContract.seq_id).padStart(6, '0'),
        partner_name: primaryPartner.name,
        proposal_code: proposalCode,
        documents: [docData],
        // Reset honorariums to blank for manual entry as requested
        pro_labore: null,
        pro_labore_clause: null,
        pro_labore_extras: null,
        pro_labore_extras_clauses: null,
        final_success_fee: null,
        final_success_fee_clause: null,
        final_success_percent: null,
        final_success_percent_clause: null,
        final_success_extras: null,
        final_success_extras_clauses: null,
        percent_extras: null,
        percent_extras_clauses: null,
        intermediate_fees: null,
        intermediate_fees_clauses: null,
      });
      setProcesses([]);
      setTimelineData([]);
      setIsModalOpen(true);

    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao gerar proposta: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Helpers for Mock Preview
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Render Clause Input Helper
  const renderClauseInputs = (
    title: string,
    type: 'pro_labore_clauses' | 'final_success_fee_clauses' | 'intermediate_fee_clauses',
    valuePlaceholder: string,
    descPlaceholder: string,
    showTypeToggle: boolean = false
  ) => (
    <div className="mb-4">
      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{title}</label>
      {proposalData[type].map((clause, index) => (
        <div key={index} className="flex gap-2 mb-2 items-start">

          {/* Value Input Group */}
          <div className="w-1/3 relative flex flex-col gap-1">
            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/50 focus-within:border-[#1e3a8a] transition-all overflow-hidden">
              {showTypeToggle && (
                <button
                  onClick={() => updateClause(type, index, 'type', clause.type === 'currency' ? 'percent' : 'currency')}
                  className={`px-3 py-3.5 text-xs font-bold border-r border-gray-200 hover:bg-gray-100 transition-colors ${clause.type === 'percent' ? 'text-blue-600' : 'text-green-600'}`}
                  title={clause.type === 'currency' ? 'Mudar para %' : 'Mudar para R$'}
                >
                  {clause.type === 'currency' ? 'R$' : '%'}
                </button>
              )}
              <input
                type="text"
                value={clause.value}
                onChange={(e) => updateClause(type, index, 'value', e.target.value)}
                placeholder={showTypeToggle ? (clause.type === 'currency' ? valuePlaceholder : '0%') : valuePlaceholder}
                className={`w-full p-3.5 text-sm font-bold text-gray-700 outline-none bg-transparent ${!showTypeToggle ? 'pl-4' : ''}`}
              />
            </div>
          </div>

          <div className="w-2/3 flex gap-2">
            <input
              type="text"
              value={clause.description}
              onChange={(e) => updateClause(type, index, 'description', e.target.value)}
              placeholder={descPlaceholder}
              className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
            />
            {index === 0 ? (
              <button
                onClick={() => addClause(type)}
                className="p-3.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                title="Adicionar Cláusula"
              >
                <Plus className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => removeClause(type, index)}
                className="p-3.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                title="Remover Cláusula"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">

      {/* 1. Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Propostas</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gerador de Propostas e Minutas</p>
          </div>
        </div>
      </div>

      {/* Conteúdo da página */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-start">

        {/* ESQUERDA: Formulário */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>

          <h2 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-[#1e3a8a]" /> Dados da Proposta
          </h2>

          <div className="space-y-5">
            <div>
              <CustomSelect
                label="Cliente [Nome da Empresa]"
                value={proposalData.clientName}
                onChange={handleClientNameChange}
                options={clientOptions}
                placeholder="Selecione ou digite o nome"
                allowCustomValue={true}
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">CNPJ [da Empresa Cliente]</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="cnpj"
                  value={proposalData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
                />
                <button
                  onClick={handleCNPJSearch}
                  disabled={!proposalData.cnpj}
                  className="p-3.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  title="Buscar CNPJ"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sócios Responsáveis</label>

              <div className="space-y-2 mb-3">
                {proposalData.selectedPartners.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-blue-900">{p.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {p.collaboratorData ? 'Dados em Colaboradores: OK' : 'Sem dados em Colaboradores (usando básico)'}
                      </span>
                    </div>
                    <button
                      onClick={() => handlePartnerRemove(idx)}
                      className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <select
                  onChange={(e) => handlePartnerAdd(e.target.value)}
                  value=""
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all cursor-pointer"
                >
                  <option value="">+ Adicionar um sócio...</option>
                  {partners.filter(p => !proposalData.selectedPartners.some(sp => sp.id === p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Local do Contrato</label>
              <CustomSelect
                label="" // Empty label as we have the header above
                value={proposalData.contractLocation}
                onChange={(val) => setProposalData(prev => ({ ...prev, contractLocation: val }))}
                options={[
                  { label: 'Rio de Janeiro', value: 'Rio de Janeiro' },
                  { label: 'São Paulo', value: 'São Paulo' },
                  { label: 'Brasília', value: 'Brasília' },
                  { label: 'Vitória', value: 'Vitória' },
                ]}
                allowCustomValue={true}
                placeholder="Selecione ou digite a cidade"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Referência da Proposta</label>
              <input
                type="text"
                name="reference"
                value={proposalData.reference}
                onChange={handleChange}
                placeholder="Ex: Contrato de Honorários..."
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Objeto da Proposta</label>
              <textarea
                name="object"
                value={proposalData.object}
                onChange={handleChange}
                rows={3}
                placeholder="Ex: Assessoria Jurídica na ação..."
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none resize-none bg-gray-50/50 transition-all"
              />
            </div>

            {/* Fields Refactored */}
            {/* Fields Refactored */}
            {renderClauseInputs("Pró-Labore & Condições", "pro_labore_clauses", "R$ 0,00", "Descrição do pró-labore...", true)}
            {renderClauseInputs("Êxito Intermediário", "intermediate_fee_clauses", "R$ 0,00", "Descrição do êxito...", true)}

            {/* Unified Success Fees */}
            {renderClauseInputs("Êxito Final (R$ ou %)", "final_success_fee_clauses", "Valor", "Descrição do êxito...", true)}

          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleGenerateProposal}
              disabled={loading}
              className="bg-[#1e3a8a] hover:bg-[#112240] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Gerar Proposta & Criar Caso
            </button>
          </div>
        </div>

        {/* DIREITA: Preview Visual */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center relative min-h-[800px]">
          <p className="absolute top-4 right-6 text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
            <Eye className="w-3 h-3" /> Visualização em Tempo Real
          </p>

          {/* A4 Paper Simulation */}
          <div className="w-full max-w-[500px] bg-white shadow-2xl p-8 md:p-12 text-left border border-gray-100 h-full text-[#0a192f] text-[10px] leading-relaxed scale-95 origin-top select-none">

            {/* Header Image Placeholder */}
            <div className="flex justify-center mb-8">
              <img src="/logo-salomao.png" alt="Logo" className="h-10 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>

            {/* Date */}
            <div className="text-right mb-6">
              <span className="bg-yellow-200/50 px-1">{proposalData.contractLocation}, {today}</span>.
            </div>

            {/* Addressee */}
            <div className="mb-6 font-bold">
              <p>AO <span className="bg-yellow-200/50 px-1 uppercase">{proposalData.clientName || '[NOME DA EMPRESA CLIENTE]'}</span></p>
              <p className="mt-1"><span className="bg-yellow-200/50 px-1">{proposalData.cnpj || '[CNPJ da empresa cliente]'}</span></p>
            </div>

            {/* Ref */}
            <div className="mb-4">
              <p><strong>Ref:</strong> <span className="bg-yellow-200/50 px-1">{proposalData.reference || '[incluir objeto da proposta]'}</span></p>
              <p><strong>Cód.:</strong> <span className="bg-yellow-200/50 px-1">[código proposta]</span></p>
            </div>

            <p className="mb-4">Prezado Sr.</p>

            <p className="text-justify mb-4">
              É com grande honra que <strong>SALOMÃO ADVOGADOS</strong>, neste ato representado, respectivamente, por seus sócios
              {proposalData.selectedPartners.length > 0 ? (
                proposalData.selectedPartners.map((p, idx) => (
                  <span key={p.id}>
                    {idx > 0 && ", e "}
                    <span className="bg-yellow-200/50 px-1 font-bold ml-1">{p.name}</span>
                    {(() => {
                      const data = p.collaboratorData;
                      const gender = data?.gender || p.gender || 'M';
                      const isFem = ['F', 'Feminino', 'Female'].includes(gender);

                      const oab = data?.oab_numero || p.oab_number || 'XXXXXX';
                      const oabUf = data?.oab_uf || p.oab_state || 'RJ';
                      const cpf = data?.cpf || p.cpf || 'XXX.XXX.XXX-XX';

                      const civil = data?.civil_status ? data.civil_status.toLowerCase() : 'casado';
                      const nacionalidade = data?.nacionalidade ? data.nacionalidade.toLowerCase() : 'brasileiro';

                      // Inflections
                      const textNacionalidade = isFem && nacionalidade.includes('brasileir') ? 'brasileira' : nacionalidade;
                      const textCivil = isFem && civil.includes('casad') ? 'casada' : (isFem && civil.includes('solteir') ? 'solteira' : civil);
                      const textAdvogado = isFem ? 'advogada' : 'advogado';
                      const textInscrito = isFem ? 'inscrita' : 'inscrito';
                      const textPortador = isFem ? 'portadora' : 'portador';

                      return `, ${textNacionalidade}, ${textCivil}, ${textAdvogado}, ${textInscrito} na OAB/${oabUf} sob o nº ${oab}, ${textPortador} do CPF/MF nº ${cpf}`;
                    })()}
                  </span>
                ))
              ) : (
                <span className="bg-yellow-200/50 px-1 font-bold ml-1">[incluir nome do sócio]</span>
              )}
              , vem formular a presente proposta de honorários...
            </p>

            {/* 1. Objeto */}
            <p className="font-bold mb-2">1. OBJETO E ESCOPO DO SERVIÇO:</p>
            <p className="text-justify mb-4">
              1.1. O objeto da presente proposta é a assessoria jurídica... em favor do Cliente
              <span className="bg-yellow-200/50 px-1 uppercase mx-1">{proposalData.clientName || '[NOME DA EMPRESA CLIENTE]'}</span>
              no <span className="bg-yellow-200/50 px-1">{proposalData.object || '[incluir o objeto da proposta]'}</span>.
            </p>

            {/* 2. Honorários */}
            <p className="font-bold mb-2">2. HONORÁRIOS E FORMA DE PAGAMENTO:</p>
            <p className="text-justify mb-2">
              2.1. Considerando as particularidades do caso, propomos honorários da seguinte forma:
            </p>

            {/* Dynamic Clauses Preview */}
            {/* Pro-Labore (Starts at 2.2) */}
            {proposalData.pro_labore_clauses.map((clause, idx) => {
              const num = `2.${2 + idx}`;
              return (
                <p key={`pl-${idx}`} className="text-justify mb-2">
                  {num}. Honorários pró-labore de <span className="bg-yellow-200/50 px-1">{clause.value || '[valor]'}</span> {clause.description}
                </p>
              );
            })}

            {/* Intermediate (Starts after Pro-Labore) */}
            {proposalData.intermediate_fee_clauses.map((clause, idx) => {
              // Base index = 2 (previous fixed) + length of previous
              const base = 2 + proposalData.pro_labore_clauses.length;
              const num = `2.${base + idx}`;
              return (
                <p key={`int-${idx}`} className="text-justify mb-2">
                  {num}. Êxito intermediário: <span className="bg-yellow-200/50 px-1">{clause.value || '[valor]'}</span> {clause.description}
                </p>
              );
            })}

            {/* Final Success - Unified */}
            {proposalData.final_success_fee_clauses.map((clause, idx) => {
              const base = 2 + proposalData.pro_labore_clauses.length + proposalData.intermediate_fee_clauses.length;
              const num = `2.${base + idx}`;

              let previewValue = clause.value || (clause.type === 'currency' ? '[valor]' : '[percentual]');
              let extensoPart = "";
              if (clause.value) {
                if (clause.type === 'currency') {
                  extensoPart = `(${moedaPorExtenso(parseFloat(clause.value.replace(/[^\d,]/g, '').replace(',', '.') || '0'))})`;
                } else {
                  extensoPart = `(${percentualPorExtenso(parseFloat(clause.value.replace(',', '.') || '0'))})`;
                }
              }

              return (
                <p key={`sf-unified-${idx}`} className="text-justify mb-2">
                  {num}. Honorários finais de êxito de <span className="bg-yellow-200/50 px-1">{previewValue} {extensoPart}</span> {clause.description}
                </p>
              );
            })}

            {/* Signatures */}
            <div className="text-center mt-12 space-y-8">
              <div>
                <p className="mb-2">Cordialmente,</p>
                {proposalData.selectedPartners.length > 0 ? proposalData.selectedPartners.map(p => (
                  <p key={p.id} className="bg-yellow-200/50 px-1 font-bold block">{p.name}</p>
                )) : (
                  <p className="bg-yellow-200/50 px-1 font-bold inline-block">[Incluir nome do sócio]</p>
                )}
                <p className="font-bold">SALOMÃO ADVOGADOS</p>
              </div>

              <div>
                <p className="bg-yellow-200/50 px-1 font-bold inline-block uppercase">{proposalData.clientName || '[CLIENTE]'}</p>
              </div>

              <div className="text-left mt-8">
                <p>De acordo em: ___/___/___</p>
              </div>
            </div>

            {/* Footer simulation */}
            <div className="mt-12 pt-4 flex justify-between items-end border-t border-transparent opacity-50">
              <img src="/rodape1.png" className="h-4 object-contain" alt="Footer 1" onError={(e) => e.currentTarget.style.display = 'none'} />
              <img src="/rodape2.png" className="h-6 object-contain" alt="Footer 2" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>

          </div>
        </div>

      </div>

      {/* Hidden Modal to open after generation */}
      {isModalOpen && (
        <ContractFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          formData={contractFormData}
          setFormData={setContractFormData}
          onSave={() => { }}
          loading={false}
          isEditing={true} // So it allows editing immediately
          partners={partners}
          onOpenPartnerManager={() => { }}
          analysts={analysts}
          onOpenAnalystManager={() => { }}
          onCNPJSearch={() => { }}
          processes={processes}
          currentProcess={currentProcess}
          setCurrentProcess={setCurrentProcess}
          editingProcessIndex={editingProcessIndex}
          handleProcessAction={() => { }}
          editProcess={() => { }}
          removeProcess={() => { }}
          newIntermediateFee={newIntermediateFee}
          setNewIntermediateFee={setNewIntermediateFee}
          addIntermediateFee={() => { }}
          removeIntermediateFee={() => { }}
          timelineData={timelineData}
          getStatusColor={() => ''}
          getStatusLabel={() => ''}
        />
      )}
    </div>
  );
}
