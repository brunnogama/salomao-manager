// src/components/crm/BrindeSelector.tsx
import { useState, useEffect, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDown, Plus, Pencil, Trash2, Check, Gift } from 'lucide-react'

interface BrindeSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function BrindeSelector({ value, onChange }: BrindeSelectorProps) {
  const [brindes, setBrindes] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingBrinde, setEditingBrinde] = useState<any>(null)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    fetchBrindes()
  }, [])

  const fetchBrindes = async () => {
    const { data } = await supabase
      .from('tipos_brinde')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (data) setBrindes(data)
  }

  const handleAdd = () => {
    setModalMode('add')
    setInputValue('')
    setIsModalOpen(true)
  }

  const handleEdit = (brinde: any) => {
    setModalMode('edit')
    setEditingBrinde(brinde)
    setInputValue(brinde.nome)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!inputValue.trim()) {
      alert('Digite um nome para o tipo de brinde')
      return
    }

    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('tipos_brinde')
          .insert([{ nome: inputValue.trim() }])

        if (error) throw error

        onChange(inputValue.trim())
      } else {
        const { error } = await supabase
          .from('tipos_brinde')
          .update({ nome: inputValue.trim() })
          .eq('id', editingBrinde.id)

        if (error) throw error

        await supabase
          .from('clients')
          .update({ tipo_brinde: inputValue.trim() })
          .eq('tipo_brinde', editingBrinde.nome)

        await supabase
          .from('magistrados')
          .update({ tipo_brinde: inputValue.trim() })
          .eq('tipo_brinde', editingBrinde.nome)

        if (value === editingBrinde.nome) {
          onChange(inputValue.trim())
        }
      }

      setIsModalOpen(false)
      setInputValue('')
      setEditingBrinde(null)
      await fetchBrindes()
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const handleDelete = async (brinde: any) => {
    if (!confirm(`Tem certeza que deseja remover "${brinde.nome}"?\n\nOs registros que usam este tipo manterão o nome, mas ele não aparecerá mais no menu.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('tipos_brinde')
        .update({ ativo: false })
        .eq('id', brinde.id)

      if (error) throw error

      if (value === brinde.nome) {
        onChange('')
      }

      await fetchBrindes()
    } catch (error: any) {
      alert(`Erro ao remover: ${error.message}`)
    }
  }

  return (
    <>
      <Menu as="div" className="relative">
        <Menu.Button className="w-full border border-gray-300 rounded p-2.5 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none text-left flex items-center justify-between bg-white hover:border-gray-400 transition-all">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-gray-400" />
            <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>{value || 'Selecione o tipo de brinde'}</span>
          </div>
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
          <Menu.Items className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleAdd}
                  className={`w-full px-3 py-2.5 text-left flex items-center gap-2 border-b border-gray-200 text-sm font-semibold transition-colors ${active ? 'bg-gray-50' : 'bg-white'
                    }`}
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Adicionar Novo Tipo</span>
                </button>
              )}
            </Menu.Item>

            {brindes.map((brinde) => (
              <Menu.Item key={brinde.id}>
                {({ active }) => (
                  <div
                    className={`px-3 py-2.5 flex items-center justify-between group text-sm transition-colors cursor-pointer ${active ? 'bg-gray-50' : ''
                      }`}
                  >
                    <button
                      onClick={() => onChange(brinde.nome)}
                      className="flex-1 text-left flex items-center gap-2"
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${value === brinde.nome ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
                      <span className={`${value === brinde.nome ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {brinde.nome}
                      </span>
                      {value === brinde.nome && (
                        <Check className="h-3.5 w-3.5 ml-auto text-gray-600" />
                      )}
                    </button>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(brinde); }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(brinde); }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </Menu.Item>
            ))}

            {brindes.length === 0 && (
              <div className="px-4 py-8 text-sm text-gray-400 text-center">
                <Gift className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">Nenhum tipo de brinde cadastrado</p>
              </div>
            )}
          </Menu.Items>
        </Transition>
      </Menu>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {modalMode === 'add' ? 'Adicionar Tipo de Brinde' : 'Editar Tipo de Brinde'}
              </h3>
              <p className="text-xs text-gray-500">
                {modalMode === 'add' ? 'Crie um novo tipo de brinde' : 'Atualize o nome do tipo'}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Nome do Tipo
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Ex: Brinde VIP, Brinde Premium..."
                className="w-full border border-gray-300 rounded p-2.5 text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setInputValue('')
                  setEditingBrinde(null)
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#112240] hover:bg-[#1a3a6c] rounded transition-colors"
              >
                {modalMode === 'add' ? 'Adicionar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
