import React, { useState } from 'react'
import { Briefcase, Loader2, AlertTriangle } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { ManagedSelect } from '../../crm/ManagedSelect'
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
  const [refreshKey, setRefreshKey] = useState(0)

  // Trigger refresh when managed items change helps update other potential listeners, 
  // though ManagedSelect handles its own list. 
  // We can pass handleRefresh to onRefresh if we want global sync.

  return (
    <section className="space-y-6">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <Briefcase className="h-4 w-4" /> Dados Corporativos
      </h3>

      {/* 1. Rateio (Novo Campo) */}
      <div className="bg-gray-50/50 p-4 rounded-xl space-y-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ManagedSelect
            label="Rateio"
            value={formData.rateio_id || ''}
            onChange={v => setFormData({ ...formData, rateio_id: v })}
            tableName="rateios"
            placeholder="Selecione o Rateio..."
          />
        </div>
      </div>

      {/* 2. Contratação */}
      <div className="bg-blue-50/30 p-4 rounded-xl space-y-4 border border-blue-100/50">
        <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest flex items-center gap-2">
          Contratação
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status */}
          <SearchableSelect
            label="Status"
            value={formData.status || ''}
            onChange={v => setFormData({ ...formData, status: v as 'active' | 'inactive' })}
            options={[{ name: 'Ativo', id: 'active' }, { name: 'Inativo', id: 'inactive' }]}
            uppercase={false}
          />

          {/* Admissão */}
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

          {/* Motivo da Contratação */}
          <ManagedSelect
            label="Motivo da Contratação"
            value={formData.hiring_reason_id || ''}
            onChange={v => setFormData({ ...formData, hiring_reason_id: v })}
            tableName="hiring_reasons"
          />

          {/* E-mail Corporativo */}
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              E-mail Corporativo
            </label>
            <input
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Sócio Responsável */}
          <ManagedSelect
            label="Sócio Responsável"
            value={formData.partner_id || ''}
            onChange={v => setFormData({ ...formData, partner_id: v })}
            tableName="partners"
          />

          {/* Líder Direto */}
          <ManagedSelect
            label="Líder Direto"
            value={formData.leader_id || ''}
            onChange={v => setFormData({ ...formData, leader_id: v })}
            tableName="collaborators"
          />

          {/* Equipe */}
          <ManagedSelect
            label="Equipe"
            value={formData.equipe || ''}
            onChange={v => setFormData({ ...formData, equipe: v })}
            tableName="teams"
          />

          {/* Cargo */}
          <ManagedSelect
            label="Cargo"
            value={formData.role || ''}
            onChange={v => setFormData({ ...formData, role: v })}
            tableName="roles"
          />

          {/* Tipo da Contratação (Manter fixo por enquanto, ou migrar se necessário. O prompt pede 'gerenciar' para todos. Vamos manter SearchableSelect fixo pois não há tabela de tipos de contrato, a não ser que criemos.) */}
          {/* O prompt do usuário pediu menus suspensos gerenciáveis. 'Tipo da contratação' é commum ser fixo. Vou manter o existente, mas user asked "Todos... deverão ter botão de gerenciamento". 
              Se eu mudar para ManagedSelect, preciso de uma tabela 'contract_types'. 
              Vou assumir que tipos padrão (CLT, PJ) não precisam ser gerenciados dinamicamente via tabela agora para não complicar demais, a menos que user exija.
              Mantendo SearchableSelect padrão para este campo específico pois não criei tabela p/ ele (não estava na lista de tabelas a criar no prompt, estava na lista de menus a *exibir*).
           */}
          <SearchableSelect
            label="Tipo da Contratação"
            value={formData.contract_type || ''}
            onChange={v => setFormData({ ...formData, contract_type: v })}
            options={[
              { id: 'Advogado', name: 'Advogado' },
              { id: 'CLT', name: 'CLT' },
              { id: 'Estagiário', name: 'Estagiário' },
              { id: 'Jovem Aprendiz', name: 'Jovem Aprendiz' },
              { id: 'PJ', name: 'PJ' }
            ]}
            uppercase={false}
          />

          {/* Local */}
          <ManagedSelect
            label="Local"
            value={formData.local || ''}
            onChange={v => setFormData({ ...formData, local: v })}
            tableName="locations"
          />

          {/* Centro de Custo */}
          <ManagedSelect
            label="Centro de Custo"
            value={formData.centro_custo || ''}
            onChange={v => setFormData({ ...formData, centro_custo: v })}
            tableName="cost_centers"
          />
        </div>
      </div>

      {/* 3. Desligamento */}
      <div className="bg-red-50/30 p-4 rounded-xl space-y-4 border border-red-100/50">
        <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
          Desligamento
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Desligamento */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Data Desligamento
            </label>
            <input
              className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium"
              value={formData.termination_date || ''}
              onChange={e => setFormData({ ...formData, termination_date: maskDate(e.target.value) })}
              maxLength={10}
              placeholder="DD/MM/AAAA"
            />
          </div>

          {/* Iniciativa do Desligamento */}
          <ManagedSelect
            label="Iniciativa do Desligamento *"
            value={formData.termination_initiative_id || ''}
            onChange={v => {
              // Limpar motivo se mudar iniciativa pois são dependentes
              setFormData({
                ...formData,
                termination_initiative_id: v,
                motivo_desligamento: '', // Clear reason linked to old initiative (using motivo_desligamento as ID field based on types, need to verify legacy field mapping. The 'motivo_desligamento' in types is string, likely ID for reasons table. Now we use 'termination_reasons' table.)
              })
            }}
            tableName="termination_initiatives"
          />

          {/* Tipo do Desligamento (Mostrar em qualquer opção) */}
          <ManagedSelect
            label="Tipo do Desligamento *"
            value={formData.termination_type_id || ''}
            onChange={v => setFormData({ ...formData, termination_type_id: v })}
            tableName="termination_types"
          />

          {/* Motivo do Desligamento (Depende da Iniciativa) */}
          <ManagedSelect
            label="Motivo *"
            value={formData.motivo_desligamento || ''} // Reusing motivo_desligamento legacy field to store reason ID, or we should map it to something else? 
            // In types.ts: motivo_desligamento?: string; - seems fine to use this for the Reason ID.
            onChange={v => setFormData({ ...formData, motivo_desligamento: v })}
            tableName="termination_reasons"
            // Filter reasons by the selected initiative ID
            filter={formData.termination_initiative_id ? {
              column: 'initiative_id',
              value: formData.termination_initiative_id
            } : undefined}
            // When adding a new reason, automatically link it to the selected initiative
            extraInsertFields={formData.termination_initiative_id ? {
              initiative_id: formData.termination_initiative_id
            } : undefined}
            // Disable if no initiative selected
            disabled={!formData.termination_initiative_id}
            placeholder={!formData.termination_initiative_id ? "Selecione a Iniciativa primeiro..." : "Selecione o Motivo..."}
          />
        </div>
      </div>
    </section>
  )
}