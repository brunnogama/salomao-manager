// CRM Clients - Gift Distribution Module
// Shows CONTACTS grouped by COMPANY for year-end gift distribution

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Search,
  Plus,
  Pencil,
  Trash,
  MapPin,
  Gift,
  Building2,
  UserCircle,
  LogOut,
  ChevronDown,
  Users,
  Package
} from 'lucide-react'
import { CRMContactModal } from './CRMContactModal'
import { CRMContact, getGiftBadgeColor } from '../../types/crmContact'

interface ClientsProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Clients({
  userName = 'Usuário',
  onModuleHome,
  onLogout
}: ClientsProps) {
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contactToEdit, setContactToEdit] = useState<CRMContact | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CRMContact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGiftType, setFilterGiftType] = useState<string>('')

  useEffect(() => { fetchContacts() }, [])

  const fetchContacts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('client_contacts')
      .select(`
        *,
        client:clients(
          id, name,
          partner:partners(name)
        )
      `)
      .order('client(name), name')

    if (error) {
      console.error('Error fetching contacts:', error)
    }

    if (!error && data) {
      setContacts(data as unknown as CRMContact[])
    }

    setLoading(false)
  }

  const handleDeleteContact = async (contact: CRMContact) => {
    await supabase.from('client_contacts').delete().eq('id', contact.id)
    setDeleteConfirm(null)
    fetchContacts()
  }

  // Group contacts by company
  const groupedContacts = useMemo(() => {
    let filtered = contacts.filter(c => {
      const matchSearch = !searchTerm ||
        [c.name, c.role, c.client?.name, c.email].some(f =>
          f?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      const matchGift = !filterGiftType || c.gift_type === filterGiftType
      return matchSearch && matchGift
    })

    // Group by client
    const grouped = filtered.reduce((acc, contact) => {
      const clientId = contact.client?.id || 'no-client'
      if (!acc[clientId]) {
        acc[clientId] = {
          client: contact.client,
          contacts: []
        }
      }
      acc[clientId].contacts.push(contact)
      return acc
    }, {} as Record<string, { client: any; contacts: CRMContact[] }>)

    return Object.values(grouped).sort((a, b) =>
      (a.client?.name || '').localeCompare(b.client?.name || '')
    )
  }, [contacts, searchTerm, filterGiftType])

  const availableGiftTypes = useMemo(() =>
    Array.from(new Set(contacts.map(c => c.gift_type).filter(Boolean))).sort(),
    [contacts]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0a192f]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onModuleHome}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <Gift className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Distribuição de Brindes</h1>
                <p className="text-xs text-white/60 font-medium">Contatos para entrega de presentes</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                <UserCircle className="w-4 h-4 text-white/60" />
                <span className="text-sm font-bold text-white">{userName}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar contato, empresa, cargo..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 transition-all outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-white/40 transition-all outline-none"
            value={filterGiftType}
            onChange={e => setFilterGiftType(e.target.value)}
          >
            <option value="">Todos os brindes</option>
            {availableGiftTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setContactToEdit(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Novo Contato
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 pb-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
            <p className="text-white/60 mt-4 font-medium">Carregando contatos...</p>
          </div>
        ) : groupedContacts.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white/80 mb-2">Nenhum contato encontrado</h3>
            <p className="text-white/40">Adicione contatos para organizar a distribuição de brindes</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedContacts.map((group, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
                {/* Company Header */}
                <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="text-lg font-black text-white">{group.client?.name || 'Empresa Não Vinculada'}</h3>
                        {group.client?.partner?.name && (
                          <p className="text-xs text-white/60 font-medium">Sócio: {group.client.partner.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                      <Package className="w-4 h-4 text-white/60" />
                      <span className="text-sm font-bold text-white">{group.contacts.length} {group.contacts.length === 1 ? 'contato' : 'contatos'}</span>
                    </div>
                  </div>
                </div>

                {/* Contacts List */}
                <div className="p-6 space-y-3">
                  {group.contacts.map(contact => (
                    <div
                      key={contact.id}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-bold text-white">{contact.name}</h4>
                            {contact.role && (
                              <span className="text-xs px-2 py-1 bg-white/10 text-white/60 rounded-md font-medium">
                                {contact.role}
                              </span>
                            )}
                            {contact.gift_type && (
                              <span className={`text-xs px-2 py-1 rounded-md font-bold border ${getGiftBadgeColor(contact.gift_type)}`}>
                                🎁 {contact.gift_type}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-white/60">
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <span>📧</span> {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <span>📞</span> {contact.phone}
                              </span>
                            )}
                          </div>

                          {contact.address && (
                            <div className="flex items-start gap-2 text-xs text-white/60">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              <span>
                                {contact.address}, {contact.address_number}
                                {contact.neighborhood && ` - ${contact.neighborhood}`}
                                {contact.city && contact.uf && ` - ${contact.city}/${contact.uf}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setContactToEdit(contact)
                              setIsModalOpen(true)
                            }}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(contact)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRM Contact Modal */}
      <CRMContactModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setContactToEdit(null)
        }}
        contact={contactToEdit || undefined}
        onSave={fetchContacts}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
              <h3 className="text-lg font-black">Confirmar Exclusão</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Tem certeza que deseja excluir o contato <strong>{deleteConfirm.name}</strong>?
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteContact(deleteConfirm)}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}