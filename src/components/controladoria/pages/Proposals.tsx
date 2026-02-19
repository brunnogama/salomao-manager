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
  DollarSign,
  Percent
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { Contract, Partner, ContractProcess, TimelineEvent, Analyst } from '../../../types/controladoria';
import { ContractFormModal } from '../contracts/ContractFormModal';
import { generateProposalDocx } from '../../../utils/docxGenerator';
import { maskMoney, maskCNPJ } from '../utils/masks';
import { CustomSelect } from '../ui/CustomSelect';

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
    partner_id: '',
    partner_name: '', // For display/doc
    object: '', // Objeto da Proposta/Disputa

    // New Structure for multiple clauses with types
    pro_labore_clauses: [{ value: '', description: '', type: 'currency' }] as FeeClause[],
    intermediate_fee_clauses: [{ value: '', description: '', type: 'currency' }] as FeeClause[],

    // Split Success Fees
    success_fee_fixed: [{ value: '', description: '', type: 'currency' }] as FeeClause[],
    success_fee_percent: [{ value: '', description: '', type: 'percent' }] as FeeClause[],
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

    if (name === 'partner_id') {
      const selectedPartner = partners.find(p => p.id === value);
      setProposalData(prev => ({
        ...prev,
        partner_id: value,
        partner_name: selectedPartner ? selectedPartner.name : ''
      }));
    } else if (name === 'cnpj') {
      setProposalData(prev => ({ ...prev, [name]: maskCNPJ(value) }));
    } else {
      setProposalData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Helper to update clauses
  const updateClause = (
    type: 'pro_labore_clauses' | 'success_fee_fixed' | 'success_fee_percent' | 'intermediate_fee_clauses',
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

  const addClause = (type: 'pro_labore_clauses' | 'success_fee_fixed' | 'success_fee_percent' | 'intermediate_fee_clauses') => {
    setProposalData(prev => ({
      ...prev,
      [type]: [...prev[type], {
        value: '',
        description: '',
        type: type === 'success_fee_percent' ? 'percent' : 'currency' // Default based on section
      }]
    }));
  };

  const removeClause = (type: 'pro_labore_clauses' | 'success_fee_fixed' | 'success_fee_percent' | 'intermediate_fee_clauses', index: number) => {
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
    if (!proposalData.partner_id) return toast.error("Selecione um Sócio");

    setLoading(true);
    const toastId = toast.loading("Gerando proposta e documentos...");

    try {
      // 1. Create Contract Record

      const proLaboreMain = proposalData.pro_labore_clauses[0];
      const proLaboreExtras = proposalData.pro_labore_clauses.slice(1).map(c => c.value);
      const proLaboreExtrasClauses = proposalData.pro_labore_clauses.slice(1).map(c => c.description);

      const successFixedMain = proposalData.success_fee_fixed[0];
      const successFixedExtras = proposalData.success_fee_fixed.slice(1).map(c => c.value);
      const successFixedExtrasClauses = proposalData.success_fee_fixed.slice(1).map(c => c.description);

      const successPercentMain = proposalData.success_fee_percent[0];
      const successPercentExtras = proposalData.success_fee_percent.slice(1).map(c => c.value);
      const successPercentExtrasClauses = proposalData.success_fee_percent.slice(1).map(c => c.description);

      const intermediateValues = proposalData.intermediate_fee_clauses.map(c => c.value).filter(Boolean);
      const intermediateClauses = proposalData.intermediate_fee_clauses.map(c => c.description).filter(Boolean);

      const newContract: any = {
        client_name: proposalData.clientName,
        cnpj: proposalData.cnpj,
        partner_id: proposalData.partner_id,
        status: 'proposal',
        proposal_date: new Date().toISOString(),
        observations: proposalData.object,

        // Mapped Fields
        pro_labore: proLaboreMain.value,
        pro_labore_clause: proLaboreMain.description,
        pro_labore_extras: proLaboreExtras.length ? proLaboreExtras : null,
        pro_labore_extras_clauses: proLaboreExtrasClauses.length ? proLaboreExtrasClauses : null,

        // Fixed Success Fees 
        final_success_fee: successFixedMain.value,
        final_success_fee_clause: successFixedMain.description,
        final_success_extras: successFixedExtras.length ? successFixedExtras : null,
        final_success_extras_clauses: successFixedExtrasClauses.length ? successFixedExtrasClauses : null,

        // Percent Success Fees (Using 'percent_extras' to store them for simplicity or mapped fields)
        // We will map main percent to `final_success_percent` and others to `percent_extras`
        final_success_percent: successPercentMain.value,
        final_success_percent_clause: successPercentMain.description,
        percent_extras: successPercentExtras.length ? successPercentExtras : null,
        percent_extras_clauses: successPercentExtrasClauses.length ? successPercentExtrasClauses : null,

        intermediate_fees: intermediateValues.length ? intermediateValues : null,
        intermediate_fees_clauses: intermediateClauses.length ? intermediateClauses : null,

        has_legal_process: false,
        uf: 'RJ'
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
      const fullContractData: Contract = {
        ...insertedContract,
        partner_name: proposalData.partner_name,
        proposal_code: proposalCode,

        // Ensure these are arrays for the generator
        pro_labore_extras: proLaboreExtras,
        pro_labore_extras_clauses: proLaboreExtrasClauses,

        final_success_extras: successFixedExtras,
        final_success_extras_clauses: successFixedExtrasClauses,

        percent_extras: successPercentExtras,
        percent_extras_clauses: successPercentExtrasClauses,

        intermediate_fees: intermediateValues,
        intermediate_fees_clauses: intermediateClauses,
      };

      const docBlob = await generateProposalDocx(fullContractData, proposalCode);
      const fileName = `Proposta_${proposalData.clientName.replace(/[^a-z0-9]/gi, '_')}_${proposalCode}.docx`;

      // 4. Upload DOCX
      const filePath = `${insertedContract.id}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
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
        partner_name: proposalData.partner_name,
        proposal_code: proposalCode,
        documents: [docData]
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
    type: 'pro_labore_clauses' | 'success_fee_fixed' | 'success_fee_percent' | 'intermediate_fee_clauses',
    valuePlaceholder: string,
    descPlaceholder: string,
    showTypeToggle: boolean = false
  ) => (
    <div className="mb-4">
      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{title}</label>
      {proposalData[type].map((clause, index) => (
        <div key={index} className="flex gap-2 mb-2 items-start">

          {/* Value Input Group */}
          <div className="w-1/3 relative">
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
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sócio Responsável [Nome do Sócio]</label>
              <select
                name="partner_id"
                value={proposalData.partner_id}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all cursor-pointer"
              >
                <option value="">Selecione um sócio...</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ref: [Objeto da Proposta]</label>
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
            {renderClauseInputs("Pró-Labore & Condições", "pro_labore_clauses", "R$ 0,00", "Descrição do pró-labore...", true)}
            {renderClauseInputs("Êxito Intermediário", "intermediate_fee_clauses", "R$ 0,00", "Descrição do êxito...", true)}

            {/* Split Success Fees */}
            {renderClauseInputs("Êxito Final (Valores Fixos - R$)", "success_fee_fixed", "R$ 0,00", "Descrição do êxito...", false)}
            {renderClauseInputs("Êxito Final (Percentual - %)", "success_fee_percent", "% 0", "Descrição (% do benefício econômico...)", false)}

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
              <span className="bg-yellow-200/50 px-1">{today}</span>.
            </div>

            {/* Addressee */}
            <div className="mb-6 font-bold">
              <p>AO <span className="bg-yellow-200/50 px-1 uppercase">{proposalData.clientName || '[NOME DA EMPRESA CLIENTE]'}</span></p>
              <p className="mt-1"><span className="bg-yellow-200/50 px-1">{proposalData.cnpj || '[CNPJ da empresa cliente]'}</span></p>
            </div>

            {/* Ref */}
            <div className="mb-4">
              <p><strong>Ref:</strong> <span className="bg-yellow-200/50 px-1">{proposalData.object || '[incluir objeto da proposta]'}</span></p>
              <p><strong>Cód.:</strong> <span className="bg-yellow-200/50 px-1">[código proposta]</span></p>
            </div>

            <p className="mb-4">Prezado Sr.</p>

            <p className="text-justify mb-4">
              É com grande honra que <strong>SALOMÃO ADVOGADOS</strong>, neste ato representado, respectivamente, por seus sócios
              <span className="bg-yellow-200/50 px-1 font-bold ml-1">{proposalData.partner_name || '[incluir nome do sócio]'}</span>,
              brasileiro, casado, advogado... vem formular a presente proposta de honorários...
            </p>

            {/* 1. Objeto */}
            <p className="font-bold mb-2">1. OBJETO E ESCOPO DO SERVIÇO:</p>
            <p className="text-justify mb-4">
              1.1. O objeto da presente proposta é a assessoria jurídica... em favor do Cliente
              <span className="bg-yellow-200/50 px-1 uppercase mx-1">{proposalData.clientName || '[NOME DA EMPRESA CLIENTE]'}</span>
              no <span className="bg-yellow-200/50 px-1">[incluir objeto da disputa]</span>.
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

            {/* Final Success Fixed (Starts after Intermediate) */}
            {proposalData.success_fee_fixed.map((clause, idx) => {
              const base = 2 + proposalData.pro_labore_clauses.length + proposalData.intermediate_fee_clauses.length;
              const num = `2.${base + idx}`;
              if (!clause.value && idx === 0 && proposalData.success_fee_fixed.length === 1) return null;
              return (
                <p key={`sf-fix-${idx}`} className="text-justify mb-2">
                  {num}. Honorários finais de êxito de <span className="bg-yellow-200/50 px-1">{clause.value || '[valor]'}</span> {clause.description}
                </p>
              );
            })}

            {/* Final Success Percent (Starts after Fixed Success) */}
            {proposalData.success_fee_percent.map((clause, idx) => {
              const base = 2 + proposalData.pro_labore_clauses.length + proposalData.intermediate_fee_clauses.length + proposalData.success_fee_fixed.length;
              const num = `2.${base + idx}`;
              if (!clause.value && idx === 0 && proposalData.success_fee_percent.length === 1) return null;
              return (
                <p key={`sf-perc-${idx}`} className="text-justify mb-2">
                  {num}. Honorários finais de êxito de <span className="bg-yellow-200/50 px-1">{clause.value || '[percentual]'}</span> {clause.description}
                </p>
              );
            })}

            {/* Signatures */}
            <div className="text-center mt-12 space-y-8">
              <div>
                <p className="mb-2">Cordialmente,</p>
                <p className="bg-yellow-200/50 px-1 font-bold inline-block">{proposalData.partner_name || '[Incluir nome do sócio]'}</p>
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
