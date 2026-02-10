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
  Save,
  Users,
  DollarSign,
  FileText,
  Trash2
} from 'lucide-react';
import { SearchableSelect } from '../../../SearchableSelect';
import { useFinanceContasReceber } from '../hooks/useFinanceContasReceber';
import { supabase } from '../../../../lib/supabase';

interface FinanceModalEnviarFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

interface Cliente {
  id: string;
  cnpj: string;
  nome: string;
  email: string;
}

export function FinanceModalEnviarFatura({ isOpen, onClose, userEmail }: FinanceModalEnviarFaturaProps) {
  const [loading, setLoading] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [valor, setValor] = useState('');
  const [remetente, setRemetente] = useState(userEmail);
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const { enviarFatura } = useFinanceContasReceber();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAdicionar, setShowAdicionar] = useState(false);
  const [clienteCNPJ, setClienteCNPJ] = useState('');
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [savingCliente, setSavingCliente] = useState(false);
  const [searchingCNPJ, setSearchingCNPJ] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadClientes();
      setClienteNome('');
      setClienteEmail('');
      setValor('');
      setAssunto('');
      setCorpo('');
      setArquivos([]);
      setShowAdicionar(false);
    }
  }, [isOpen]);

  const loadClientes = async () => {
    const { data } = await supabase
      .from('finance_clientes')
      .select('*')
      .order('nome');
    
    if (data) {
      setClientes(data);
    }
  };

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
    setClienteCNPJ(formatted);

    const cleaned = formatted.replace(/\D/g, '');
    if (cleaned.length === 14) {
      setSearchingCNPJ(true);
      
      try {
        // CORREÇÃO: Usando maybeSingle para evitar erro 406/404 em buscas vazias
        const { data: existing } = await supabase
          .from('finance_clientes')
          .select('*')
          .eq('cnpj', formatted)
          .maybeSingle();

        if (existing) {
          setNovoClienteNome(existing.nome);
          setNovoClienteEmail(existing.email);
          alert('Cliente já cadastrado! Carregando dados...');
        } else {
          const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
          if (response.ok) {
            const empresa = await response.json();
            setNovoClienteNome(empresa.razao_social || empresa.nome_fantasia || '');
            setNovoClienteEmail(''); 
          }
        }
      } catch (error) {
        console.error('Erro ao buscar CNPJ:', error);
      } finally {
        setSearchingCNPJ(false);
      }
    }
  };

  const handleSaveCliente = async () => {
    if (!clienteCNPJ || !novoClienteNome || !novoClienteEmail) {
      alert('Preencha todos os campos do cliente');
      return;
    }

    setSavingCliente(true);

    try {
      const { data, error } = await supabase
        .from('finance_clientes')
        .upsert({
          cnpj: clienteCNPJ,
          nome: novoClienteNome,
          email: novoClienteEmail
        }, {
          onConflict: 'cnpj'
        })
        .select()
        .single();

      if (error) throw error;

      await loadClientes();
      
      // Sincroniza estados globais do modal com o novo cliente
      setClienteNome(data.nome);
      setClienteEmail(data.email);
      
      setClienteCNPJ('');
      setNovoClienteNome('');
      setNovoClienteEmail('');
      setShowAdicionar(false);
      
      alert('Cliente salvo com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar cliente: ' + error.message);
    } finally {
      setSavingCliente(false);
    }
  };

  const handleClienteChange = (nome: string) => {
    setClienteNome(nome);
    const cliente = clientes.find(c => c.nome === nome);
    if (cliente) {
      setClienteEmail(cliente.email);
    }
  };

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

  const removeArquivo = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDAÇÃO: Garante que o nome não seja nulo para evitar erro 23502 no Postgres
    if (!clienteNome || clienteNome.trim() === '') {
      alert('Por favor, selecione um cliente na lista ou realize o cadastro de um novo antes de enviar.');
      return;
    }

    if (!clienteEmail) {
      alert('Por favor, preencha o e-mail do cliente.');
      return;
    }

    if (arquivos.length === 0) {
      const confirmSend = confirm("Nenhum arquivo PDF anexado. Deseja enviar a fatura assim mesmo?");
      if (!confirmSend) return;
    }

    setLoading(true);
    try {
      const valorLimpo = typeof valor === 'string' 
        ? parseFloat(valor.replace(/\./g, '').replace(',', '.')) 
        : valor;

      await enviarFatura({
        cliente_nome: clienteNome,
        cliente_email: clienteEmail,
        valor: valorLimpo,
        remetente,
        assunto,
        corpo,
        arquivos: arquivos.length > 0 ? arquivos : undefined
      });
      
      alert("✅ Fatura enviada com sucesso! O acompanhamento de 2d + 2d foi iniciado.");
      
      setClienteNome('');
      setClienteEmail('');
      setValor('');
      setAssunto('');
      setCorpo('');
      setArquivos([]);
      onClose();
    } catch (error: any) {
      console.error('Erro ao enviar fatura:', error);
      alert("❌ Erro ao processar envio: " + (error.message || "Verifique os dados e tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200 max-h-[90vh]">
        
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
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
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

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1 flex items-center justify-between">
              Selecionar Cliente
              <button
                type="button"
                onClick={() => setShowAdicionar(!showAdicionar)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  showAdicionar 
                    ? 'bg-[#1e3a8a] text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </label>
            <SearchableSelect
              value={clienteNome}
              onChange={handleClienteChange}
              placeholder="Pesquisar cliente..."
              table="finance_clientes" 
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

          {showAdicionar && (
            <div className="bg-blue-50 border-2 border-[#1e3a8a] rounded-xl p-5 space-y-4 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-[#1e3a8a]" />
                <h4 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">
                  Cadastro de Cliente
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                    CNPJ *
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={clienteCNPJ}
                      onChange={(e) => handleCNPJChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                    />
                    {searchingCNPJ && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#1e3a8a]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                    Nome/Razão Social *
                  </label>
                  <input 
                    type="text"
                    value={novoClienteNome}
                    onChange={(e) => setNovoClienteNome(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                    E-mail *
                  </label>
                  <input 
                    type="email"
                    value={novoClienteEmail}
                    onChange={(e) => setNovoClienteEmail(e.target.value)}
                    placeholder="cliente@empresa.com.br"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setClienteCNPJ('');
                    setNovoClienteNome('');
                    setNovoClienteEmail('');
                  }}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCliente}
                  disabled={savingCliente || !clienteCNPJ || !novoClienteNome || !novoClienteEmail}
                  className="flex items-center gap-2 px-5 py-2 bg-[#1e3a8a] text-white rounded-lg font-black text-[10px] uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCliente ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Salvar Cliente
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">Valor da Fatura (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>
          </div>

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

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#0a192f] uppercase tracking-wider ml-1">Anexos (PDF)</label>
            
            {arquivos.length > 0 && (
              <div className="space-y-2 mb-3">
                {arquivos.map((arquivo, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-3 group hover:bg-blue-100 transition-all">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-[#1e3a8a] shrink-0" />
                      <span className="text-sm font-bold text-[#0a192f] truncate" title={arquivo.name}>
                        {arquivo.name}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        ({(arquivo.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeArquivo(index)}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
              <span className="text-xs font-bold text-gray-500">
                {arquivos.length > 0 ? `Clique para adicionar mais arquivos` : 'Clique para selecionar a fatura ou arraste aqui'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <Info className="h-5 w-5 text-[#1e3a8a] shrink-0" />
            <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
              Ao enviar, o sistema aguardará <strong>2 dias úteis</strong>. Caso não haja resposta, o item entrará no seu <strong>Radar</strong> por mais <strong>2 dias úteis</strong> antes da notificação de contato direto.
            </p>
          </div>
        </form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !clienteEmail || !assunto || !valor}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar e Iniciar Fluxo
          </button>
        </div>
      </div>
    </div>
  );
}