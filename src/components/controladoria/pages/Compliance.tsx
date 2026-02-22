import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, ShieldCheck, FileText, CheckCircle2, Clock, AlertCircle, Eye, Pencil, Trash2, X, Plus, Calendar, FileDown, Paperclip, Loader2, ChevronDown, RefreshCw, LayoutDashboard, Database, BarChart3, FileSearch, Edit } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import XLSX from 'xlsx-js-style';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { EmptyState } from '../ui/EmptyState';
import { CertificateFormModal } from '../certificates/CertificateFormModal';
import { CertificateDetailsModal } from '../certificates/CertificateDetailsModal';
import { FilterSelect } from '../ui/FilterSelect';

const CNPJ_MAP: Record<string, string> = {
  'Salomão BA': '63.808.246/0001-04',
  'Salomão DF': '52.361.325/0001-01',
  'Salomão ES': '52.033.582/0001-06',
  'Salomão PA': '',
  'Salomão RJ': '14.493.710/0001-05',
  'Salomão SC': '62.793.384/0001-02',
  'Salomão SP': '33.789.321/0001-76'
};

export function Compliance() {
  const [locationsList, setLocationsList] = useState<{ name: string, cnpj?: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ged' | string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertType, setSelectedCertType] = useState('');

  // Fetching data
  const [certificates, setCertificates] = useState<any[]>([]);
  const [nameDict, setNameDict] = useState<Record<string, string>>({});
  const [agencyDict, setAgencyDict] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [viewingCertificate, setViewingCertificate] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return null;
    // Tenta ISO YYYY-MM-DD
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Tenta DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
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
      const dDate = parseLocalDate(c.due_date);
      return dDate && dDate >= today;
    });

    const expired = relevantCertificates.filter(c => {
      if (!c.due_date) return false;
      const dDate = parseLocalDate(c.due_date);
      return dDate && dDate < today;
    });

    const expiringSoon = active.filter(c => {
      if (!c.due_date) return false;
      const dDate = parseLocalDate(c.due_date);
      return dDate && dDate <= warningThreshold;
    });

    const expiringMonth = active.filter(c => {
      if (!c.due_date) return false;
      const dDate = parseLocalDate(c.due_date);
      const thirtyDaysOut = new Date(today);
      thirtyDaysOut.setDate(today.getDate() + 30);
      return dDate && dDate <= thirtyDaysOut;
    });

    const sortedMonth = [...expiringMonth].sort((a, b) => {
      const dateA = parseLocalDate(a.due_date)?.getTime() || 0;
      const dateB = parseLocalDate(b.due_date)?.getTime() || 0;
      return dateA - dateB;
    });

    return {
      active: active.length,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      expiringMonthList: sortedMonth,
      expiredList: expired // Adicionado para exibir no dashboard se necessário
    };
  }, [certificates, activeTab]);

  const expiringByLocation = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warningThreshold = new Date(today);
    warningThreshold.setDate(today.getDate() + 10);

    return certificates.reduce((acc, c) => {
      if (!c.due_date || !c.location) return acc;
      const dDate = parseLocalDate(c.due_date);
      // Inclui vencidas (dDate < today) OU a vencer em 10 dias (dDate <= warningThreshold)
      if (dDate && dDate <= warningThreshold) {
        acc[c.location] = (acc[c.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [certificates]);

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warningThreshold = new Date(today);
    warningThreshold.setDate(today.getDate() + 10);

    const dataByLocation = certificates.reduce((acc, c) => {
      const dDate = parseLocalDate(c.due_date);
      const loc = c.location || 'Não Informado';
      if (!acc[loc]) acc[loc] = { valid: 0, expiring: 0, expired: 0 };

      if (!c.due_date) {
        acc[loc].valid += 1;
      } else if (dDate && dDate < today) {
        acc[loc].expired += 1;
      } else if (dDate && dDate <= warningThreshold) {
        acc[loc].expiring += 1;
      } else {
        acc[loc].valid += 1;
      }
      return acc;
    }, {} as Record<string, { valid: number, expiring: number, expired: number }>);

    return (Object.entries(dataByLocation) as [string, any][]).map(([name, counts]) => ({
      name,
      data: [
        { name: 'Em Dia', value: counts.valid, color: '#1e3a8a' },
        { name: '7 Dias Úteis', value: counts.expiring, color: '#facc15' },
        { name: 'Vencida', value: counts.expired, color: '#ef4444' }
      ],
      total: counts.valid + counts.expiring + counts.expired
    }));
  }, [certificates]);

  // Resolve os nomes reais, misturando as chaves do dicionário com dados antigos
  const getCertName = (c: any) => nameDict[c.name] || c.name || '';
  const getAgencyName = (c: any) => agencyDict[c.agency] || c.agency || '';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Se vier no formato ISO 2024-02-20, dividimos para evitar problemas de fuso horário
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString();
  };

  const uniqueCertTypes = useMemo(() => {
    const types = new Set<string>();

    // Filter certificates based on the active tab first
    const relevantCerts = certificates.filter(c =>
      activeTab === 'dashboard' || activeTab === 'ged' || c.location === activeTab
    );

    relevantCerts.forEach(c => {
      const name = getCertName(c);
      if (name) types.add(name);
    });
    return Array.from(types).sort();
  }, [certificates, nameDict, activeTab]);

  const filteredCertificates = certificates.filter(c => {
    const matchesSearch = getCertName(c).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAgencyName(c).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = !selectedCertType || getCertName(c) === selectedCertType;

    return matchesSearch && matchesType;
  });

  const exportToExcel = () => {
    // Header e configuração XLSX
    const header = ['Documento', 'CNPJ', 'Data Emissão', 'Data Vencimento', 'Cartório', 'Local'];
    const rows = filteredCertificates.filter(c => activeTab === 'dashboard' || activeTab === 'ged' || c.location === activeTab).map(c => [
      getCertName(c) || '-',
      c.cnpj || '-',
      formatDate(c.issue_date),
      formatDate(c.due_date),
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
        status: data.status || 'Válida',
        observations: data.observations
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
      observations: cert.observations,
    } as any);
    setIsModalOpen(true);
  };

  const handleView = (cert: any) => {
    setViewingCertificate(cert);
    setIsViewModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCertificate(null);
    setIsModalOpen(true);
  };

  const handleEmitRF = async (locationName: string) => {
    const cnpjToUse = CNPJ_MAP[locationName];

    if (!cnpjToUse) {
      toast.error('CNPJ não cadastrado ou não encontrado para este local');
      return;
    }

    const cleanCnpj = cnpjToUse.replace(/\D/g, '');
    const rfUrl = `https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp?cnpj=${cleanCnpj}`;

    // Abre o site da RF em uma nova aba
    window.open(rfUrl, '_blank');

    // Data de hoje formatada YYYY-MM-DD no fuso local
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Abre o modal de nova certidão já preenchido
    // Usamos as chaves que o mapping do modal espera (issue_date, due_date)
    setEditingCertificate({
      name: 'Comprovante de Inscrição e de Situação Cadastral',
      cnpj: cnpjToUse,
      location: locationName,
      issue_date: today,
      due_date: today,
      agency: 'Secretaria da Receita Federal do Brasil'
    } as any);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2 sm:p-3 shadow-lg shrink-0">
            <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Compliance</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Gestão de Certidões e Conformidade</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95 w-full sm:w-auto"
          >
            <Download className="h-4 w-4 shrink-0" /> Exportar XLS
          </button>

          {/* Ações */}
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" /> Nova Certidão
          </button>
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
                      <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black border animate-pulse ${activeTab === loc.name
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
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Status por Unidade</h3>
                    </div>
                    <div className="flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1e3a8a]" /> Em Dia</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#facc15]" /> 7 Dias Úteis</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /> Vencidas</div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-1">
                    {(chartData as any[]).map((loc) => (
                      <div key={loc.name} className="flex flex-col items-center bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 hover:bg-gray-50 transition-colors">
                        <div className="w-full h-40 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={loc.data.filter((d: any) => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {loc.data.filter((d: any) => d.value > 0).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Centered Total */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-lg font-black text-[#0a192f] leading-none">{loc.total}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Total</span>
                          </div>
                        </div>
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{loc.name}</h4>
                        <div className="flex gap-3 mt-3">
                          {loc.data.map((d: any) => (
                            <div key={d.name} className="flex flex-col items-center">
                              <span className="text-xs font-black text-[#0a192f]">{d.value}</span>
                              <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">{d.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {chartData.length === 0 && (
                      <div className="col-span-full h-full flex flex-col items-center justify-center text-gray-400 py-20">
                        <ShieldCheck className="w-12 h-12 opacity-10 mb-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sem dados disponíveis</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabela de Próximos Vencimentos */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[500px]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">Próximos Vencimentos</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {/* Exibe primeiro as Vencidas, depois as Próximas */}
                    {(stats as any).expiredList.length > 0 || stats.expiringMonthList.length > 0 ? (
                      <>
                        {(stats as any).expiredList.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors group relative cursor-pointer" onClick={() => handleView(c)}>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-red-700">{getCertName(c)}</span>
                              <span className="text-[10px] text-red-500 font-medium uppercase tracking-tight">{c.location}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[11px] font-black text-red-600 block">{formatDate(c.due_date)}</span>
                                <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Vencida</span>
                              </div>
                              <Eye className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                        {stats.expiringMonthList.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group relative cursor-pointer" onClick={() => handleView(c)}>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-gray-700">{getCertName(c)}</span>
                              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{c.location}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[11px] font-black text-amber-600 block">{formatDate(c.due_date)}</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Vencimento</span>
                              </div>
                              <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </>
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
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar animate-in fade-in duration-500">
              <div className="min-w-[1000px]">
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
                            {formatDate(c.due_date)}
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
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'ged' && (
            <div className="w-full flex flex-col space-y-6">
              {/* Toolbar: Busca e Ações */}
              <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:flex-1">
                  <div className="flex items-center gap-3 w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg relative focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a] transition-all">
                    <Search className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar certidão por nome, cartório ou local..."
                      className="w-full bg-transparent border-none text-sm font-medium outline-none text-gray-700"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="w-full md:w-64 shrink-0">
                    <FilterSelect
                      icon={Filter}
                      value={selectedCertType}
                      onChange={setSelectedCertType}
                      placeholder="Todas as Certidões"
                      options={uniqueCertTypes.map(type => ({ label: type, value: type }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
                  {activeTab !== 'dashboard' && activeTab !== 'ged' && locationsList.find(l => l.name === activeTab) && (
                    <button
                      onClick={() => handleEmitRF(activeTab)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 shrink-0" /> Emitir Certidão RF
                    </button>
                  )}

                  {activeTab !== 'dashboard' && activeTab !== 'ged' && CNPJ_MAP[activeTab] && (
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg w-full sm:w-auto">
                      <ShieldCheck className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                      <span className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest truncate">
                        CNPJ FILIAL: {CNPJ_MAP[activeTab]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabela de Certidões */}
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar">
                <div className="min-w-[1000px]">
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
                          <tr
                            key={c.id}
                            className="border-t border-gray-100 text-sm hover:bg-gray-50 transition-colors cursor-pointer group"
                            onClick={() => handleView(c)}
                          >
                            <td className="px-6 py-4 truncate font-bold text-[#0a192f] group-hover:text-blue-600 transition-colors">
                              {getCertName(c)}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500">{c.cnpj || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatDate(c.issue_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatDate(c.due_date)}
                            </td>
                            <td className="px-6 py-4 truncate">{getAgencyName(c)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{c.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleView(c)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100"
                                  title="Visualizar Detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(c)}
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(c.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-gray-100"
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
            </div>
          )}
        </div>
      )}

      <CertificateFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCertificate(null);
        }}
        onSave={handleSaveCertificate}
        locationsList={locationsList.map(l => l.name)}
        initialData={editingCertificate || undefined}
      />

      <CertificateDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingCertificate(null);
        }}
        certificate={viewingCertificate}
        nameDict={nameDict}
        agencyDict={agencyDict}
      />
    </div>
  );
}
