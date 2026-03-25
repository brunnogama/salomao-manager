import { useState } from 'react'
import { MODULE_CONFIG } from '../../config/modules'
import { Check, Save, Lock, User, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { logAction } from '../../lib/logger'

interface AppUser {
  id: string;
  email: string;
  nome: string;
  role: string;
  allowed_modules: string[];
}

interface PermissionsSectionProps {
  users: AppUser[];
  isAdmin: boolean;
  onRefreshUsers: () => void;
}

export function PermissionsSection({ users, isAdmin, onRefreshUsers }: PermissionsSectionProps) {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  const handleSelectUser = (user: AppUser) => {
    setSelectedUser(user)
    setPermissions(user.allowed_modules || [])
    setStatus({ type: null, message: '' })
  }

  const toggleModuleFullAccess = (moduleId: string) => {
    let newPerms = [...permissions]
    
    const hasModuleAccess = newPerms.includes(moduleId)
    
    if (hasModuleAccess) {
      // Remove module and all its specific pages
      newPerms = newPerms.filter(p => p !== moduleId && !p.startsWith(`${moduleId}:`))
    } else {
      // Add module, remove specific pages as module grants full access
      newPerms = newPerms.filter(p => !p.startsWith(`${moduleId}:`))
      newPerms.push(moduleId)
    }
    
    setPermissions(newPerms)
  }

  const togglePageAccess = (moduleId: string, pageId: string) => {
    let newPerms = [...permissions]
    const permKey = `${moduleId}:${pageId}`
    
    // If they had full module access, we need to convert it to granular
    if (newPerms.includes(moduleId)) {
      newPerms = newPerms.filter(p => p !== moduleId)
      // Add all pages EXCEPT the one being toggled off
      const allPages = Object.keys(MODULE_CONFIG[moduleId as keyof typeof MODULE_CONFIG]?.titles || {});
      allPages.forEach(p => {
        if (p !== pageId) {
          newPerms.push(`${moduleId}:${p}`)
        }
      })
    } else {
      // Normal toggle
      if (newPerms.includes(permKey)) {
        newPerms = newPerms.filter(p => p !== permKey)
      } else {
        newPerms.push(permKey)
      }
      
      // Check if they now have all pages individually, if so, convert to module full access
      const allPages = Object.keys(MODULE_CONFIG[moduleId as keyof typeof MODULE_CONFIG]?.titles || {});
      const currentPagesCount = newPerms.filter(p => p.startsWith(`${moduleId}:`)).length;
      if (currentPagesCount === allPages.length) {
         newPerms = newPerms.filter(p => !p.startsWith(`${moduleId}:`));
         newPerms.push(moduleId);
      }
    }
    
    setPermissions(newPerms)
  }

  const toggleExpand = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const handleSave = async () => {
    if (!selectedUser || !isAdmin) return
    
    setLoading(true)
    setStatus({ type: null, message: '' })
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ allowed_modules: permissions })
        .eq('email', selectedUser.email)
        
      if (error) throw error
      
      await logAction('UPDATE', 'USER_PROFILES', `Atualizou permissões granulares de ${selectedUser.email}`)
      setStatus({ type: 'success', message: 'Permissões atualizadas com sucesso!' })
      onRefreshUsers()
      
    } catch (e: any) {
      setStatus({ type: 'error', message: 'Erro ao salvar permissões: ' + (e.message || 'Erro desconhecido') })
    } finally {
      setLoading(false)
    }
  }

  const activeUsers = users.filter(u => u.email !== 'marcio.gama@salomaoadv.com.br')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-[600px] animate-in fade-in zoom-in-95">
      {/* Left side: Users List */}
      <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Selecione um Usuário
          </h3>
          <p className="text-xs text-gray-500 mt-1">Gerencie acessos por página</p>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {activeUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all ${
                selectedUser?.id === user.id 
                  ? 'bg-blue-50 border-blue-200 border text-blue-900 shadow-sm' 
                  : 'hover:bg-gray-100 border border-transparent text-gray-700'
              }`}
            >
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm truncate">{user.email}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                  {user.role}
                </span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${selectedUser?.id === user.id ? 'text-blue-500 translate-x-1' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Right side: Permissions Tree */}
      <div className="w-full md:w-2/3 flex flex-col bg-white">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <Lock className="h-16 w-16 mb-4 text-gray-200" />
            <h4 className="text-lg font-bold text-gray-600">Nenhum usuário selecionado</h4>
            <p className="text-sm mt-2 max-w-sm">Selecione um usuário na lista à esquerda para configurar as permissões granulares de acesso a módulos e páginas do sistema.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="font-black text-xl text-[#0a192f] tracking-tight">Permissões de Acesso</h3>
                <p className="text-sm text-gray-500 font-medium">Configurando para <strong className="text-blue-600">{selectedUser.email}</strong></p>
              </div>
              
              <button
                onClick={handleSave}
                disabled={loading || !isAdmin}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 active:scale-95 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Regras
              </button>
            </div>
            
            {status.type && (
              <div className={`mx-6 mt-4 p-3 text-sm font-bold rounded-lg flex items-center gap-2 ${
                status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {status.type === 'success' ? <Check className="w-4 h-4" /> : null}
                {status.message}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {Object.entries(MODULE_CONFIG).map(([modId, modData]) => {
                const hasFullAccess = permissions.includes(modId)
                const isExpanded = expandedModules[modId] !== false // Default expanded
                const moduleNameMap: Record<string, string> = {
                  crm: 'CRM & Clientes',
                  collaborators: 'Recursos Humanos',
                  financial: 'Financeiro',
                  executive: 'Secretaria Executiva',
                  controladoria: 'Controladoria Jurídica',
                  operational: 'Operacional'
                };
                
                // Count active specific pages if not full access
                const activePages = Object.keys(modData.titles).filter(p => permissions.includes(`${modId}:${p}`)).length
                
                return (
                  <div key={modId} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-200">
                    <div 
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${hasFullAccess ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleExpand(modId)}
                    >
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleExpand(modId); }}
                          className="p-1 hover:bg-gray-200 rounded-md text-gray-500"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div>
                          <h4 className="font-bold text-gray-900">{moduleNameMap[modId] || modId}</h4>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            {hasFullAccess 
                              ? <span className="text-blue-600 font-bold flex items-center gap-1"><Check className="w-3 h-3"/> Acesso Total</span> 
                              : activePages > 0 
                                ? <span className="text-amber-600 font-bold">{activePages} de {Object.keys(modData.titles).length} páginas liberadas</span>
                                : <span className="text-gray-400">Restrito</span>}
                          </p>
                        </div>
                      </div>
                      
                      <label className="flex items-center cursor-pointer gap-2" onClick={e => e.stopPropagation()}>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Liberar Módulo</span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={hasFullAccess}
                            onChange={() => toggleModuleFullAccess(modId)}
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50 p-4 pt-2 border-t border-gray-100 grid md:grid-cols-2 gap-2">
                        {Object.entries(modData.titles).map(([pageId, title]) => {
                          const isPageAllowed = hasFullAccess || permissions.includes(`${modId}:${pageId}`)
                          return (
                            <label 
                              key={pageId} 
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                isPageAllowed 
                                  ? 'bg-white border-blue-200 shadow-sm' 
                                  : 'bg-white/50 border-gray-200 opacity-60 hover:opacity-100 hover:bg-white'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                isPageAllowed && hasFullAccess ? 'bg-blue-100 border-blue-300' :
                                isPageAllowed ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                              }`}>
                                {isPageAllowed && <Check className={`w-3.5 h-3.5 ${hasFullAccess ? 'text-blue-600' : 'text-white'}`} />}
                              </div>
                              <input 
                                type="checkbox" 
                                className="hidden"
                                checked={isPageAllowed}
                                disabled={hasFullAccess}
                                onChange={() => togglePageAccess(modId, pageId)}
                              />
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isPageAllowed ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {typeof title === 'string' ? title : pageId}
                                </span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                  /{modId}/{pageId}
                                </span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
