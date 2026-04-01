import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { Filter, CheckCircle2, XCircle, Clock, FileText, Download, Loader2, ArrowRight, Trash2, Pencil, Save, FileDown, ArrowUpCircle, Calendar, User, RefreshCw, Plus, Share2 } from 'lucide-react';
import PublicReembolso from '../../../pages/PublicReembolso';
import { format } from 'date-fns';
import { AlertModal } from '../../../components/ui/AlertModal';
import { exportToStandardXLSX } from '../../../utils/exportUtils';
import { FilterBar, FilterCategory } from '../../collaborators/components/FilterBar';

interface Reembolso {
  id: string;
  reembolsavel_cliente: boolean;
  recibo_url: string;
  numero_recibo: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  data_despesa: string;
  valor: number;
  descricao: string;
  status: string;
  comprovante_pagamento_url: string | null;
  created_at: string;
  collaborators: { name: string };
  colaborador_id?: string;
  autorizador_id?: string;
  cliente_nome?: string;
  observacao?: string;
}

export function ReembolsosTab() {
  const [reembolsos, setReembolsos] = useState<Reembolso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedReembolso, setSelectedReembolso] = useState<Reembolso | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  // Edit / Delete State
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Reembolso>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [reembolsoToDelete, setReembolsoToDelete] = useState<Reembolso | null>(null);
  const [isExtractingIA, setIsExtractingIA] = useState(false);

  // Modal Add Reembolso Manual
  const [isAddReembolsoModalOpen, setIsAddReembolsoModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddReembolsoModalOpen) {
        setIsAddReembolsoModalOpen(false);
      }
    };
    if (isAddReembolsoModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddReembolsoModalOpen]);


  const handleExportXLSX = () => {
    const dataToExport = filtered.map(r => ({
      'Data da Despesa': r.data_despesa ? format(new Date(r.data_despesa), 'dd/MM/yyyy') : '',
      'Integrante': r.collaborators?.name || '',
      'Descrição': r.descricao || '',
      'Solicitado em': r.created_at ? format(new Date(r.created_at), 'dd/MM/yyyy HH:mm') : '',
      'Status': r.status === 'pago' ? 'Pago' : 'Pendente',
      'Fornecedor': r.fornecedor_nome || '',
      'CNPJ': r.fornecedor_cnpj || '',
      'Número Recibo': r.numero_recibo || '',
      'Cobrar Cliente?': r.reembolsavel_cliente ? 'Sim' : 'Não',
      'Nome do Cliente': r.cliente_nome || '',
      'Valor (R$)': r.valor || 0,
    }));
    exportToStandardXLSX(
      [{ sheetName: "Reembolsos", data: dataToExport, colWidths: [15, 30, 35, 15, 15, 30, 20, 20, 20, 25, 15] }],
      `Reembolsos_${format(new Date(), 'dd-MM-yyyy')}.xlsx`
    );
  };

  const handleDelete = async () => {
    if (!reembolsoToDelete) return;
    try {
      const { error } = await supabase.from('reembolsos').delete().eq('id', reembolsoToDelete.id);
      if (error) throw error;
      await fetchReembolsos();
      setReembolsoToDelete(null);
      if (selectedReembolso?.id === reembolsoToDelete.id) {
        handleCloseModal();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir solicitação.');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedReembolso) return;
    setSavingEdit(true);
    try {
      const updates = { ...editedData };
      // Remove nested join data before sending to Supabase
      delete (updates as any).collaborators;
      
      if (updates.status === 'pendente') {
         updates.comprovante_pagamento_url = null;
      }
      const { error } = await supabase.from('reembolsos').update(updates).eq('id', selectedReembolso.id);
      if (error) throw error;
      await fetchReembolsos();
      setSelectedReembolso(prev => prev ? { ...prev, ...updates } : null);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar edições.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExtractIA = async () => {
    if (!selectedReembolso?.recibo_url) return;
    setIsExtractingIA(true);
    try {
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_REEMBOLSO_EXTRACT || 'https://hook.us2.make.com/8e7s11ns13rgpffbtyduy5kt93zzrf53';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_url: (selectedReembolso.recibo_url || '').toLowerCase().includes('.pdf') 
            ? selectedReembolso.recibo_url.replace(/\.pdf(?:\?.*)?$/i, '_thumb.jpg')
            : selectedReembolso.recibo_url,
          colaborador_id: selectedReembolso.collaborators?.name 
        })
      });
      
      if (response.ok) {
        let makeData: any = {};
        try {
          const rawText = await response.text();
          makeData = JSON.parse(rawText);
        } catch(e) {
          console.warn("Webhook do Make retornou dados ou array inválido", e);
        }

        const dataArray = Array.isArray(makeData) ? makeData : [makeData];
        const item = dataArray[0];

        if (item) {
          setEditedData(prev => ({
            ...prev,
            fornecedor_nome: item.fornecedor_nome || prev.fornecedor_nome,
            fornecedor_cnpj: item.fornecedor_cnpj || prev.fornecedor_cnpj,
            data_despesa: item.data_despesa || prev.data_despesa,
            valor: parseFloat(item.valor) || prev.valor,
            descricao: item.descricao || prev.descricao,
            numero_recibo: item.numero_recibo || prev.numero_recibo,
          }));

          if (dataArray.length > 1) {
             const qtdeAmais = dataArray.length - 1;
             alert(`A IA encontrou ${dataArray.length} recibos neste documento!\n\nA tela atual foi preenchida com o primeiro recibo (R$ ${item.valor || 0}).\n\nO sistema irá criar automaticamente ${qtdeAmais} nova(s) despesa(s) "${selectedReembolso.autorizador_id ? 'Aguardando Liderança' : 'Pendente'}" para o(s) recibo(s) restante(s). Ao finalizar a edição desta tela, atualize a página.`);

             const newRows = [];
             for (let i = 1; i < dataArray.length; i++) {
                const extraItem = dataArray[i];
                newRows.push({
                   colaborador_id: selectedReembolso.colaborador_id,
                   autorizador_id: selectedReembolso.autorizador_id,
                   reembolsavel_cliente: selectedReembolso.reembolsavel_cliente,
                   cliente_nome: selectedReembolso.cliente_nome,
                   observacao: selectedReembolso.observacao,
                   recibo_url: selectedReembolso.recibo_url,
                   status: selectedReembolso.autorizador_id ? 'pendente_autorizacao' : 'pendente',
                   numero_recibo: extraItem.numero_recibo || '',
                   fornecedor_nome: extraItem.fornecedor_nome || '',
                   fornecedor_cnpj: extraItem.fornecedor_cnpj || '',
                   data_despesa: extraItem.data_despesa || null,
                   valor: parseFloat(extraItem.valor?.toString().replace(',', '.')) || 0,
                   descricao: extraItem.descricao || '',
                });
             }

             supabase.from('reembolsos').insert(newRows).then(({ error }) => {
                if (error) console.error("Erro ao inserir despesas extras da IA:", error);
                else fetchReembolsos();
             });
          }
        }
      } else {
         alert("Erro no serviço da IA. Status: " + response.status);
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro de conexão ao processar IA: ' + err.message);
    } finally {
      setIsExtractingIA(false);
    }
  };

  useEffect(() => {
    fetchReembolsos();
  }, []);

  const fetchReembolsos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reembolsos')
        .select(`
          *,
          collaborators:colaborador_id (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReembolsos(data);
    } catch (err) {
      console.error('Erro ao buscar reembolsos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (r: Reembolso) => {
    setSelectedReembolso(r);
    setPaymentFile(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReembolso(null);
    setIsEditing(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handlePayment = async () => {
    if (!selectedReembolso) return;
    
    setProcessingPayment(true);
    try {
      let comprovanteUrl = null;

      if (paymentFile) {
        const fileExt = paymentFile.name.split('.').pop();
        const fileName = `${selectedReembolso.id}_pagamento.${fileExt}`;
        const filePath = `comprovantes/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('gastos_reembolsos')
          .upload(filePath, paymentFile);

        if (!uploadError) {
          const { data } = supabase.storage.from('gastos_reembolsos').getPublicUrl(filePath);
          comprovanteUrl = data.publicUrl;
        } else {
          console.error("Erro upload:", uploadError);
          // continua sem anexo se falhou apenas para teste, ou pode bloquear
        }
      }

      // Update Database
      const { error } = await supabase
        .from('reembolsos')
        .update({
          status: 'pago',
          comprovante_pagamento_url: comprovanteUrl,
          reembolsavel_cliente: selectedReembolso.reembolsavel_cliente // Salva a escolha atualizada pelo financeiro se mudaram
        })
        .eq('id', selectedReembolso.id);

      if (error) throw error;

      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_REEMBOLSO_PAGO || 'https://hook.us2.make.com/ek933ugsc18euo3uwv9eha6mgk8ngvws';
      console.log("🚀 Disparando notificação de pagamento para:", webhookUrl);
      if(webhookUrl && webhookUrl !== 'SUA_URL_AQUI') {
         fetch(webhookUrl, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             evento: "pagamento_realizado",
             reembolso: {
               id: selectedReembolso.id, 
               valor: selectedReembolso.valor ? selectedReembolso.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00',
               descricao: selectedReembolso.descricao || '',
               fornecedor: selectedReembolso.fornecedor_nome || '',
               comprovante_url: comprovanteUrl || ''
             },
             solicitante: {
               nome: selectedReembolso.collaborators?.name || '',
               email: (selectedReembolso.collaborators as any)?.email || ''
             }
           })
         })
         .then(res => console.log("✅ Webhook respondido com status:", res.status))
         .catch(e => console.error("❌ Erro chamando webhook", e)); // Fogo e esquece
      }

      await fetchReembolsos();
      handleCloseModal();
      
    } catch (err) {
      console.error(err);
      alert('Erro ao processar pagamento.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Filters State
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSolicitante, setFilterSolicitante] = useState<string[]>([]);
  const [filterPeriodo, setFilterPeriodo] = useState<{start: string, end: string}>({ start: '', end: '' });

  const solicitanteOptions = React.useMemo(() => {
    const names = Array.from(new Set(reembolsos.map(r => r.collaborators?.name).filter(Boolean)));
    return names.map(n => ({ label: n, value: n })).sort((a, b) => a.label.localeCompare(b.label));
  }, [reembolsos]);

  const categories: FilterCategory[] = React.useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      icon: Filter,
      type: 'multi',
      options: [
        { label: 'Pendente', value: 'pendente' },
        { label: 'Pago', value: 'pago' },
        { label: 'Aguardando Liderança', value: 'pendente_autorizacao' },
        { label: 'Rejeitado', value: 'rejeitado' }
      ],
      value: filterStatus,
      onChange: setFilterStatus,
    },
    {
      key: 'solicitante',
      label: 'Solicitante',
      icon: User,
      type: 'multi',
      options: solicitanteOptions,
      value: filterSolicitante,
      onChange: setFilterSolicitante,
    },
    {
      key: 'periodo',
      label: 'Período',
      icon: Calendar,
      type: 'date_range',
      value: filterPeriodo,
      onChange: setFilterPeriodo,
    }
  ], [filterStatus, filterSolicitante, filterPeriodo, solicitanteOptions]);

  const activeFilterChips = React.useMemo(() => {
    const chips: any[] = [];
    if (filterStatus.length) chips.push({ key: 'status', label: `${filterStatus.length} status`, onClear: () => setFilterStatus([]) });
    if (filterSolicitante.length) chips.push({ key: 'solicitante', label: `${filterSolicitante.length} solicitantes`, onClear: () => setFilterSolicitante([]) });
    if (filterPeriodo.start || filterPeriodo.end) {
      const formatFilterDate = (dStr: string) => dStr ? dStr.split('-').reverse().join('/') : '';
      let label = '';
      if (filterPeriodo.start && filterPeriodo.end) {
        label = `${formatFilterDate(filterPeriodo.start)} - ${formatFilterDate(filterPeriodo.end)}`;
      } else if (filterPeriodo.start) {
        label = `A partir de ${formatFilterDate(filterPeriodo.start)}`;
      } else {
        label = `Até ${formatFilterDate(filterPeriodo.end)}`;
      }
      chips.push({ key: 'periodo', label, onClear: () => setFilterPeriodo({ start: '', end: '' }) });
    }
    return chips;
  }, [filterStatus, filterSolicitante, filterPeriodo, categories]);

  const handleClearAllFilters = () => {
    setFilterStatus([]);
    setFilterSolicitante([]);
    setFilterPeriodo({ start: '', end: '' });
    setSearchTerm('');
  };

  const filtered = reembolsos.filter(r => {
    const text = searchTerm.toLowerCase();
    const matchSearch = searchTerm === '' || 
      r.collaborators?.name?.toLowerCase().includes(text) || 
      r.fornecedor_nome?.toLowerCase().includes(text) ||
      r.descricao?.toLowerCase().includes(text);

    if (!matchSearch) return false;

    // Se nenum filtro de status estiver ativo, ocultamos os que não interessam pro financeiro
    if (filterStatus.length === 0) {
      if (r.status === 'pendente_autorizacao' || r.status === 'rejeitado') return false;
    } else {
      if (r.status && !filterStatus.includes(r.status)) return false;
    }
    if (filterSolicitante.length && (!r.collaborators?.name || !filterSolicitante.includes(r.collaborators.name))) return false;

    if ((filterPeriodo.start || filterPeriodo.end) && r.data_despesa) {
       const dateStr = r.data_despesa.split('T')[0];
       if (filterPeriodo.start && dateStr < filterPeriodo.start) return false;
       if (filterPeriodo.end && dateStr > filterPeriodo.end) return false;
    }

    return true;
  });

  const pendentesCount = filtered.filter(r => r.status === 'pendente').length;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative sm:px-6 sm:py-6 sm:mx-0 -mx-4 px-4 py-4 min-h-screen">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <ArrowUpCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Contas a Pagar
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão de saídas, fornecedores e reembolsos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const mailtoUrl = `mailto:?subject=${encodeURIComponent('Solicitação de Reembolso - Salomão Manager')}&body=${encodeURIComponent(`Olá,\n\nPara solicitar o seu reembolso financeiro, acesse o canal oficial do nosso sistema abaixo e preencha as informações necessárias (anexe a cópia do comprovante):\n\n${window.location.origin}/reembolsos`)}`;
                window.location.href = mailtoUrl;
              }}
              title="Compartilhar Link (E-mail)"
              className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 rounded-full transition-all shadow-sm shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.location.reload()}
              title="Sincronizar Dados"
              className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 hover:text-[#1e3a8a] border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 rounded-full transition-all shadow-sm shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button 
              onClick={handleExportXLSX}
              title="Exportar Planilha"
              className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
            >
              <FileDown className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setIsAddReembolsoModalOpen(true)}
              title="Nova Solicitação de Reembolso Manual"
              className="flex items-center justify-center w-10 h-10 bg-[#1e3a8a] text-white rounded-full hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/30 shrink-0"
            >
              <Plus className="h-5 w-5" />
            </button>
        </div>
      </div>

      <div className="w-full space-y-4 sm:space-y-6 flex-1 animate-in fade-in zoom-in-[0.98] duration-300">
        <div className="flex flex-col lg:flex-row items-stretch gap-4">
          {/* KPI Card */}
          <div className="shrink-0 bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5 flex items-center justify-center lg:justify-start gap-3">
             <div className="p-3 bg-amber-50 rounded-lg">
               <Clock className="w-6 h-6 text-amber-600" />
             </div>
             <div>
               <div className="text-2xl font-black text-amber-900 leading-none">{pendentesCount}</div>
               <div className="text-[10px] font-bold text-amber-700/70 uppercase tracking-widest mt-1">Não Pagos</div>
             </div>
          </div>

          {/* Filter Bar */}
          <div className="flex-1">
            <FilterBar 
               searchTerm={searchTerm}
               onSearchChange={setSearchTerm}
               categories={categories}
               activeFilterChips={activeFilterChips}
               activeFilterCount={filterStatus.length + filterSolicitante.length + (filterPeriodo.start || filterPeriodo.end ? 1 : 0)}
               onClearAll={handleClearAllFilters}
            />
          </div>
        </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 flex justify-center border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-12 flex flex-col items-center justify-center text-center">
             <div className="p-4 rounded-full bg-gray-50 mb-4">
               <FileText className="h-12 w-12 text-gray-400" />
             </div>
             <h2 className="text-xl font-black text-[#0a192f]">Nenhum Reembolso</h2>
             <p className="text-gray-500 max-w-sm mt-2">
               Não encontramos nenhum pedido de reembolso no momento.
             </p>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] sticky top-0 z-10">
                <tr>
                  <th className="p-4 pl-6 text-[10px] font-black uppercase text-white tracking-widest">Data da Despesa</th>
                  <th className="p-4 text-[10px] font-black uppercase text-white tracking-widest">Integrante</th>
                  <th className="p-4 text-[10px] font-black uppercase text-white tracking-widest">Descrição</th>
                  <th className="p-4 text-[10px] font-black uppercase text-white tracking-widest">Solicitado em</th>
                  <th className="p-4 text-[10px] font-black uppercase text-white tracking-widest">Cobrar Cliente?</th>
                  <th className="p-4 text-[10px] font-black uppercase text-white tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase text-white tracking-widest">Valor</th>
                  <th className="p-4 pr-6 text-[10px] font-black uppercase text-white tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => (
                  <tr 
                    key={r.id} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenModal(r)}
                  >
                    <td className="p-4 pl-6 text-sm font-bold text-[#1e3a8a]">
                      {r.data_despesa ? format(new Date(r.data_despesa), 'dd/MM/yyyy') : '--'}
                    </td>
                    <td className="p-4 font-medium text-[#112240]">{r.collaborators?.name || 'Sistema'}</td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={r.descricao}>
                      {r.descricao || 'Sem descrição'}
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-500">
                      {r.created_at ? format(new Date(r.created_at), 'dd/MM/yyyy') : '--'}
                    </td>
                    <td className="p-4">
                      {r.reembolsavel_cliente ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                          Não
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {r.status === 'pendente' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                      {r.status === 'pago' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200/50 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                        </span>
                      )}
                      {r.status === 'pendente_autorizacao' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50 text-xs font-bold">
                          <User className="w-3.5 h-3.5" /> Ag. Líder
                        </span>
                      )}
                      {r.status === 'rejeitado' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/50 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Rejeitado
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-[#1e3a8a]">
                      R$ {r.valor ? r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditedData({...r}); setIsEditing(true); handleOpenModal(r); }}
                        className="p-2 bg-gray-50 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all inline-flex shadow-sm border border-gray-100"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Reembolso */}
      {isModalOpen && selectedReembolso && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Visualização do Recibo (Esquerda) */}
            <div className="w-full md:w-1/2 bg-gray-100 border-r border-gray-200 flex flex-col hidden md:flex">
              <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-[#112240] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Recibo Original
                </h3>
                <a 
                  href={selectedReembolso.recibo_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  Abrir <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="flex-1 p-4 flex justify-center overflow-auto items-start">
                {selectedReembolso.recibo_url.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={selectedReembolso.recibo_url} className="w-full h-full min-h-[500px] rounded-xl border border-gray-200" title="PDF" />
                ) : (
                  <img src={selectedReembolso.recibo_url} alt="Recibo" className="max-w-full rounded-xl shadow-sm border border-gray-200" />
                )}
              </div>
            </div>

            {/* Dados e Ações (Direita) */}
            <div className="w-full md:w-1/2 flex flex-col h-[95vh]">
              
              <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-[#112240]">
                    {isEditing ? 'Editar Reembolso' : 'Análise de Reembolso'}
                  </h2>
                  <p className="text-sm text-gray-500">Solicitante: {selectedReembolso.collaborators?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <button 
                        onClick={() => { setEditedData({...selectedReembolso}); setIsEditing(true); }}
                        className="p-2 hover:bg-amber-50 text-gray-500 hover:text-amber-600 rounded-full transition-colors" title="Editar Solicitação"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setReembolsoToDelete(selectedReembolso)}
                        className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors" title="Deletar Solicitação"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest mr-2"
                    >
                      Cancelar Edição
                    </button>
                  )}
                  <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-5 md:p-6 flex-1 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                <div className="md:hidden">
                   <a 
                    href={selectedReembolso.recibo_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full p-4 border border-blue-200 bg-blue-50 rounded-xl text-blue-700 font-bold flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Ver Recibo Anexado
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                  {isEditing && (
                    <div className="col-span-2 p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3 mb-2">
                       <label className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Status do Reembolso</label>
                       <div className="flex bg-white border border-amber-200 rounded-xl overflow-hidden w-full shadow-sm">
                         <button
                           type="button"
                           onClick={() => setEditedData({...editedData, status: 'pendente'})}
                           className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black uppercase tracking-widest transition-all ${
                             (editedData.status || 'pendente') === 'pendente'
                               ? 'bg-amber-100 text-amber-800'
                               : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                           }`}
                         >
                           <Clock className="w-4 h-4" /> Pendente
                         </button>
                         <div className="w-px bg-amber-200" />
                         <button
                           type="button"
                           onClick={() => setEditedData({...editedData, status: 'pago'})}
                           className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black uppercase tracking-widest transition-all ${
                             editedData.status === 'pago'
                               ? 'bg-emerald-100 text-emerald-800'
                               : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                           }`}
                         >
                           <CheckCircle2 className="w-4 h-4" /> Pago
                         </button>
                       </div>
                       {editedData.status === 'pendente' && selectedReembolso.status === 'pago' && (
                         <p className="text-xs text-amber-700 italic mt-1">
                           * Ao voltar para Pendente, o comprovante anexado anteriormente será removido.
                         </p>
                       )}
                    </div>
                  )}

                  {isEditing && (!editedData.valor) && (
                    <div className="col-span-2 p-4 bg-gradient-to-r from-blue-900 to-[#112240] rounded-xl flex items-center justify-between shadow-lg text-white mt-1 border border-blue-800">
                       <div>
                          <h4 className="font-black text-blue-300 flex items-center gap-2">✨ Leitura por IA Disponível</h4>
                          <p className="text-xs text-blue-100/80 mt-1 max-w-sm leading-relaxed">Deixe a Inteligência Artificial extrair todos os dados deste recibo automaticamente e poupe seu trabalho manual.</p>
                       </div>
                       <button
                         type="button"
                         onClick={handleExtractIA}
                         disabled={isExtractingIA}
                         className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold tracking-wide uppercase text-[10px] rounded-lg shadow-inner flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                       >
                         {isExtractingIA ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando...</> : 'Extrair Dados'}
                       </button>
                    </div>
                  )}

                  <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Número</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editedData.numero_recibo || ''} 
                        onChange={(e) => setEditedData({...editedData, numero_recibo: e.target.value})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <div className="font-medium text-gray-800 break-all line-clamp-2">{selectedReembolso.numero_recibo || '--'}</div>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Data</label>
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={editedData.data_despesa || ''} 
                        onChange={(e) => setEditedData({...editedData, data_despesa: e.target.value})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <div className="font-medium text-gray-800">
                        {selectedReembolso.data_despesa ? format(new Date(selectedReembolso.data_despesa), 'dd/MM/yyyy') : '--'}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Fornecedor</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editedData.fornecedor_nome || ''} 
                        onChange={(e) => setEditedData({...editedData, fornecedor_nome: e.target.value})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      />
                    ) : (
                      <div className="font-medium text-gray-800">{selectedReembolso.fornecedor_nome || '--'}</div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">CNPJ Fornecedor</label>
                        <input 
                          type="text" 
                          value={editedData.fornecedor_cnpj || ''} 
                          onChange={(e) => setEditedData({...editedData, fornecedor_cnpj: e.target.value})}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                  )}



                  <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4 text-gray-400" /> Itens Consumidos (Extração IA)</label>
                    {isEditing ? (
                      <textarea 
                        value={editedData.descricao || ''} 
                        onChange={(e) => setEditedData({...editedData, descricao: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm h-24"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReembolso.descricao || 'Nenhuma descrição fornecida.'}</p>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${isEditing ? 'bg-amber-100' : 'bg-[#112240]'} flex justify-between items-center shadow-lg transition-colors`}>
                  <span className={`font-bold ${isEditing ? 'text-amber-900' : 'text-gray-300'}`}>Valor a Reembolsar</span>
                  {isEditing ? (
                    <div className="flex items-center">
                       <span className="text-amber-900 font-bold mr-2">R$</span>
                       <input 
                          type="number" 
                          step="0.01"
                          value={editedData.valor || ''}
                          onChange={(e) => setEditedData({...editedData, valor: parseFloat(e.target.value) || 0})}
                          className="w-32 p-2 bg-white border border-amber-300 rounded-lg text-lg font-black text-amber-900 text-right"
                        />
                    </div>
                  ) : (
                    <span className="text-2xl font-black text-green-400">
                      R$ {selectedReembolso.valor ? selectedReembolso.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </span>
                  )}
                </div>

                {/* Área Financeira Consolidade */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 space-y-5">
                  <h4 className="font-bold text-[#1e3a8a] mb-2 border-b border-blue-100 pb-2">Informações Adicionais e Ação do Financeiro</h4>
                  
                  {/* Observação */}
                  {(selectedReembolso.observacao || editedData.observacao || isEditing) && (
                    <div className="bg-white/80 p-4 rounded-xl border border-blue-200/60 shadow-sm">
                      <label className="text-xs font-bold text-[#1e3a8a] uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Observação do Solicitante</label>
                      {isEditing ? (
                        <textarea 
                          value={editedData.observacao || ''} 
                          onChange={(e) => setEditedData({...editedData, observacao: e.target.value})}
                          className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm h-16"
                          placeholder="Adicionar observação..."
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-800 italic whitespace-pre-wrap">{selectedReembolso.observacao ? `"${selectedReembolso.observacao}"` : 'Sem observação.'}</p>
                      )}
                    </div>
                  )}

                  {/* Checkboxes de Edição ou Visualização do Reembolso */}
                  {isEditing ? (
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="checkbox"
                        id="reembolsar-edit"
                        className="w-5 h-5 rounded text-[#1e3a8a] focus:ring-[#1e3a8a]"
                        checked={editedData.reembolsavel_cliente || false}
                        onChange={(e) => setEditedData({ ...editedData, reembolsavel_cliente: e.target.checked })}
                      />
                      <label htmlFor="reembolsar-edit" className="font-bold text-sm text-[#1e3a8a] cursor-pointer">
                        Despesa Reembolsável pelo Cliente?
                      </label>
                    </div>
                  ) : selectedReembolso.status !== 'pago' ? (
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="checkbox"
                        id="reembolsar-cliente-modal"
                        className="w-5 h-5 rounded text-[#1e3a8a] focus:ring-[#1e3a8a]"
                        checked={selectedReembolso.reembolsavel_cliente}
                        onChange={(e) => setSelectedReembolso({ ...selectedReembolso, reembolsavel_cliente: e.target.checked })}
                      />
                      <label htmlFor="reembolsar-cliente-modal" className="font-bold text-sm text-[#1e3a8a] cursor-pointer">
                        Despesa reembolsável pelo cliente?
                      </label>
                    </div>
                  ) : null}

                  {/* Nome do Cliente */}
                  {(selectedReembolso.reembolsavel_cliente || editedData.reembolsavel_cliente) && (
                    <div className="bg-white/80 p-4 rounded-xl border border-blue-200/60 shadow-sm">
                      <label className="text-xs font-bold text-[#1e3a8a] uppercase tracking-wider mb-1 block">Nome do Cliente a ser Faturado</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editedData.cliente_nome || ''} 
                          onChange={(e) => {
                            const words = e.target.value.toLowerCase().split(' ');
                            const formatted = words.map((word) => {
                              if (['de', 'da', 'do', 'das', 'dos', 'e', 'em'].includes(word)) return word;
                              return word.charAt(0).toUpperCase() + word.slice(1);
                            }).join(' ');
                            setEditedData({...editedData, cliente_nome: formatted})
                          }}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                          placeholder="Digite o nome do cliente"
                        />
                      ) : (
                        <div className="font-black text-[#1e3a8a]">{selectedReembolso.cliente_nome || '--'}</div>
                      )}
                    </div>
                  )}

                  {/* Comprovante */}
                  {(!isEditing && selectedReembolso.status !== 'pago') && (
                    <div className="pt-2 border-t border-blue-100/50">
                      <label className="block text-sm font-bold text-gray-700 mb-2 mt-2">Comprovante de Pagamento do Reembolso (Opcional)</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files && setPaymentFile(e.target.files[0])}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1e3a8a] file:text-white hover:file:bg-[#152e72] cursor-pointer bg-white border border-gray-200 rounded-xl p-1"
                      />
                    </div>
                  )}
                </div>

                {(!isEditing && selectedReembolso.status === 'pago') && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center relative group">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-bold text-green-800">Reembolso Pago</h4>
                    {selectedReembolso.comprovante_pagamento_url && (
                      <a 
                        href={selectedReembolso.comprovante_pagamento_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex mt-3 text-sm font-bold bg-white text-green-700 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
                      >
                        Ver Comprovante
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Botões do Rodapé */}
              {isEditing ? (
                 <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-all flex justify-center items-center"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="flex-[2] py-3.5 bg-amber-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-amber-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                      {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar Alterações</>}
                    </button>
                 </div>
              ) : (
                selectedReembolso.status !== 'pago' && (
                  <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-2">
                    <button
                      onClick={handlePayment}
                      disabled={processingPayment}
                      className="w-full py-4 bg-[#0a192f] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-black transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                      {processingPayment ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : 'Marcar como Pago e Notificar Integrante'}
                    </button>
                  </div>
                )
              )}
            </div>
            
          </div>
        </div>,
        document.body
      )}

      </div>

      {/* Confirmation Modal */}
      <AlertModal
        isOpen={!!reembolsoToDelete}
        onClose={() => setReembolsoToDelete(null)}
        title="Excluir Reembolso"
        description={`Tem certeza que deseja excluir o pedido de reembolso no valor de R$ ${reembolsoToDelete?.valor || 0}? Esta ação não poderá ser desfeita.`}
        variant="error"
        confirmText="Excluir Definitivamente"
        onConfirm={handleDelete}
      />
      {/* Modal Reembolso Manual */}
      {isAddReembolsoModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start sm:items-center justify-center p-4 sm:p-6 transition-all overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div className="w-full relative flex flex-col items-center my-auto animate-in fade-in zoom-in-95 duration-200">
             
             <PublicReembolso 
               isModal={true} 
               onClose={() => { 
                   setIsAddReembolsoModalOpen(false); 
                   fetchReembolsos(); 
                 }} 
               />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
