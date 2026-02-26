// src/components/collaborators/components/EnderecoSection.tsx
import { MapPin } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'

const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
]

interface EnderecoSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskCEP: (value: string) => string
  handleCepBlur: () => void
  isViewMode?: boolean
}

export function EnderecoSection({
  formData,
  setFormData,
  maskCEP,
  handleCepBlur,
  isViewMode = false
}: EnderecoSectionProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <MapPin className="h-4 w-4" /> Endereço
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* CEP - Mapeado para zip_code */}
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            CEP
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.zip_code || ''}
            onChange={e => setFormData({ ...formData, zip_code: maskCEP(e.target.value) })}
            onBlur={handleCepBlur}
            maxLength={9}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Logradouro - Mapeado para address */}
        <div className="md:col-span-2">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Logradouro
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.address || ''}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Número - Mapeado para address_number */}
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Número
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.address_number || ''}
            onChange={e => setFormData({ ...formData, address_number: e.target.value })}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Complemento - Mapeado para address_complement */}
        <div className="md:col-span-1">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Complemento
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.address_complement || ''}
            onChange={e => setFormData({ ...formData, address_complement: e.target.value })}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Bairro - Mapeado para neighborhood */}
        <div className="md:col-span-1">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Bairro
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.neighborhood || ''}
            onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Cidade - Mapeado para city */}
        <div className="md:col-span-1">
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Cidade
          </label>
          <input
            className={`w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
            value={formData.city || ''}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            disabled={isViewMode}
            readOnly={isViewMode}
          />
        </div>

        {/* Estado - Mapeado para state */}
        <div className="md:col-span-1">
          <SearchableSelect
            label="Estado"
            value={formData.state || ''}
            onChange={v => setFormData({ ...formData, state: v })}
            options={ESTADOS_BRASIL.map(e => ({ name: e.nome }))}
            disabled={isViewMode}
          />
        </div>
      </div>
    </section>
  )
}