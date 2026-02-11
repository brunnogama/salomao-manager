// src/components/collaborators/components/DadosCorporativosSection.tsx
import { Briefcase } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria' // Importação atualizada
import { SearchableSelect } from '../../crm/SearchableSelect'

interface DadosCorporativosSectionProps {
  formData: Partial<Collaborator> // Interface atualizada
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

        {/* Status - Atualizado para os valores em inglês do banco */}
        <SearchableSelect 
          label="Status" 
          value={formData.status || ''} 
          onChange={v => setFormData({ ...formData, status: v as 'active' | 'inactive' })} 
          options={[{ name: 'Ativo', id: 'active' }, { name: 'Inativo', id: 'inactive' }]} 
        />

        {/* Sócio Responsável - NOVO CAMPO */}
        <SearchableSelect 
          label="Sócio Responsável" 
          value={formData.partner_id || ''} 
          onChange={v => setFormData({ ...formData, partner_id: v })} 
          table="partners" // Busca direto da nova tabela de sócios
          onRefresh={handleRefresh} 
        />

        {/* Equipe */}
        <SearchableSelect 
          label="Equipe" 
          value={formData.equipe || ''} // Manter conforme sua tabela de opções
          onChange={v => setFormData({ ...formData, equipe: v })} 
          table="opcoes_equipes" 
          onRefresh={handleRefresh} 
        />

        {/* Cargo - Mapeado para 'role' */}
        <SearchableSelect 
          label="Cargo" 
          value={formData.role || ''} 
          onChange={v => setFormData({ ...formData, role: v })} 
          table="opcoes_cargos" 
          onRefresh={handleRefresh} 
        />

        {/* Local */}
        <SearchableSelect 
          label="Local" 
          value={formData.local || ''} 
          onChange={v => setFormData({ ...formData, local: v })} 
          table="opcoes_locais" 
          onRefresh={handleRefresh} 
        />

        {/* Líder */}
        <SearchableSelect 
          label="Líder" 
          value={formData.lider_equipe || ''} 
          onChange={v => setFormData({ ...formData, lider_equipe: v })} 
          table="opcoes_lideres" 
          onRefresh={handleRefresh} 
        />

        {/* Data de Admissão - Mapeado para 'hire_date' */}
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

        {/* Data de Desligamento - Mapeado para 'termination_date' */}
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
      </div>
    </section>
  )
}