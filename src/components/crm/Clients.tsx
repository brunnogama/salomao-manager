// src/components/crm/Clients.tsx
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
  Package,
  Eye
} from 'lucide-react'
import { CRMContactModal } from './CRMContactModal'
import { CRMContact, getGiftBadgeColor } from '../../types/crmContact'

interface ClientsProps {
  initialFilters?: { socio?: string; brinde?: string };
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Clients({
  initialFilters,
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
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterGiftType, setFilterGiftType] = useState<string>('')
  const [viewingCompany, setViewingCompany] = useState<any>(null)

  useEffect(() => { fetchContacts() }, [])
  useEffect(() => {
    if (initialFilters?.socio) setFilterSocio(initialFilters.socio)
    if (initialFilters?.brinde) setFilterGiftType(initialFilters.brinde)
  }, [initialFilters])

  const fetchContacts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('client_contacts')
      .select(`
        *,
        client:clients(
          id, name,
          partner:partners(id, name)
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
      const matchSocio = !filterSocio || c.client?.partner?.name === filterSocio
      const matchGift = !filterGiftType || c.gift_type === filterGiftType
      return matchSearch && matchSocio && matchGift
    })

    // Group by client
    const grouped = filtered.reduce((acc: any, contact) => {
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

    return Object.values(grouped).sort((a: any, b: any) =>
      (a.client?.name || '').localeCompare(b.client?.name || '')
    )
  }, [contacts, searchTerm, filterSocio, filterGiftType])

  const availableSocios = useMemo(() =>
    Array.from(new Set(contacts.map((c: any) => c.client?.partner?.name).filter(Boolean))).sort(),
    [contacts]
  )

  const availableGiftTypes = useMemo(() =>
    Array.from(new Set(contacts.map((c: any) => c.gift_type).filter(Boolean))).sort(),
    [contacts]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-800">Clientes</h1>
                <p className="text-sm text-gray-500 font-medium">Gestão de contatos para brindes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, empresa, cargo..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              value={filterSocio}
              onChange={e => setFilterSocio(e.target.value)}
            >
              <option value="">Todos os sócios</option>
              {availableSocios.map((socio: any) => (
                <option key={socio} value={socio}>{socio}</option>
              ))}
            </select>

            <select
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              value={filterGiftType}
              onChange={e => setFilterGiftType(e.target.value)}
            >
              <option value="">Todos os brindes</option>
              {availableGiftTypes.map((type: any) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setContactToEdit(null)
                setIsModalOpen(true)
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Novo Contato
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
        ) : groupedContacts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhum contato encontrado</h3>
            <p className="text-gray-500">Adicione contatos para organizar a distribuição de brindes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedContacts.map((group: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Company Header */}
                <div
                  className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all"
                  onClick={() => setViewingCompany(group.client)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-800">{group.client?.name || 'Empresa Não Vinculada'}</h3>
                        {group.client?.partner?.name && (
                          <p className="text-sm text-gray-600 font-medium">Sócio: {group.client.partner.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                        <Package className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold text-purple-700">{group.contacts.length}</span>
                      </div>
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-all">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contacts List */}
                <div className="divide-y divide-gray-100">
                  {group.contacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="text-base font-bold text-gray-800">{contact.name}</h4>
                            {contact.role && (
                              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md font-semibold">
                                {contact.role}
                              </span>
                            )}
                            {contact.gift_type && (
                              <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${getGiftBadgeColor(contact.gift_type)}`}>
                                🎁 {contact.gift_type}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            {contact.email && (
                              <span className="flex items-center gap-1.5">
                                <span>📧</span> {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1.5">
                                <span>📞</span> {contact.phone}
                              </span>
                            )}
                          </div>

                          {contact.address && (
                            <div className="flex items-start gap-2 text-xs text-gray-600">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
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
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(contact)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
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

      {/* Company View Modal */}
      {viewingCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
              <h3 className="text-xl font-black">Detalhes da Empresa</h3>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block">Nome da Empresa</label>
                <p className="text-lg font-bold text-gray-800">{viewingCompany.name}</p>
              </div>
              {viewingCompany.partner?.name && (
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block">Sócio Responsável</label>
                  <p className="text-lg font-bold text-gray-800">{viewingCompany.partner.name}</p>
                </div>
              )}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-xs font-bold text-purple-700">
                  <Package className="w-4 h-4 inline mr-2" />
                  {groupedContacts.find((g: any) => g.client?.id === viewingCompany.id)?.contacts.length || 0} contato(s) cadastrado(s)
                </p>
              </div>
            </div>
            <div className="px-8 pb-8 flex gap-3 justify-end">
              <button
                onClick={() => setViewingCompany(null)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fechar
              </button>
              <button
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg"
                onClick={() => {
                  // TODO: Open client edit modal
                  setViewingCompany(null)
                  alert('Edição de empresa em desenvolvimento')
                }}
              >
                Editar Empresa
              </button>
            </div>
          </div>
        </div>
      )}

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