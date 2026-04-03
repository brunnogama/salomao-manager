import re

with open('src/components/controladoria/pages/Clients.tsx', 'r') as f:
    code = f.read()

# 1. Imports
code = code.replace("import { maskCNPJ } from '../utils/masks';", "import { maskCNPJ, maskPhone } from '../utils/masks';\nimport { createPortal } from 'react-dom';")

# 2. ESC Key handler
code = code.replace("  const handleEdit = (client: Client) => {", """  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingGroup) {
        setViewingGroup(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingGroup]);

  const handleEdit = (client: Client) => {""")

# 3. Remove CRM Gift Statistics Cards UI block
start_idx = code.find("{/* CRM: Gift Statistics Cards */}")
end_idx = code.find("{/* 2. KPI Card + FilterBar */}")
if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + code[end_idx:]

# 4. View Modal Portal & Header Update
modal_start_str = "      {/* Modal de Visualização */}\n      {\n        viewingGroup && ("
modal_new_start = "      {/* Modal de Visualização */}\n      {\n        viewingGroup && createPortal("
code = code.replace(modal_start_str, modal_new_start)

# The wrapper has z-50, change to z-[9999] and use onClick to close
code = code.replace(
    '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">',
    '<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewingGroup(null)}>'
)
code = code.replace(
    '<div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">',
    '<div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>'
)

# Header redesign
old_header = """              {/* Header */}
              <div className="flex justify-between items-start sm:items-center px-4 sm:px-6 py-4 bg-gradient-to-br from-[#1e3a8a] to-[#112240] shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${viewingGroup.primaryClient.is_person ? 'bg-blue-400/20' : 'bg-indigo-400/20'}`}>
                    {viewingGroup.primaryClient.is_person ? <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                  </div>
                  <div className="min-w-0 pr-4">
                    <h2 className="text-lg sm:text-xl font-black text-white truncate">{viewingGroup.primaryClient.name}</h2>
                    <p className="text-xs sm:text-sm text-white/80 font-semibold truncate">{viewingGroup.primaryClient.cnpj ? maskCNPJ(viewingGroup.primaryClient.cnpj) : 'Sem documento'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingGroup(null)}
                  className="p-1 sm:p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>"""

new_header = """              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center shadow-lg">
                    {viewingGroup.primaryClient.is_person ? <User className="w-6 h-6 text-white" /> : <Building className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#0a192f]">{viewingGroup.primaryClient.name}</h2>
                    <p className="text-sm font-semibold text-gray-500">{viewingGroup.primaryClient.cnpj ? maskCNPJ(viewingGroup.primaryClient.cnpj) : 'Sem documento'}</p>
                  </div>
                </div>
                <button onClick={() => setViewingGroup(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>"""

code = code.replace(old_header, new_header)

# Phone Mask
code = code.replace(
    '<p className="text-sm font-bold text-gray-800 truncate">{viewingGroup.primaryClient.phone || \'-\'}</p>',
    '<p className="text-sm font-bold text-gray-800 truncate">{viewingGroup.primaryClient.phone ? maskPhone(viewingGroup.primaryClient.phone) : \'-\'}</p>'
)

# Footer redesign - remove Gerenciar Brindes text with Edit icon
old_footer = """              {/* Footer com Botões */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 bg-gray-50 shrink-0">
                <button
                  onClick={() => setViewingGroup(null)}
                  className="px-6 py-3 sm:py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors bg-white sm:bg-transparent border sm:border-transparent border-gray-200 rounded-xl sm:rounded-none w-full sm:w-auto"
                >
                  Fechar
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => handleEdit(viewingGroup.primaryClient)}
                    className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
                  >
                    <Gift className="w-4 h-4" />
                    Gerenciar Brindes
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }"""

new_footer = """              {/* Footer com Botões */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
                <button
                  onClick={() => setViewingGroup(null)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors w-full sm:w-auto"
                >
                  Fechar
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => handleEdit(viewingGroup.primaryClient)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Cliente
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      }"""

code = code.replace(old_footer, new_footer)

with open('src/components/controladoria/pages/Clients.tsx', 'w') as f:
    f.write(code)

print("Done")
