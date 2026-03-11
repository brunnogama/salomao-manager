import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { Upload, FileText, Database, Loader2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

// Custom AlertDialog (Design System Salomão)
function AlertDialog({ isOpen, title, message, type = 'success', onClose }: { isOpen: boolean; title: string; message: string; type?: 'success' | 'warning' | 'error'; onClose: () => void }) {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
    warning: <AlertCircle className="w-8 h-8 text-amber-500" />,
    error: <AlertCircle className="w-8 h-8 text-red-500" />
  };

  const bgColors = {
    success: 'bg-emerald-50',
    warning: 'bg-amber-50',
    error: 'bg-red-50'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center flex flex-col items-center">
          <div className={`${bgColors[type]} p-4 rounded-full mb-4`}>
            {icons[type]}
          </div>
          <h3 className="text-lg font-black text-[#0a192f] uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-sm font-semibold text-gray-500">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl hover:bg-blue-800 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-sm w-full"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export function VolumetryProcesses() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para Importação
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // State para Alertas Customizados
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean; title: string; message: string; type: 'success' | 'warning' | 'error'}>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const { data: processesData, error } = await supabase
        .from('processos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (processesData) setData(processesData);
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
      setAlertConfig({
        isOpen: true,
        title: 'Erro de Leitura',
        message: 'Não foi possível carregar os processos da base.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const parseExcelDate = (excelDate: any) => {
    if (!excelDate) return null;
    // Se já for uma string de data válida (YYYY-MM-DD ou contém T)
    if (typeof excelDate === 'string') {
        const parts = excelDate.split('/');
        if (parts.length === 3) {
            // Supondo formato DD/MM/YYYY
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return excelDate;
    }
    // Se for número serial do Excel
    if (typeof excelDate === 'number') {
        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
            setAlertConfig({
              isOpen: true,
              title: 'Planilha Vazia',
              message: 'Não encontramos nenhum dado válido na planilha.',
              type: 'warning'
            });
            setImporting(false);
            return;
        }

        setImportProgress({ current: 0, total: rawData.length });

        const formattedData = rawData.map((row: any) => ({
          pasta: row['Pasta']?.toString() || null,
          tipo: row['Tipo']?.toString() || null,
          data_cadastro: parseExcelDate(row['Data Cadastro']),
          responsavel_principal: row['Responsável principal']?.toString() || null,
          cliente_principal: row['Cliente principal']?.toString() || null,
          numero_cnj: row['Número de CNJ']?.toString() || null,
          uf: row['UF']?.toString() || null,
          status: row['Status']?.toString() || null,
          data_encerramento: parseExcelDate(row['Data do encerramento']),
          instancia: row['Tipo_1']?.toString() || row['Instância']?.toString() || null // Excel pode nomear colunas duplicadas com _1
        }));

        // Em vez de inserir tudo de uma vez, divide em lotes para atualizar o progresso
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < formattedData.length; i += batchSize) {
            const batch = formattedData.slice(i, i + batchSize);
            const { error } = await supabase
              .from('processos')
              .insert(batch);

            if (error) throw error;
            
            inserted += batch.length;
            setImportProgress({ current: inserted, total: rawData.length });
        }

        setAlertConfig({
          isOpen: true,
          title: 'Importação Concluída',
          message: `${inserted} processos foram importados com sucesso!`,
          type: 'success'
        });
        
        fetchProcesses(); // Recarrega a tabela
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erro ao importar planilha:', error);
      setAlertConfig({
        isOpen: true,
        title: 'Falha na Importação',
        message: 'Ocorreu um erro ao importar a planilha. Verifique a formatação do arquivo.',
        type: 'error'
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Tem certeza que deseja apagar TODOS os processos importados? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    setLoading(true);
    try {
        const { error } = await supabase
            .from('processos')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
            
        if (error) throw error;
        
        setData([]);
        setAlertConfig({
          isOpen: true,
          title: 'Base Limpa',
          message: 'Todos os processos foram apagados com sucesso.',
          type: 'success'
        });
    } catch (error) {
        console.error('Erro ao limpar processos:', error);
        setAlertConfig({
          isOpen: true,
          title: 'Erro na Exclusão',
          message: 'Não foi possível limpar a base de processos.',
          type: 'error'
        });
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="flex flex-col space-y-6 relative">
      <AlertDialog 
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
        
        {/* Barra de Progresso no Topo do Header */}
        {importing && importProgress.total > 0 && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
             <div 
               className="h-full bg-blue-600 transition-all duration-300 ease-out"
               style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
             />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#0a192f] uppercase tracking-tight">Base de Processos</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{data.length} registros encontrados</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data.length > 0 && (
            <button 
              onClick={handleClearData}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Limpar Base
            </button>
          )}
          
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl hover:bg-blue-800 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 min-w-[180px]"
          >
            {importing ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> {importProgress.current > 0 ? `${importProgress.current} / ${importProgress.total}` : 'Lendo arquivo...'}</>
            ) : (
               <><Upload className="w-4 h-4" /> Importar Planilha</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="max-h-[600px] overflow-y-auto min-w-[1200px]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Pasta</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Tipo</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest min-w-[120px]">Data Cadastro</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Responsável Principal</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Cliente Principal</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Número de CNJ</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">UF</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest min-w-[150px]">Data do Encerramento</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Instância/Recurso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                    <tr>
                    <td colSpan={10} className="p-20 text-center">
                      <Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin mx-auto mb-4" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando dados...</p>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-20 text-center bg-gray-50/50">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-1">Nenhum processo importado</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase">Importe uma planilha para visualizar os dados dos processos.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 text-xs font-bold text-[#0a192f]">{row.pasta || '-'}</td>
                      <td className="p-4 text-xs text-gray-600">{row.tipo || '-'}</td>
                      <td className="p-4 text-xs text-gray-600">{row.data_cadastro ? new Date(row.data_cadastro).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="p-4 text-xs font-semibold text-gray-800">{row.responsavel_principal || '-'}</td>
                      <td className="p-4 text-xs text-gray-600">{row.cliente_principal || '-'}</td>
                      <td className="p-4 text-xs font-mono text-gray-500">{row.numero_cnj || '-'}</td>
                      <td className="p-4 text-xs font-bold text-gray-600">{row.uf || '-'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border ${
                          row.status?.toLowerCase() === 'ativo' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                            {row.status || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-600">{row.data_encerramento ? new Date(row.data_encerramento).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="p-4 text-xs text-gray-600">{row.instancia || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
