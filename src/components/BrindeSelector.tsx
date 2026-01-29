import { useState, useEffect, Fragment } from 'react'
import { supabase } from '../lib/supabase'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDown, Plus, Pencil, Trash2, Check, Gift, Sparkles } from 'lucide-react'

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
          .from('clientes')
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
        <Menu.Button className="w-full border-2 border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-left flex items-center justify-between bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <Gift className="h-4 w-4 text-purple-600" />
            </div>
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
          <Menu.Items className="absolute z-10 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleAdd}
                  className={`w-full px-4 py-3 text-left flex items-center gap-2 border-b-2 border-gray-100 text-sm font-bold transition-all ${
                    active ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                  }`}
                >
                  <div className="p-1 bg-purple-100 rounded-lg">
                    <Plus className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>Adicionar Novo Tipo</span>
                </button>
              )}
            </Menu.Item>

            {brindes.map((brinde) => (
              <Menu.Item key={brinde.id}>
                {({ active }) => (
                  <div
                    className={`px-4 py-3 flex items-center justify-between group text-sm transition-all cursor-pointer ${
                      active ? 'bg-gray-50' : ''
                    } ${value === brinde.nome ? 'bg-purple-50/50' : ''}`}
                  >
                    <button
                      onClick={() => onChange(brinde.nome)}
                      className="flex-1 text-left flex items-center gap-2"
                    >
                      <div className={`h-2 w-2 rounded-full ${value === brinde.nome ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                      <span className={`${value === brinde.nome ? 'font-bold text-purple-700' : 'text-gray-700'}`}>
                        {brinde.nome}
                      </span>
                      {value === brinde.nome && (
                        <Check className="h-4 w-4 ml-auto text-purple-600" />
                      )}
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(brinde); }}
                        className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(brinde); }}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </Menu.Item>
            ))}

            {brindes.length === 0 && (
              <div className="px-4 py-8 text-sm text-gray-400 text-center">
                <Gift className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Nenhum tipo de brinde cadastrado</p>
              </div>
            )}
          </Menu.Items>
        </Transition>
      </Menu>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#112240]">
                  {modalMode === 'add' ? 'Adicionar Tipo de Brinde' : 'Editar Tipo de Brinde'}
                </h3>
                <p className="text-xs text-gray-500">
                  {modalMode === 'add' ? 'Crie um novo tipo de brinde' : 'Atualize o nome do tipo'}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Nome do Tipo
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Ex: Brinde VIP, Brinde Premium..."
                className="w-full border-2 border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setInputValue('')
                  setEditingBrinde(null)
                }}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                {modalMode === 'add' ? 'Adicionar' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}