// src/components/collaborators/components/DadosCorporativosSection.tsx
import { Briefcase } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'

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

        {/* Data de Desligamento */}
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