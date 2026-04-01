import { useState } from 'react';
import { Database, Search, ShieldAlert, AlertTriangle, Blocks, Lock } from 'lucide-react';
import { TABLE_MAPPINGS, getModulesForTable, CORE_TABLES } from '../../data/tableMappings';
import { GenericTableEditor } from './tables/GenericTableEditor';

// Organizando dados em lista
const allTables = Object.keys(TABLE_MAPPINGS).map(tableName => {
  return {
    name: tableName,
    modules: getModulesForTable(tableName),
    isCore: CORE_TABLES.includes(tableName)
  }
}).sort((a, b) => a.name.localeCompare(b.name));

export function TablesSection({ isAdmin }: { isAdmin: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('Todos');
  const [activeTable, setActiveTable] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col items-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-red-800">Acesso Restrito</h3>
        <p className="text-red-700">Apenas perfis de Administrador Global podem acessar a gestão crua de banco de dados.</p>
      </div>
    );
  }

  // Se uma tabela está ativa, renderizamos o editor dela (cobrindo essa view)
  if (activeTable) {
    return (
      <div className="h-[calc(100vh-140px)]">
        <GenericTableEditor tableName={activeTable} onBack={() => setActiveTable(null)} />
      </div>
    );
  }

  // Extrair módulos únicos para filtro
  const allModulesSet = new Set<string>();
  allTables.forEach(t => t.modules.forEach(m => allModulesSet.add(m)));
  const uniqueModules = ['Todos', ...Array.from(allModulesSet).sort()];

  const filteredTables = allTables.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchModule = selectedModule === 'Todos' || t.modules.includes(selectedModule);
    return matchSearch && matchModule;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)] animate-in fade-in zoom-in-95">
      <div className="p-6 border-b shrink-0 flex flex-col gap-6">
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Gestão de Banco de Dados
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase tracking-widest">Acesso Raiz</span>
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Visualize e manipule diretamente as 93 tabelas do sistema.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <h4 className="font-bold text-amber-900">Aviso de Integridade (Modo Deus)</h4>
            <p className="text-xs text-amber-800 font-medium leading-relaxed mt-1">
              Este painel dá acesso à edição sem validações. Tabelas marcadas como <span className="bg-red-500 text-[9px] text-white px-1 uppercase rounded tracking-widest mx-0.5">Core</span> estão protegidas em Somente Leitura por conterem lógica vital (ex: Contratos e Usuários). Para deletar ou inserir novos dados, utilize as tabelas de apoio padrão.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pelo nome da tabela..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-sm"
            />
          </div>
          <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
            <div className="flex gap-2">
              {uniqueModules.map(mod => (
                <button
                  key={mod}
                  onClick={() => setSelectedModule(mod)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                    selectedModule === mod 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
        {filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Blocks className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Nenhuma Tabela</h3>
            <p className="text-sm font-medium text-gray-500">Nenhum resultado corresponde à sua busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map(t => (
              <button
                key={t.name}
                onClick={() => setActiveTable(t.name)}
                className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-left group flex flex-col relative overflow-hidden"
              >
                {t.isCore && (
                  <div className="absolute top-0 right-0 p-2 bg-red-50 text-red-500 rounded-bl-xl border-b border-l border-red-100" title="Protegida (Somente Leitura)">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <h3 className="font-black text-gray-800 text-sm font-mono mt-1 mb-3 group-hover:text-indigo-600 transition-colors pr-6">
                  {t.name}
                </h3>
                
                <div className="flex flex-wrap gap-1 mt-auto">
                  {t.modules.map((m, i) => (
                    <span 
                      key={i} 
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-gray-100 ${
                        m === 'Geral' ? 'bg-gray-100 text-gray-500' 
                        : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
