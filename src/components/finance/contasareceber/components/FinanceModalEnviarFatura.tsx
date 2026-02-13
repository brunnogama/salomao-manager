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
  Plus
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { SearchableSelect } from '../../../SearchableSelect';
import { useFinanceContasReceber } from '../hooks/useFinanceContasReceber';
import { supabase } from '../../../../lib/supabase';

import { Client } from '../../../../types/controladoria';
import { ClientFormModal } from '../../../controladoria/clients/ClientFormModal';

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

  useEffect(() => {
    if (isOpen) {
      loadClientes();
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Only close if ClientFormModal is NOT open
        if (!showClientModal) {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showClientModal]);

  const loadClientes = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (data) {
      setClientes(data);
    }
  };

  const handleClienteChange = (nome: string) => {
    setClienteNome(nome);
    // Buscar email e ID do cliente selecionado (Case insensitive e trim)
    const termoBusca = nome.trim().toLowerCase();
    const cliente = clientes.find(c => c.name.trim().toLowerCase() === termoBusca);

    if (cliente) {
      setClienteEmail(cliente.email || '');
      setClienteId(cliente.id);
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
    if (e.target.files) {
      setArquivos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (arquivos.length === 0) {
      const confirmSend = confirm("Nenhum arquivo PDF anexado. Deseja enviar a fatura assim mesmo?");
      if (!confirmSend) return;
    }

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
      alert("Fatura enviada com sucesso! O acompanhamento de 2d + 2d foi iniciado.");
      onClose();
    } catch (error: any) {
      alert("Erro ao processar envio: " + error.message);
    } finally {
      setLoading(false);
    }
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
            {isExternalDomain(clienteEmail) && (
              <div className="flex items-center gap-2 mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-[11px] text-amber-800 font-bold italic">
                  Domínio externo detectado.
                </p>
              </div>
            )}
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
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">Anexos (PDF)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-[#1e3a8a] cursor-pointer transition-all group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".pdf"
              />
              <Paperclip className="h-6 w-6 text-gray-400 group-hover:text-[#1e3a8a] mb-2" />
              <div className="text-center w-full">
                {arquivos.length > 0 ? (
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-[10px] font-black uppercase text-gray-400 mb-1">{arquivos.length} ARQUIVO(S) SELECIONADO(S)</span>
                    {arquivos.map((arq, idx) => (
                      <span key={idx} className="text-xs font-bold text-[#1e3a8a] break-all">
                        {arq.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-gray-500">
                    Clique para selecionar a fatura ou arraste aqui
                  </span>
                )}
              </div>
            </div>
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
    </div>
  );
}