import { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Loader2, FileSearch, Plus, Search, Eye, Trash2, Download, LayoutDashboard, Database, Clock, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import XLSX from 'xlsx-js-style';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { EmptyState } from '../ui/EmptyState';
import { CertificateFormModal } from '../certificates/CertificateFormModal';

export function Compliance() {
  const [locationsList, setLocationsList] = useState<{ name: string, cnpj?: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ged' | string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetching data
  const [certificates, setCertificates] = useState<any[]>([]);
  const [nameDict, setNameDict] = useState<Record<string, string>>({});
  const [agencyDict, setAgencyDict] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);

  useEffect(() => {
    fetchLocations();
    fetchDictionaries();
    fetchCertificates();
  }, []);

  const fetchDictionaries = async () => {
    // Busca dados no formato dicionário para casar IDs com Nomes offline (salva de erros de Foreign Key no SQL)
    const [{ data: names }, { data: agencies }] = await Promise.all([
      supabase.from('certificate_names').select('id, name'),
      supabase.from('certificate_agencies').select('id, name')
    ]);

    if (names) {
      const nd: Record<string, string> = {};
      names.forEach(n => nd[n.id] = n.name);
      setNameDict(nd);
    }
    if (agencies) {
      const ad: Record<string, string> = {};
      agencies.forEach(a => ad[a.id] = a.name);
      setAgencyDict(ad);
    }
  };

  const fetchCertificates = async () => {
    // Retornamos ao select original para não quebrar caso a migração de FK não tenha sido feita no Supabase
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setCertificates(data);
    } else if (error) {
      console.error(error);
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    // Tentamos buscar da nova tabela. Se não existir, voltamos para o fallback dos contratos
    const { data: offices } = await supabase.from('office_locations').select('name, cnpj').eq('active', true).order('name');

    if (offices && offices.length > 0) {
      setLocationsList(offices);
    } else {
      // Fallback para não quebrar a UI antes do usuário rodar o SQL
      const { data: contracts } = await supabase.from('contracts').select('billing_location');
      if (contracts) {
        const unique = Array.from(new Set(contracts.map(c => (c as any).billing_location).filter(Boolean)));
        const sorted = unique.sort() as string[];
        setLocationsList(sorted.map(name => ({ name })));
      }
    }
    setLoading(false);
  };

  // --- Lógica de Dashbord ---
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 7 dias úteis = Aprox 10 dias corridos
    const warningThreshold = new Date();
    warningThreshold.setDate(today.getDate() + 10);

    // Filtrar por local se não estiver no dashboard ou GED
    const relevantCertificates = (activeTab === 'dashboard' || activeTab === 'ged')
      ? certificates
      : certificates.filter(c => c.location === activeTab);

    const active = relevantCertificates.filter(c => {
      if (!c.due_date) return true;
      return new Date(c.due_date) >= today;
    });

    const expired = relevantCertificates.filter(c => {
      if (!c.due_date) return false;
      return new Date(c.due_date) < today;
    });

    const expiringSoon = active.filter(c => {
      if (!c.due_date) return false;
      const dueDate = new Date(c.due_date);
      return dueDate <= warningThreshold;
    });

    const expiringMonth = active.filter(c => {
      if (!c.due_date) return false;
      const dueDate = new Date(c.due_date);
      const thirtyDaysOut = new Date();
      thirtyDaysOut.setDate(today.getDate() + 30);
      return dueDate <= thirtyDaysOut;
    });

    return {
      active: active.length,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      expiringMonthList: expiringMonth.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    };
  }, [certificates, activeTab]);

  const expiringByLocation = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warningThreshold = new Date();
    warningThreshold.setDate(today.getDate() + 10);

    return certificates.reduce((acc, c) => {
      if (!c.due_date || !c.location) return acc;
      const dueDate = new Date(c.due_date);
      if (dueDate >= today && dueDate <= warningThreshold) {
        acc[c.location] = (acc[c.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [certificates]);

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeByLocation = certificates.reduce((acc, c) => {
      if (!c.due_date || new Date(c.due_date) >= today) {
        const loc = c.location || 'Não Informado';
        acc[loc] = (acc[loc] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(activeByLocation).map(([name, value]) => ({ name, value }));
  }, [certificates]);

  // Resolve os nomes reais, misturando as chaves do dicionário com dados antigos
  const getCertName = (c: any) => nameDict[c.name] || c.name || '';
  const getAgencyName = (c: any) => agencyDict[c.agency] || c.agency || '';

  const filteredCertificates = certificates.filter(c =>
    getCertName(c).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getAgencyName(c).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.location?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToExcel = () => {
    // Header e configuração XLSX
    const header = ['Documento', 'CNPJ', 'Data Emissão', 'Data Vencimento', 'Cartório', 'Local'];
    const rows = filteredCertificates.filter(c => activeTab === 'dashboard' || activeTab === 'ged' || c.location === activeTab).map(c => [
      getCertName(c) || '-',
      c.cnpj || '-',
      c.issue_date ? new Date(c.issue_date).toLocaleDateString() : '-',
      c.due_date ? new Date(c.due_date).toLocaleDateString() : '-',
      getAgencyName(c) || '-',
      c.location || '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certidões");

    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `Certidoes_${activeTab === 'dashboard' ? 'Geral' : activeTab}_${dateStr}.xlsx`);
  };

  const handleSaveCertificate = async (data: any) => {
    const toastId = toast.loading('Salvando certidão...');
    try {
      let fileUrl = data.fileUrl;
      let fileName = data.fileName;

      // Upload do arquivo (GED) se existir
      if (data.file) {
        toast.loading('Fazendo upload do arquivo...', { id: toastId });
        // Sanitizar nome do arquivo, removendo espaços e caracteres especiais
        const cleanFileName = data.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `certidoes/${Date.now()}_${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ged-documentos')
          .upload(filePath, data.file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('ged-documentos')
          .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
        fileName = data.file.name;
      }

      // Preparar payload
      const payload = {
        name: data.name,
        cnpj: data.cnpj,
        issue_date: data.issueDate,
        due_date: data.dueDate,
        agency: data.agency,
        location: data.location,
        file_url: fileUrl,
        file_name: fileName,
        status: data.status || 'Válida'
      };

      toast.loading('Salvando registro no banco de dados...', { id: toastId });

      if (data.id) {
        // Atualizar
        const { error } = await supabase.from('certificates').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        // Inserir
        const { error } = await supabase.from('certificates').insert([payload]);
        if (error) throw error;
      }

      toast.success('Certidão salva com sucesso!', { id: toastId });
      setIsModalOpen(false);
      setEditingCertificate(null);
      fetchCertificates();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar certidão: ' + error.message, { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta certidão?')) return;

    const toastId = toast.loading('Excluindo certidão...');
    try {
      const { error } = await supabase.from('certificates').delete().eq('id', id);
      if (error) throw error;

      toast.success('Certidão excluída com sucesso!', { id: toastId });
      fetchCertificates();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao excluir certidão: ' + error.message, { id: toastId });
    }
  };

  const handleEdit = (cert: any) => {
    setEditingCertificate({
      id: cert.id,
      name: cert.name,
      cnpj: cert.cnpj,
      issueDate: cert.issue_date,
      dueDate: cert.due_date,
      agency: cert.agency,
      location: cert.location,
      fileUrl: cert.file_url,
      fileName: cert.file_name,
    } as any);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCertificate(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Compliance</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de Certidões e Conformidade</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4" /> Exportar XLS
          </button>

          {/* Ações */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Nova Certidão
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mb-4" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando locais...</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          {/* Abas de Locais no Estilo do Sistema */}
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2 overflow-hidden">
            <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex-shrink-0 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white shadow-md'
                  : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-[#1e3a8a]'
                  }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              {locationsList.map(loc => {
                const expiringCount = expiringByLocation[loc.name] || 0;
                return (
                  <button
                    key={loc.name}
                    onClick={() => setActiveTab(loc.name)}
                    className={`flex-shrink-0 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-3 ${activeTab === loc.name
                      ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white shadow-md'
                      : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-[#1e3a8a]'
                      }`}
                  >
                    {loc.name}
                    {expiringCount > 0 && (
                      <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black border ${activeTab === loc.name
                        ? 'bg-white text-[#112240] border-transparent'
                        : 'bg-red-500 text-white border-red-600 shadow-sm'
                        }`}>
                        {expiringCount}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => setActiveTab('ged')}
                className={`flex-shrink-0 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeTab === 'ged'
                  ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white shadow-md'
                  : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-[#1e3a8a]'
                  }`}
              >
                <Database className="w-4 h-4" />
                GED
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Distribuição */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[400px]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Ativas por Local</h3>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip
                          cursor={{ fill: '#f9fafb' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#1e3a8a', '#112240', '#3b82f6', '#475569'][index % 4]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela de Próximos Vencimentos */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[400px]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Próximos Vencimentos</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {stats.expiringMonthList.length > 0 ? (
                      stats.expiringMonthList.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-gray-700">{getCertName(c)}</span>
                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{c.location}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-black text-amber-600 block">{new Date(c.due_date).toLocaleDateString()}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Vencimento</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-xs font-medium italic">
                        Nenhuma certidão a vencer nos próximos dias.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ged' && (
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Documento</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">CNPJ Certidão</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Vencimento</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Local</th>
                    <th className="p-4 text-right text-[10px] font-black text-white uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.filter(c => c.file_url).map((c) => {
                    const isExpired = c.due_date && new Date(c.due_date) < new Date();
                    return (
                      <tr key={c.id} className="border-t border-gray-100 text-sm hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0a192f] text-xs">{getCertName(c)}</span>
                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{c.file_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                          {c.cnpj || '-'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-600 text-xs">
                          {c.due_date ? new Date(c.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isExpired
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                            {isExpired ? 'Vencida' : 'Válida'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500">{c.location}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => window.open(c.file_url, '_blank')}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'ged' && (
            <div className="w-full flex flex-col space-y-6">
              {/* Toolbar: Busca e Ações */}
              <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full max-w-md">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar certidão por nome, cartório ou local..."
                    className="w-full bg-transparent border-none text-sm font-medium outline-none text-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {activeTab !== 'dashboard' && activeTab !== 'ged' && locationsList.find(l => l.name === activeTab)?.cnpj && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
                    <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest">
                      CNPJ FILIAL: {locationsList.find(l => l.name === activeTab)?.cnpj}
                    </span>
                  </div>
                )}
              </div>

              {/* Tabela de Certidões */}
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                {filteredCertificates.length === 0 ? (
                  <EmptyState
                    icon={FileSearch}
                    title="Nenhuma certidão encontrada"
                    description={activeTab === 'ged'
                      ? "Não há certidões com arquivos vinculados."
                      : activeTab === 'dashboard'
                        ? "Dados insuficientes para gerar o dashboard."
                        : `Não há certidões cadastradas para o local ${activeTab}.`}
                    actionLabel="Adicionar Certidão"
                    onAction={handleCreateNew}
                  />
                ) : (
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Nome</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">CNPJ Certidão</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Data Emissão</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Data Vencimento</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Cartório</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Local</th>
                        <th className="p-4 sticky right-0 bg-[#112240] text-right text-[10px] font-black text-white uppercase tracking-widest shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCertificates.filter(c => activeTab === 'dashboard' || activeTab === 'ged' || c.location === activeTab).map((c) => (
                        <tr key={c.id} className="border-t border-gray-100 text-sm hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 truncate font-bold text-[#0a192f]">{getCertName(c)}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">{c.cnpj || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {c.issue_date ? new Date(c.issue_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {c.due_date ? new Date(c.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 truncate">{getAgencyName(c)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{c.location}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {c.file_url && (
                                <button
                                  onClick={() => window.open(c.file_url, '_blank')}
                                  className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-500 hover:text-blue-700 transition-all"
                                  title="Visualizar Arquivo (GED)"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(c)}
                                className="p-1.5 hover:bg-yellow-100 rounded-lg text-yellow-500 hover:text-yellow-700 transition-all"
                                title="Editar"
                              >
                                <FileSearch className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-400 hover:text-red-600 transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <CertificateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCertificate}
        locationsList={locationsList.map(l => l.name)}
        initialData={editingCertificate ? {
          id: (editingCertificate as any).id,
          name: (editingCertificate as any).name,
          cnpj: (editingCertificate as any).cnpj || '',
          issueDate: (editingCertificate as any).issue_date,
          dueDate: (editingCertificate as any).due_date,
          agency: (editingCertificate as any).agency,
          location: (editingCertificate as any).location,
          fileUrl: (editingCertificate as any).file_url
        } : undefined}
      />
    </div>
  );
}
