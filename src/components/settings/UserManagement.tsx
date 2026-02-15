import React from 'react'
import { Users, UserPlus, Pencil, Trash2, Check, Loader2 } from 'lucide-react'

interface AppUser {
  id: string;
  user_id: string | null;
  nome: string;
  email: string;
  cargo: string;
  role: string;
  ativo: boolean;
  allowed_modules: string[];
}

interface UserManagementProps {
  users: AppUser[];
  isAdmin: boolean;
  onOpenModal: (user?: AppUser) => void;
  onDeleteUser: (user: AppUser) => void;
}

export function UserManagement({ users, isAdmin, onOpenModal, onDeleteUser }: UserManagementProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Users className="h-5 w-5 text-gray-700" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Gestão de Usuários</h3>
        </div>
        <button
          onClick={() => onOpenModal()}
          disabled={!isAdmin}
          className="bg-gray-900 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 text-xs hover:bg-gray-800 disabled:opacity-50 transition-all"
        >
          <UserPlus className="h-4 w-4" /> Novo Usuário
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans">
          <thead>
            <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
              <th className="py-2 px-2 text-[10px] font-black text-white uppercase tracking-widest">Email</th>
              <th className="py-2 px-2 text-[10px] font-black text-white uppercase tracking-widest">Role</th>
              <th className="py-2 px-2 text-[10px] font-black text-white uppercase tracking-widest">Módulos</th>
              <th className="py-2 px-2 text-[10px] font-black text-white uppercase tracking-widest">Status</th>
              <th className="py-2 px-2 text-right text-[10px] font-black text-white uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 group transition-colors">
                <td className="py-3 px-2 text-xs font-bold text-[#112240]">{user.email}</td>
                <td className="py-3 px-2 capitalize">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500">
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap gap-1">
                    {user.allowed_modules.map(m => (
                      <span key={m} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase tracking-tighter">
                        {m === 'collaborators' ? 'RH' : m}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-2">
                  {user.ativo ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <div className="flex items-center gap-1 text-orange-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-[9px] font-bold">Pendente</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onOpenModal(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onDeleteUser(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}