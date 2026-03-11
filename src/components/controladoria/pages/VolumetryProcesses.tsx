import { Upload, FileText, Database } from 'lucide-react';

export function VolumetryProcesses() {
  const data: any[] = [];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#0a192f] uppercase tracking-tight">Base de Processos</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Importação e Consulta</p>
          </div>
        </div>

        <div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a8a] text-white rounded-xl hover:bg-blue-800 transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Upload className="w-4 h-4" /> Importar Planilha
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1200px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Pasta</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Tipo</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Data Cadastro</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Responsável Principal</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Cliente Principal</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Número de CNJ</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">UF</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Data do Encerramento</th>
                  <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Instância/Recurso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.length === 0 ? (
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
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-xs text-gray-500">
                      Dados serão exibidos aqui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
