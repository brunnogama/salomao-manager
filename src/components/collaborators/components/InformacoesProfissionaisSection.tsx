import { GraduationCap, Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Colaborador } from '../../../types/colaborador'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

const ESTADOS_BRASIL_UF = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

interface InformacoesProfissionaisSectionProps {
  formData: Partial<Colaborador>
  setFormData: (data: Partial<Colaborador>) => void
  maskDate: (value: string) => string
}

export function InformacoesProfissionaisSection({ 
  formData, 
  setFormData, 
  maskDate 
}: InformacoesProfissionaisSectionProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [statusConsulta, setStatusConsulta] = useState<'idle' | 'found' | 'not_found' | 'error'>('idle')
  const [vinculos, setVinculos] = useState<string[]>([])

  const handleConsultarCNA = async () => {
    if (!formData.oab_numero || !formData.oab_uf) {
      alert('Preencha o número da OAB e a UF.')
      return
    }

    setIsSearching(true)
    setStatusConsulta('idle')
    setVinculos([])

    try {
      const { data, error } = await supabase.functions.invoke('consulta-cna', {
        body: { 
          numero: formData.oab_numero, 
          uf: formData.oab_uf 
        }
      })

      if (error) throw error

      if (data?.sociedades && data.sociedades.length > 0) {
        setVinculos(data.sociedades)
        setStatusConsulta('found')
      } else {
        setStatusConsulta('not_found')
      }

      if (data?.nome && !formData.nome) {
        setFormData({ ...formData, nome: data.nome })
      }

    } catch (err) {
      console.error('Erro na consulta CNA:', err)
      setStatusConsulta('error')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <section className="space-y-4">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <GraduationCap className="h-4 w-4" /> Dados Profissionais
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Número OAB
          </label>
          <div className="relative flex gap-2">
            <input 
              className="flex-1 bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" 
              value={formData.oab_numero || ''} 
              onChange={e => setFormData({ ...formData, oab_numero: e.target.value })} 
              placeholder="Ex: 123456"
            />
            <button
              type="button"
              onClick={handleConsultarCNA}
              disabled={isSearching}
              className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[42px]"
              title="Consultar no CNA"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <SearchableSelect 
          label="UF OAB" 
          value={formData.oab_uf || ''} 
          onChange={v => setFormData({ ...formData, oab_uf: v.toUpperCase() })} 
          options={ESTADOS_BRASIL_UF.map(uf => ({ name: uf }))} 
          placeholder="Selecione..."
        />

        <div>
          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Vencimento OAB
          </label>
          <input 
            className="w-full bg-gray-100/50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium" 
            value={formData.oab_vencimento || ''} 
            onChange={e => setFormData({ ...formData, oab_vencimento: maskDate(e.target.value) })} 
            maxLength={10} 
            placeholder="DD/MM/AAAA" 
          />
        </div>
      </div>

      {/* Mensagens de Feedback */}
      {statusConsulta === 'found' && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Atenção: Vínculos Societários Encontrados</p>
            <ul className="text-xs text-amber-700 list-disc ml-4 mt-1">
              {vinculos.map((soc, i) => <li key={i}>{soc}</li>)}
            </ul>
          </div>
        </div>
      )}

      {statusConsulta === 'not_found' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4" /> Nenhuma outra sociedade registrada no CNA.
        </div>
      )}

      {statusConsulta === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
          <AlertCircle className="h-4 w-4" /> Erro ao consultar o CNA. Tente a consulta manual no site oficial.
        </div>
      )}
    </section>
  )
}
