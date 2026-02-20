import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, FileSearch, Plus, Search, Eye, Trash2, Download } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { EmptyState } from '../ui/EmptyState';
import { CertificateFormModal } from '../certificates/CertificateFormModal';

export function Compliance() {
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetching data
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);

  useEffect(() => {
    fetchLocations();
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    // Busca as certidões com os dados vitrincados via Foreign Key (se houver), se não retorna silent como nulo para dados legados.
    const { data, error } = await supabase
      .from('certificates')
      .select('*, name_obj:certificate_names(name), agency_obj:certificate_agencies(name)')
      .order('created_at', { ascending: false });

    if (data) {
      setCertificates(data);
    } else if (error) {
      console.error(error);
    }
  };

  const fetchLocations = async () => {
    setLoading(true);
    const { data: contracts } = await supabase.from('contracts').select('billing_location');
    if (contracts) {
      const unique = Array.from(new Set(contracts.map(c => (c as any).billing_location).filter(Boolean)));
      const sorted = unique.sort() as string[];
      setLocationsList(sorted);
      if (sorted.length > 0) setSelectedLocation(sorted[0]);
    }
    setLoading(false);
  };

  // Resolve os nomes reais, misturando as chaves estrangeiras com dados antigos
  const getCertName = (c: any) => c.name_obj?.name || c.name || '';
  const getAgencyName = (c: any) => c.agency_obj?.name || c.agency || '';

  const filteredCertificates = certificates.filter(c =>
    getCertName(c).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getAgencyName(c).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.location?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToExcel = () => {
    // Header e configuração XLSX
    const header = ['Nome', 'Data Emissão', 'Data Vencimento', 'Cartório', 'Local'];
    const rows = filteredCertificates.filter(c => selectedLocation === '' || c.location === selectedLocation).map(c => [
      getCertName(c) || '-',
      c.issue_date ? new Date(c.issue_date).toLocaleDateString() : '-',
      c.due_date ? new Date(c.due_date).toLocaleDateString() : '-',
      getAgencyName(c) || '-',
      c.location || '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certidões");

    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `Certidoes_${selectedLocation || 'Geral'}_${dateStr}.xlsx`);
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
      issueDate: cert.issue_date,
      dueDate: cert.due_date,
      agency: cert.agency,
      location: cert.location,
      fileUrl: cert.file_url,
      fileName: cert.file_name,
      status: cert.status,
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
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            <div className="flex space-x-2 overflow-x-auto custom-scrollbar">
              {locationsList.map(loc => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`flex-shrink-0 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${selectedLocation === loc
                    ? 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white shadow-md'
                    : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-[#1e3a8a]'
                    }`}
                >
                  {loc}
                </button>
              ))}
              {locationsList.length === 0 && (
                <div className="p-4 text-sm font-medium text-gray-500">Nenhum local cadastrado com contratos.</div>
              )}
            </div>
          </div>

          {locationsList.length > 0 && (
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
              </div>

              {/* Tabela de Certidões */}
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                {filteredCertificates.length === 0 ? (
                  <EmptyState
                    icon={FileSearch}
                    title="Nenhuma certidão encontrada"
                    description={`Não há certidões cadastradas para o local ${selectedLocation}.`}
                    actionLabel="Adicionar Certidão"
                    onAction={() => { }}
                  />
                ) : (
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Nome</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Data Emissão</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Data Vencimento</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Cartório</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Local</th>
                        <th className="p-4 sticky right-0 bg-[#112240] text-right text-[10px] font-black text-white uppercase tracking-widest shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCertificates.map((c) => (
                        <tr key={c.id} className="border-t border-[rgba(255,255,255,0.05)] text-sm">
                          <td className="px-6 py-4 truncate font-medium">{getCertName(c)}</td>
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

      {/* Modal de Certidões */}
      <CertificateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCertificate}
        locationsList={locationsList}
        initialData={editingCertificate || undefined}
      />
    </div>
  );
}
