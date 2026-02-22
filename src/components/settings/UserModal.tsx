import React from 'react'
import { X, Lock, Loader2 } from 'lucide-react'

interface UserModalProps {
  isOpen: boolean;
  loading: boolean;
  editingUser: any;
  userForm: any;
  setUserForm: (form: any) => void;
  onClose: () => void;
  onSave: () => void;
  onToggleModule: (moduleKey: string) => void;
}

export function UserModal({
  isOpen, loading, editingUser, userForm, setUserForm, onClose, onSave, onToggleModule
}: UserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
          <h3 className="text-lg font-bold">Configurar Usuário</h3>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Nome</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={userForm.nome}
                onChange={e => setUserForm({ ...userForm, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">Cargo</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                value={userForm.cargo}
                onChange={e => setUserForm({ ...userForm, cargo: e.target.value })}
              >
                <option>Administrador</option>
                <option>Sócio</option>
                <option>Colaborador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">E-mail (Login)</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 disabled:bg-gray-50"
              value={userForm.email}
              onChange={e => setUserForm({ ...userForm, email: e.target.value })}
              disabled={!!editingUser}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="text-xs font-bold text-gray-900 uppercase flex items-center gap-2 mb-3">
              <Lock className="h-3 w-3" /> Módulos Permitidos
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['crm', 'controladoria', 'collaborators', 'family', 'financial', 'operational'].map(m => (
                <label key={m} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={userForm.allowed_modules.includes(m)}
                    onChange={() => onToggleModule(m)}
                    className="text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {m === 'collaborators' ? 'RH' :
                      m === 'family' ? 'Família' :
                        m === 'financial' ? 'Financeiro' :
                          m === 'operational' ? 'Operacional' :
                            m === 'controladoria' ? 'Controladoria' :
                              m === 'crm' ? 'CRM Brindes' : m}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}