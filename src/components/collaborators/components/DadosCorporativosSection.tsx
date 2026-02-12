import React, { useState } from 'react'
import { Briefcase, Plus, Save, Loader2, AlertTriangle } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { supabase } from '../../../lib/supabase'
import { toTitleCase } from '../../controladoria/utils/masks'

interface DadosCorporativosSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskDate: (value: string) => string
  handleRefresh: () => void
}

export function DadosCorporativosSection({
  formData,
  setFormData,
  maskDate,
  handleRefresh
}: DadosCorporativosSectionProps) {
  const [showAddMotivo, setShowAddMotivo] = useState(false)
  const [newMotivo, setNewMotivo] = useState('')
  const [savingMotivo, setSavingMotivo] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSaveMotivo = async () => {
    if (!newMotivo) return

    setSavingMotivo(true)
    try {
      const { data, error } = await supabase
        .from('termination_reasons')
        .insert({ name: newMotivo })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setFormData({ ...formData, motivo_desligamento: data.id })
        setNewMotivo('')
        setShowAddMotivo(false)
        setRefreshKey(prev => prev + 1)
        if (handleRefresh) handleRefresh()
      }
    } catch (error) {
      console.error('Erro ao salvar motivo:', error)
      alert('Erro ao salvar motivo. Verifique se a tabela existe.')
    } finally {
      setSavingMotivo(false)
    }
  }

  return (
    <section className="space-y-4">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <Briefcase className="h-4 w-4" /> Dados Corporativos
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* E-mail Corporativo */}
        <div className="md:col-span-2">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            E-mail Corporativo
          </label>
          <input
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
            value={formData.email || ''}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        {/* Status */}
        <SearchableSelect
          label="Status"
          value={formData.status || ''}
          onChange={v => setFormData({ ...formData, status: v as 'active' | 'inactive' })}
          options={[{ name: 'Ativo', id: 'active' }, { name: 'Inativo', id: 'inactive' }]}
        />

        {/* Sócio Responsável */}
        <SearchableSelect
          label="Sócio Responsável"
          value={formData.partner_id || ''}
          onChange={v => setFormData({ ...formData, partner_id: v })}
          table="partners"
          onRefresh={handleRefresh}
        />

        {/* Líder Direto */}
        <SearchableSelect
          label="Líder Direto"
          value={formData.leader_id || ''}
          onChange={v => setFormData({ ...formData, leader_id: v })}
          table="collaborators"
          onRefresh={handleRefresh}
        />

        {/* Equipe - Atualizado para tabela 'teams' */}
        <SearchableSelect
          label="Equipe"
          value={formData.equipe || ''}
          onChange={v => setFormData({ ...formData, equipe: v })}
          table="teams"
          onRefresh={handleRefresh}
        />

        {/* Cargo - Atualizado para tabela 'roles' */}
        <SearchableSelect
          label="Cargo"
          value={formData.role || ''}
          onChange={v => setFormData({ ...formData, role: v })}
          table="roles"
          onRefresh={handleRefresh}
        />

        {/* Local - Atualizado para tabela 'locations' */}
        <SearchableSelect
          label="Local"
          value={formData.local || ''}
          onChange={v => setFormData({ ...formData, local: v })}
          table="locations"
          onRefresh={handleRefresh}
        />

        {/* Centro de Custo */}
        <SearchableSelect
          label="Centro de Custo"
          value={formData.centro_custo || ''}
          onChange={v => setFormData({ ...formData, centro_custo: v })}
          table="cost_centers"
          onRefresh={handleRefresh}
        />

        {/* Data de Admissão */}
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Admissão
          </label>
          <input
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
            value={formData.hire_date || ''}
            onChange={e => setFormData({ ...formData, hire_date: maskDate(e.target.value) })}
            maxLength={10}
            placeholder="DD/MM/AAAA"
          />
        </div>

        {/* Desligamento e Motivo (Agrupados) */}
        <div className="md:col-span-3 grid grid-cols-[180px_1fr] gap-4 items-start">
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Desligamento
            </label>
            <input
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
              value={formData.termination_date || ''}
              onChange={e => setFormData({ ...formData, termination_date: maskDate(e.target.value) })}
              maxLength={10}
              placeholder="DD/MM/AAAA"
            />
          </div>

          <div className="space-y-1.5" key={`motivo-${refreshKey}`}>
            <label className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              <span>Motivo</span>
              <button
                type="button"
                onClick={() => setShowAddMotivo(!showAddMotivo)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${showAddMotivo
                    ? 'bg-[#1e3a8a] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </label>
            <SearchableSelect
              value={formData.motivo_desligamento || ''}
              onChange={v => setFormData({ ...formData, motivo_desligamento: v })}
              table="termination_reasons"
              onRefresh={handleRefresh}
              className="w-full"
            />

            {/* PAINEL DE ADICIONAR MOTIVO */}
            {showAddMotivo && (
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-5 space-y-4 animate-in slide-in-from-top duration-200 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="text-sm font-black text-[#0a192f] uppercase tracking-wider">
                    Novo Motivo
                  </h4>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-wider ml-1">
                    Descrição do Motivo *
                  </label>
                  <input
                    type="text"
                    value={newMotivo}
                    onChange={(e) => setNewMotivo(toTitleCase(e.target.value))}
                    placeholder="Ex: Pedido de Demissão..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewMotivo('')
                      setShowAddMotivo(false)
                    }}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMotivo}
                    disabled={savingMotivo || !newMotivo}
                    className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg font-black text-[10px] uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingMotivo ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}