// src/components/finance/components/FinanceModalCliente.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Building2,
  Mail as MailIcon,
  FileText
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useEscKey } from '../../../../hooks/useEscKey';

interface FinanceModalClienteProps {
  isOpen: boolean;
  onClose: () => void;
  clienteEditando?: {
    id: string;
    cnpj: string;
    nome: string;
    email: string;
  } | null;
}

export function FinanceModalCliente({
  isOpen,
  onClose,
  clienteEditando
}: FinanceModalClienteProps) {
  useEscKey(isOpen, onClose);
  const [loading, setLoading] = useState(false);
  const [searchingCNPJ, setSearchingCNPJ] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (clienteEditando) {
      setCnpj(clienteEditando.cnpj || '');
      setNome(clienteEditando.nome || '');
      setEmail(clienteEditando.email || '');
    } else {
      setCnpj('');
      setNome('');
      setEmail('');
    }
  }, [clienteEditando, isOpen]);

  if (!isOpen) return null;

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleCNPJChange = async (value: string) => {
    const formatted = formatCNPJ(value);
    setCnpj(formatted);

    // Busca automática se CNPJ estiver completo
    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length === 14 && !clienteEditando) {
      setSearchingCNPJ(true);

      // Buscar no banco primeiro
      const { data: existing } = await supabase
        .from('finance_clientes')
        .select('*')
        .eq('cnpj', formatted)
        .single();

      if (existing) {
        setNome(existing.nome);
        setEmail(existing.email);
        alert('Cliente já cadastrado! Carregando dados...');
      } else {
        // Buscar em API externa
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
          if (response.ok) {
            const empresa = await response.json();
            setNome(empresa.razao_social || empresa.nome_fantasia || '');
          }
        } catch (error) {
          console.error('Erro ao buscar CNPJ:', error);
        }
      }

      setSearchingCNPJ(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !email) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      if (clienteEditando) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('finance_clientes')
          .update({
            cnpj: cnpj || null,
            nome,
            email
          })
          .eq('id', clienteEditando.id);

        if (error) throw error;
        alert('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('finance_clientes')
          .insert({
            cnpj: cnpj || null,
            nome,
            email
          });

        if (error) throw error;
        alert('Cliente cadastrado com sucesso!');
      }

      onClose();
    } catch (error: any) {
      alert('Erro ao salvar cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">

        {/* HEADER */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg uppercase tracking-tight">
                {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                Cadastro Financeiro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* CNPJ */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1 flex items-center justify-between">
              CNPJ (Opcional)
              {searchingCNPJ && (
                <span className="flex items-center gap-1.5 text-[#1e3a8a] text-[9px]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando...
                </span>
              )}
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={cnpj}
                onChange={(e) => handleCNPJChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
              />
            </div>
            <p className="text-[9px] text-gray-400 ml-1 italic">
              Ao digitar o CNPJ completo, os dados serão preenchidos automaticamente
            </p>
          </div>

          {/* NOME */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
              Nome / Razão Social *
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do cliente ou empresa"
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* E-MAIL */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
              E-mail *
            </label>
            <div className="relative">
              <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@empresa.com.br"
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
              />
            </div>
            <p className="text-[9px] text-gray-400 ml-1 italic">
              Este e-mail será usado para envio de faturas
            </p>
          </div>

          {/* INFO BOX */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
              <strong>Dica:</strong> Mantenha os dados sempre atualizados para garantir o correto envio de faturas e notificações.
            </p>
          </div>
        </form>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !nome || !email}
            className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {clienteEditando ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}