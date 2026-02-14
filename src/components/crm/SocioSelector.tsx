// src/components/crm/SocioSelector.tsx
import { useState, useEffect, Fragment } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { Menu, Transition, Dialog } from '@headlessui/react'
import { supabase } from '../../lib/supabase'

interface SocioSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

interface Socio {
  id: string // Alterado para string para suportar UUID da tabela partners
  name: string // Alterado de nome para name
  status: string // Mapeado para a nova coluna status
  created_at: string
}

export function SocioSelector({ value, onChange, className = '' }: SocioSelectorProps) {
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [socioToEdit, setSocioToEdit] = useState<Socio | null>(null)
  const [socioName, setSocioName] = useState('')

  // Buscar sócios da nova tabela partners
  const fetchSocios = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'active') // Utilizando a nova coluna status
      .order('name', { ascending: true }) // Ordenando pela nova coluna name

    if (!error && data) {
      setSocios(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSocios()
  }, [])

  // Abrir modal para adicionar
  const handleOpenAdd = () => {
    setModalMode('add')
    setSocioName('')
    setSocioToEdit(null)
    setIsModalOpen(true)
  }

  // Abrir modal para editar
  const handleOpenEdit = (socio: Socio, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setModalMode('edit')
    setSocioName(socio.name)
    setSocioToEdit(socio)
    setIsModalOpen(true)
  }

  // Salvar (adicionar ou editar) na tabela partners
  const handleSave = async () => {
    if (!socioName.trim()) {
      alert('Por favor, digite o nome do sócio.')
      return
    }

    try {
      if (modalMode === 'add') {
        // Adicionar novo sócio na tabela partners
        const { data, error } = await supabase
          .from('partners')
          .insert([{ name: socioName.trim(), status: 'active' }])
          .select()

        if (error) throw error

        if (data && data[0]) {
          await fetchSocios()
          onChange(data[0].name)
          alert('✅ Sócio adicionado com sucesso!')
        }
      } else if (modalMode === 'edit' && socioToEdit) {
        // Editar sócio existente na tabela partners
        const { error } = await supabase
          .from('partners')
          .update({ name: socioName.trim() })
          .eq('id', socioToEdit.id)

        if (error) throw error

        // Atualizar clientes e magistrados que usam este sócio (mantendo referências legadas por nome se necessário)
        await supabase.from('clients').update({ socio: socioName.trim() }).eq('socio', socioToEdit.name)
        await supabase.from('magistrados').update({ socio: socioName.trim() }).eq('socio', socioToEdit.name)

        await fetchSocios()

        // Se o sócio selecionado é o que foi editado, atualizar o valor
        if (value === socioToEdit.name) {
          onChange(socioName.trim())
        }

        alert('✅ Sócio atualizado com sucesso!')
      }

      setIsModalOpen(false)
      setSocioName('')
      setSocioToEdit(null)
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  // Excluir sócio (marcar como inativo na nova estrutura)
  const handleDelete = async (socio: Socio, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Tem certeza que deseja excluir o sócio "${socio.name}"?\n\nOs clientes já vinculados não serão afetados.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('partners')
        .update({ status: 'inactive' }) // Atualizado para usar status string
        .eq('id', socio.id)

      if (error) throw error

      await fetchSocios()
      alert('✅ Sócio removido da lista!')
    } catch (error: any) {
      alert(`Erro ao excluir: ${error.message}`)
    }
  }

  return (
    <>
      <Menu as="div" className="relative w-full">
        <Menu.Button className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#112240] outline-none text-left flex items-center justify-between bg-white ${className}`}>
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value || 'Selecione o sócio responsável'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto focus:outline-none">
            <div className="p-1">
              {/* Botão Adicionar Novo */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleOpenAdd}
                    className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      } group flex w-full items-center px-3 py-2 text-sm font-bold rounded-md border-b border-gray-100`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Novo Sócio
                  </button>
                )}
              </Menu.Item>

              {/* Lista de Sócios */}
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-400">Carregando...</div>
              ) : socios.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">Nenhum sócio cadastrado</div>
              ) : (
                socios.map((socio) => (
                  <Menu.Item key={socio.id}>
                    {({ active }) => (
                      <div
                        className={`${active ? 'bg-gray-50' : ''
                          } group flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer`}
                      >
                        <button
                          onClick={() => {
                            onChange(socio.name)
                          }}
                          className="flex-1 text-left flex items-center"
                        >
                          <span className="text-gray-700">{socio.name}</span>
                          {value === socio.name && (
                            <Check className="h-4 w-4 ml-2 text-blue-600" />
                          )}
                        </button>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleOpenEdit(socio, e)}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(socio, e)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))
              )}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Modal Adicionar/Editar */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[200]" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  <div className="bg-[#112240] px-6 py-4">
                    <Dialog.Title as="h3" className="text-lg font-bold text-white">
                      {modalMode === 'add' ? 'Adicionar Sócio' : 'Editar Sócio'}
                    </Dialog.Title>
                  </div>

                  <div className="p-6">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Nome do Sócio
                    </label>
                    <input
                      type="text"
                      value={socioName}
                      onChange={(e) => setSocioName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#112240] outline-none"
                      placeholder="Ex: Dr. João Silva"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSave()
                        }
                      }}
                    />
                  </div>

                  <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-bold text-white bg-[#112240] hover:bg-[#1a3a6c] rounded-lg transition-colors"
                    >
                      {modalMode === 'add' ? 'Adicionar' : 'Salvar'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}