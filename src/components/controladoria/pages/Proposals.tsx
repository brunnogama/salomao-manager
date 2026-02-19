import React, { useState, useEffect } from 'react';
import {
  FileText,
  Loader2,
  Eye,
  CheckCircle,
  FileSignature,
  Search
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
    pro_labore: '',
    final_success_fee: '',
    intermediate_fees: '' // Comma separated for now in simple form
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
    } else if (['pro_labore', 'final_success_fee'].includes(name)) {
      setProposalData(prev => ({ ...prev, [name]: maskMoney(value) }));
    } else if (name === 'cnpj') {
      setProposalData(prev => ({ ...prev, [name]: maskCNPJ(value) }));
    } else {
      setProposalData(prev => ({ ...prev, [name]: value }));
    }
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
      const newContract: any = {
        client_name: proposalData.clientName,
        cnpj: proposalData.cnpj,
        partner_id: proposalData.partner_id,
        status: 'proposal',
        proposal_date: new Date().toISOString(),
        observations: proposalData.object, // "Ref: [incluir objeto da proposta]"
        pro_labore: proposalData.pro_labore,
        final_success_fee: proposalData.final_success_fee,
        intermediate_fees: proposalData.intermediate_fees ? [proposalData.intermediate_fees] : [],
        has_legal_process: false, // Default
        uf: 'RJ' // Default
      };

      // Clean up undefined/empty
      Object.keys(newContract).forEach(k => !newContract[k] && delete newContract[k]);

      // Check if client exists to link ID
      const { data: existingClient } = await supabase.from('clients').select('id').eq('name', proposalData.clientName).maybeSingle();
      if (existingClient) {
        newContract.client_id = existingClient.id;
      } else if (proposalData.cnpj) {
        // Try by CNPJ
        const { data: clientByCnpj } = await supabase.from('clients').select('id').eq('cnpj', proposalData.cnpj.replace(/\D/g, '')).maybeSingle();
        if (clientByCnpj) newContract.client_id = clientByCnpj.id;
      }

      const { data: insertedContract, error: insertError } = await supabase
        .from('contracts')
        .insert(newContract)
        .select()
        .single();

      if (insertError) throw insertError;

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
        intermediate_fees: proposalData.intermediate_fees ? [proposalData.intermediate_fees] : [],
        final_success_fee: proposalData.final_success_fee,
        pro_labore: proposalData.pro_labore,
        observations: proposalData.object
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
      // Needs to fetch full structure or just pass what we have
      // We pass what we have plus the new document
      setContractFormData({
        ...insertedContract,
        display_id: String(insertedContract.seq_id).padStart(6, '0'),
        partner_name: proposalData.partner_name,
        proposal_code: proposalCode,
        documents: [docData] // Pre-load the document into the modal
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
              // No action button needed for now as requested "abrir o menu" implies just the select behavior
              // If "abrir o menu de Clientes" meant checking details, we can add it later.
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pró-Labore (R$)</label>
                <input
                  type="text"
                  name="pro_labore"
                  value={proposalData.pro_labore}
                  onChange={handleChange}
                  placeholder="R$ 0,00"
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Êxito Final (R$/%)</label>
                <input
                  type="text"
                  name="final_success_fee"
                  value={proposalData.final_success_fee}
                  onChange={handleChange}
                  placeholder="R$ 0,00 ou %"
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-bold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Êxito Intermediário (Opcional)</label>
              <input
                type="text"
                name="intermediate_fees"
                value={proposalData.intermediate_fees}
                onChange={handleChange}
                placeholder="Descreva..."
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:border-[#1e3a8a] outline-none bg-gray-50/50 transition-all"
              />
            </div>
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
              {/* Fallback if image fails in preview */}
              <div className="text-center hidden">
                <h1 className="text-xl font-bold text-[#1e3a8a]">SALOMÃO</h1>
                <p className="text-[8px] tracking-[0.5em] uppercase">Advogados</p>
              </div>
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
            <p className="text-justify mb-2">
              2.2. Honorários pró-labore de <span className="bg-yellow-200/50 px-1">{proposalData.pro_labore || '[incluir valor]'}</span> para engajamento no caso...
            </p>

            <p className="text-justify mb-2">
              2.3. Êxito intermediário de êxito: <span className="bg-yellow-200/50 px-1">{proposalData.intermediate_fees || '[incluir texto]'}</span>
            </p>

            <p className="text-justify mb-8">
              2.4. Honorários finais de êxito de <span className="bg-yellow-200/50 px-1">{proposalData.final_success_fee || '[incluir valor]'}</span>, a serem pagos em 10 (dez) dias...
            </p>

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
