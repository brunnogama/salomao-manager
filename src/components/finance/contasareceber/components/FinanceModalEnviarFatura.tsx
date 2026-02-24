// src/components/finance/contasareceber/components/FinanceModalEnviarFatura.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mail,
  Paperclip,
  AlertTriangle,
  Send,
  Loader2,
  Info,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { SearchableSelect } from '../../../SearchableSelect';
import { useFinanceContasReceber } from '../hooks/useFinanceContasReceber';
import { supabase } from '../../../../lib/supabase';
import { useEscKey } from '../../../../hooks/useEscKey';

import { Client } from '../../../../types/controladoria';
import { ClientFormModal } from '../../../controladoria/clients/ClientFormModal';
import { SuccessModal } from '../../../controladoria/ui/SuccessModal';

interface FinanceModalEnviarFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function FinanceModalEnviarFatura({ isOpen, onClose, userEmail }: FinanceModalEnviarFaturaProps) {
  const [loading, setLoading] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [valor, setValor] = useState('');
  const [remetente, setRemetente] = useState(userEmail);
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const { enviarFatura } = useFinanceContasReceber();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para adicionar cliente
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientes, setClientes] = useState<Client[]>([]);

  // Estado Modal Sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Estado Modal Aviso Sem Arquivo
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClientes();
    }
  }, [isOpen]);

  // Handle ESC key
  useEscKey(isOpen, () => {
    if (!showClientModal && !showSuccessModal) {
      onClose();
    }
  });

  const loadClientes = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (data) {
      setClientes(data);
    }
  };

  const handleClienteChange = (valor: string) => {
    // 1. Tentar encontrar por ID (comportamento do SearchableSelect ao clicar)
    const clientePorId = clientes.find(c => c.id?.toString() === valor);

    if (clientePorId) {
      setClienteNome(clientePorId.name); // Garante que o estado tenha o NOME, não o UUID
      setClienteEmail(clientePorId.email || '');
      setClienteId(clientePorId.id);
      return;
    }

    // 2. Fallback: Tentar encontrar por Nome (caso venha texto ou limpeza)
    setClienteNome(valor);
    const termoBusca = valor.trim().toLowerCase();
    const clientePorNome = clientes.find(c => c.name.trim().toLowerCase() === termoBusca);

    if (clientePorNome) {
      setClienteEmail(clientePorNome.email || '');
      setClienteId(clientePorNome.id);
    } else {
      setClienteId(undefined);
    }
  };

  const handleClientSaved = (savedClient?: Client) => {
    loadClientes();
    if (savedClient) {
      setClienteNome(savedClient.name);
      setClienteEmail(savedClient.email || '');
      setClienteId(savedClient.id);
    }
    setShowClientModal(false);
  };

  if (!isOpen) return null;

  const isExternalDomain = (email: string) => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1].toLowerCase();
    const orgDomain = "salomao.com";
    return domain !== orgDomain;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Append files instead of replacing
      setArquivos(prev => [...prev, ...Array.from(e.target.files || [])]);
      // Reset input value to allow selecting the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeArquivo = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (arquivos.length === 0) {
      setShowWarningModal(true);
      return;
    }

    proceedWithSubmit();
  };

  const proceedWithSubmit = async () => {
    if (!clienteId) {
      alert("Por favor, selecione um cliente válido da lista. Se for um novo cliente, cadastre-o primeiro.");
      return;
    }

    setLoading(true);
    try {
      await enviarFatura({
        cliente_nome: clienteNome,
        cliente_email: clienteEmail,
        cliente_id: clienteId,
        valor: parseFloat(valor),
        remetente,
        assunto,
        corpo,
        arquivos
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      alert("Erro ao processar envio: " + error.message);
      setLoading(false); // Only set loading false on error, keep true on success until reload/close
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
    window.location.reload();
  };

  return (
    // Lowered z-index to 50 to allow ClientFormModal (z-60) to appear on top
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">

        {/* HEADER */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1e3a8a] rounded-lg">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-[#0a192f] text-lg uppercase tracking-tight">Enviar Fatura</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Início do Fluxo de Recebimento</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">

          {/* REMETENTE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">Remetente (Cópia Automática)</label>
            <input
              type="email"
              value={remetente}
              onChange={(e) => setRemetente(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-gray-600"
              required
            />
          </div>

          {/* SELECIONAR CLIENTE COM BOTÃO ADICIONAR */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1 flex items-center justify-between">
              Selecionar Cliente
              <button
                type="button"
                onClick={() => setShowClientModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </label>
            <SearchableSelect
              value={clienteNome}
              onChange={handleClienteChange}
              placeholder="Pesquisar cliente..."
              options={clientes}
              nameField="name"
              className="w-full"
            />

          </div>

          {/* E-MAIL CLIENTE E VALOR - LADO A LADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* E-MAIL DO CLIENTE */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">E-mail Cliente</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* VALOR DA FATURA */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">Valor da Fatura (R$)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black">
                  R$
                </div>
                <NumericFormat
                  value={valor}
                  onValueChange={(values) => setValor(values.value)}
                  placeholder="0,00"
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* ASSUNTO */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">Assunto</label>
            <input
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Fatura de Honorários - Ref. Mes/Ano"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
              required
            />
          </div>

          {/* CORPO DO E-MAIL */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">Corpo do E-mail</label>
            <textarea
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium resize-none"
              placeholder="Escreva a mensagem padrão para o cliente..."
            />
          </div>

          {/* ANEXOS */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider">Anexos (PDF)</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] flex items-center gap-1 font-bold text-[#1e3a8a] hover:underline uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-lg"
              >
                <Plus className="h-3 w-3" /> Adicionar Arquivo
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl bg-gray-50 min-h-[80px] p-3 flex flex-col gap-2">
              {arquivos.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-full flex flex-col items-center justify-center py-6 text-gray-400 cursor-pointer hover:bg-gray-100 rounded-lg transition-all border-2 border-dashed border-gray-200 hover:border-[#1e3a8a]"
                >
                  <Paperclip className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Nenhum arquivo selecionado</span>
                  <span className="text-[10px] opacity-70">Clique ou arraste para adicionar</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {arquivos.map((arq, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <FileText className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 truncate">{arq.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArquivo(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remover anexo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 text-center border-2 border-dashed border-gray-200 rounded-lg text-xs font-bold text-gray-400 hover:text-[#1e3a8a] hover:border-[#1e3a8a] hover:bg-white transition-all uppercase tracking-wider"
                  >
                    + Adicionar Outro Arquivo
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="application/pdf,.pdf"
            />
          </div>

          {/* INFO BOX FLUXO */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <Info className="h-5 w-5 text-[#1e3a8a] shrink-0" />
            <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
              Ao enviar, o sistema aguardará <strong>2 dias úteis</strong>. Caso não haja resposta, o item entrará no seu <strong>Radar</strong> por mais <strong>2 dias úteis</strong> antes da notificação de contato direto.
            </p>
          </div>
        </form>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !clienteEmail || !assunto || !valor}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar e Iniciar Fluxo
          </button>
        </div>
      </div>

      {/* Integration of ClientFormModal */}
      {showClientModal && (
        <ClientFormModal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          onSave={handleClientSaved}
        />
      )}

      {/* SUCCESS MODAL */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Fatura Enviada!"
        description="A fatura foi enviada com sucesso e o fluxo de acompanhamento automático (2d + 2d) foi iniciado."
        confirmText="OK, Entendi"
      />

      {/* WARNING NO-FILE MODAL */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200 text-center p-8">
            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>

            <h3 className="text-xl font-black text-[#0a192f] mb-3">
              Nenhum anexo encontrado
            </h3>

            <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
              Você não selecionou nenhum arquivo PDF para enviar junto com a fatura. Deseja continuar o envio assim mesmo?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="w-full px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all"
              >
                Voltar e Anexar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWarningModal(false);
                  proceedWithSubmit();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-center flex items-center justify-center"
              >
                Enviar sem Anexo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}