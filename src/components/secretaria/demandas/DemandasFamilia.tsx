import { useState, useEffect, useMemo } from 'react'
import { Search, Loader2, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx' 
import { supabase } from '../../../lib/supabase'
import { DemandasTable } from './DemandasTable'
import { DemandasFormModal } from './DemandasFormModal'

export function DemandasFamilia() {
  const [demandas, setDemandas] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [itemToDelete, setItemToDelete] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchDados = async () => {
    const { data, error } = await supabase
      .from('familia_salomao_demandas')
      .select('*')
      .order('data_solicitacao', { ascending: false })

    if (!error && data) {
      setDemandas(data)
    }
  }

  useEffect(() => {
    fetchDados()
    
    // Listener for external trigger
    const handleOpenDemandaModal = () => {
      setSelectedItem(null);
      setIsModalOpen(true);
    };
    
    document.addEventListener('openNovaDemanda', handleOpenDemandaModal);
    
    return () => {
      document.removeEventListener('openNovaDemanda', handleOpenDemandaModal);
    };
  }, [])

  const filteredData = useMemo(() => {
    return demandas.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.demanda?.toLowerCase().includes(term) ||
        item.solicitante?.toLowerCase().includes(term) ||
        item.equipamento?.toLowerCase().includes(term) ||
        item.fornecedor?.toLowerCase().includes(term)
      )
    })
  }, [demandas, searchTerm])

  const handleSaveData = async (formData: any) => {
    try {
      if (formData.id) {
        const { error } = await supabase
          .from('familia_salomao_demandas')
          .update(formData)
          .eq('id', formData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('familia_salomao_demandas')
          .insert([formData])
        if (error) throw error
      }
      await fetchDados()
      setIsModalOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Erro ao salvar demanda:', error)
      alert('Erro ao salvar a demanda.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('familia_salomao_demandas')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchDados()
      setItemToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir a demanda.')
    }
  }

  const handleEditItem = (item: any) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in duration-300">
      {/* Toolbar / Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.02)] border border-slate-200 shrink-0">
        
        {/* Search */}
        <div className="relative group/search w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-[#001D4A] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar demandas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border-slate-200/60 rounded-xl text-sm placeholder-slate-400 font-medium focus:bg-white focus:border-[#001D4A]/50 focus:ring-4 focus:ring-[#001D4A]/10 transition-all duration-300 shadow-sm outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 min-h-[400px]">
        <DemandasTable
          data={filteredData}
          onEditClick={handleEditItem}
          onDeleteClick={(item) => setItemToDelete(item)}
        />
      </div>

      <DemandasFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
        onSave={handleSaveData}
        initialData={selectedItem}
      />

      {/* Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 font-semibold leading-relaxed">
                Tem certeza que deseja remover esta demanda de <span className="text-[#112240] font-black">{itemToDelete.solicitante || 'Sem Solicitante'}</span>?
              </p>
            </div>
            <div className="flex border-t border-gray-50">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(itemToDelete.id)}
                className="flex-1 px-6 py-4 text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all border-l border-gray-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


