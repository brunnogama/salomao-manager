import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, FileSearch, Plus, Search, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { EmptyState } from '../ui/EmptyState';

export function Compliance() {
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock de certidões (Vazio por enquanto, aguardando implementação de backend)
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

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

  const filteredCertificates = certificates.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.agency?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      </div>

      {loading ? (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mb-4" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando locais...</p>
        </div>
      ) : (
        <>
          {/* Abas de Locais no Estilo do Sistema */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
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
            <div className="flex-1 space-y-6">
              {/* Toolbar: Busca e Ações */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  {/* Busca */}
                  <div className="relative flex-1 w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar certidão por nome ou órgão..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-[#1e3a8a] transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95">
                      <Plus className="h-4 w-4" /> Nova Certidão
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de Certidões */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredCertificates.length === 0 ? (
                  <EmptyState
                    icon={FileSearch}
                    title="Nenhuma certidão encontrada"
                    description={`Não há certidões cadastradas para o local ${selectedLocation}.`}
                    actionLabel="Adicionar Certidão"
                    onAction={() => { }}
                  />
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Nome da Certidão</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Órgão</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Vencimento</th>
                        <th className="p-4 sticky right-0 bg-[#112240] text-right text-[10px] font-black text-white uppercase tracking-widest shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredCertificates.map((cert) => (
                        <tr key={cert.id} className="hover:bg-blue-50/30 cursor-pointer group transition-colors">
                          <td className="p-4 text-xs font-black text-[#0a192f] uppercase tracking-tight">{cert.name}</td>
                          <td className="p-4 text-[11px] font-semibold text-gray-600">{cert.agency}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-gray-100 text-gray-800 border-gray-200`}>
                              {cert.status}
                            </span>
                          </td>
                          <td className="p-4 text-[11px] font-semibold text-gray-500">{cert.dueDate}</td>
                          <td className="p-4">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-[#1e3a8a] transition-all"><Eye className="w-4 h-4" /></button>
                              <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
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
        </>
      )}
    </div>
  );
}
