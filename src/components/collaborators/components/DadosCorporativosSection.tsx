import { useState, useMemo, useEffect } from 'react'
import { Briefcase, Calendar, Clock, Crown, GraduationCap, MapPin, AlertTriangle } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { ManagedMultiSelect } from '../../crm/ManagedMultiSelect'
import { SearchableMultiSelect } from '../../crm/SearchableMultiSelect'
import { differenceInMonths, differenceInYears } from 'date-fns'
import { TransporteSection } from './TransporteSection'
import { supabase } from '../../../lib/supabase'
import { getInternScholarshipValue, formatDbMoneyToDisplay } from '../utils/colaboradoresUtils'
import { AlertModal } from '../../../components/ui/AlertModal'
import { ATUACOES_ADMINISTRATIVA, CARGOS_ADMINISTRATIVA, ATUACOES_JURIDICA, CARGOS_JURIDICA, ATUACOES_TERCEIRIZADA, CARGOS_TERCEIRIZADA } from '../utils/cargosAtuacoesUtils'

interface DadosCorporativosSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskDate: (value: string) => string
  isViewMode?: boolean
}

export function DadosCorporativosSection({
  formData,
  setFormData,
  maskDate,
  isViewMode = false
}: DadosCorporativosSectionProps) {
  const [activeTab, setActiveTab] = useState<'contratacao' | 'desligamento' | 'historico'>('contratacao')
  const [originalStatus] = useState(formData.status)
  const [pendingReactivation, setPendingReactivation] = useState(false)
  const [readmissionDate, setReadmissionDate] = useState('')

  const [exitInterview, setExitInterview] = useState<any>(null)
  const [refreshInterview, setRefreshInterview] = useState(0)
  
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean, title: string, description: string, variant: 'warning'|'error'|'success'|'info' } | null>(null);

  // Fetch Existing Interview status
  useEffect(() => {
    async function fetchInterview() {
      if (!formData.id) return;
      
      const { data, error } = await supabase
        .from('exit_interviews')
        .select('*')
        .eq('collaborator_id', formData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setExitInterview(data);
      }
    }
    fetchInterview();
  }, [formData.id, refreshInterview])

  const [roleName, setRoleName] = useState<string>('')

  const [refMaps, setRefMaps] = useState<{
    rateios: Record<string, string>,
    hiring_reasons: Record<string, string>,
    termination_reasons: Record<string, string>,
    termination_types: Record<string, string>,
    termination_initiatives: Record<string, string>,
    roles: Record<string, string>
  }>({ rateios: {}, hiring_reasons: {}, termination_reasons: {}, termination_types: {}, termination_initiatives: {}, roles: {} });

  // Fetch reference names for historical cycles
  useEffect(() => {
    async function fetchRefMaps() {
      if (!formData.employment_cycles || formData.employment_cycles.length === 0) return;
      
      const r_res = await supabase.from('rateios').select('id, name');
      const hr_res = await supabase.from('hiring_reasons').select('id, name');
      const tr_res = await supabase.from('termination_reasons').select('id, name');
      const tt_res = await supabase.from('termination_types').select('id, name');
      const ti_res = await supabase.from('termination_initiatives').select('id, name');
      const ro_res = await supabase.from('roles').select('id, name');
      
      const toMap = (arr: any[]) => arr?.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.name }), {}) || {};
      
      setRefMaps({
        rateios: toMap(r_res.data || []),
        hiring_reasons: toMap(hr_res.data || []),
        termination_reasons: toMap(tr_res.data || []),
        termination_types: toMap(tt_res.data || []),
        termination_initiatives: toMap(ti_res.data || []),
        roles: toMap(ro_res.data || [])
      });
    }
    fetchRefMaps();
  }, [formData.employment_cycles]);

  // Fetch role name when role ID changes
  useEffect(() => {
    async function fetchRoleName() {
      if (!formData.role) {
        setRoleName('')
        return
      }
      const { data, error } = await supabase
        .from('roles')
        .select('name')
        .eq('id', formData.role)
        .single()

      if (data && !error) {
        setRoleName(data.name)
      } else {
        setRoleName('')
      }
    }
    fetchRoleName()
  }, [formData.role])

  const isSocio = useMemo(() => {
    return roleName.toLowerCase().includes('sócio') || roleName.toLowerCase().includes('socio')
  }, [roleName])



  const isEstagiario = useMemo(() => {
    return roleName.toLowerCase().includes('estagiário') || roleName.toLowerCase().includes('estagiario') || formData.contract_type?.toUpperCase() === 'ESTAGIÁRIO'
  }, [roleName, formData.contract_type])

  // Calculate Intern Scholarship Automatically
  const [isCalculatingScholarship, setIsCalculatingScholarship] = useState(false)
  useEffect(() => {
    const calculateScholarship = async () => {
      if (!isEstagiario || formData.area !== 'Jurídica' || !formData.hire_date || !formData.education_history || isViewMode) {
        return;
      }

      setIsCalculatingScholarship(true);
      try {
        const valueStr = await getInternScholarshipValue(formData.hire_date, formData.education_history);
        if (valueStr !== null && valueStr !== undefined) {
          const formatted = formatDbMoneyToDisplay(valueStr);
          // Only update if it's different to avoid infinite loop
          if (formData.bolsa_valor !== formatted) {
            setFormData({ ...formData, bolsa_valor: formatted });
          }
        }
      } catch (error) {
        console.error("Failed to auto calculate scholarship", error);
      } finally {
        setIsCalculatingScholarship(false);
      }
    };

    calculateScholarship();
  }, [formData.hire_date, formData.education_history, isEstagiario, formData.area, isViewMode]);

  // Calculate duration if dates are available
  const duration = useMemo(() => {
    if (!formData.hire_date || !formData.termination_date) return null
    if (formData.hire_date.length !== 10 || formData.termination_date.length !== 10) return null

    try {
      // Assuming dd/mm/yyyy format from input mask
      const [hDay, hMonth, hYear] = formData.hire_date.split('/').map(Number)
      const [tDay, tMonth, tYear] = formData.termination_date.split('/').map(Number)

      const start = new Date(hYear, hMonth - 1, hDay)
      const end = new Date(tYear, tMonth - 1, tDay)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

      const years = differenceInYears(end, start)
      const months = differenceInMonths(end, start) % 12

      return { years, months }
    } catch (e) {
      return null
    }
  }, [formData.hire_date, formData.termination_date])

  return (
    <section className="space-y-6">
      {pendingReactivation && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-gradient-to-r from-[#112240] to-[#1e3a8a] flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-black text-base tracking-tight">Reativar e Readmitir</h3>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6 text-center">
                Você está prestes a reativar {formData.name?.split(' ')[0] || 'o integrante'}.<br/>Por favor, informe a <span className="font-bold text-[#1e3a8a]">nova data de readmissão</span> para gravar o ciclo atual no histórico.
              </p>
              
              <div className="mb-6 space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Data de Readmissão</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-9 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none transition-all font-bold text-center tracking-widest"
                    value={readmissionDate}
                    onChange={e => setReadmissionDate(maskDate(e.target.value))}
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => setPendingReactivation(false)}
                  className="flex-1 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={readmissionDate.length !== 10}
                  onClick={() => {
                    const now = new Date();
                    const dateStr = now.toLocaleDateString('pt-BR');
                    const reactivationMsg = `[${dateStr}] Readmissão: O integrante foi readmitido com data inicial de ${readmissionDate}.\n\n`;
                    
                    // Snapshot the current contract
                    const snapshot = {
                      hire_date: formData.hire_date || null,
                      role: formData.role || null,
                      rateio_id: formData.rateio_id || null,
                      hiring_reason_id: formData.hiring_reason_id || null,
                      partner_ids: formData.partner_ids || [],
                      leader_ids: formData.leader_ids || [],
                      contract_type: formData.contract_type || null,
                      termination_date: formData.termination_date || null,
                      termination_reason_id: formData.termination_reason_id || null,
                      termination_type_id: formData.termination_type_id || null,
                      termination_initiative_id: formData.termination_initiative_id || null,
                      motivo_desligamento: formData.motivo_desligamento || null,
                    };
                    
                    const oldCycles = formData.employment_cycles || [];
                    
                    setFormData({
                      ...formData,
                      status: 'active',
                      employment_cycles: [snapshot, ...oldCycles],
                      history_observations: reactivationMsg + (formData.history_observations || ''),
                      // Reset old values for the new cycle
                      hire_date: readmissionDate,
                      termination_date: '',
                      termination_reason_id: '',
                      termination_type_id: '',
                      termination_initiative_id: '',
                      motivo_desligamento: ''
                    });
                    
                    setPendingReactivation(false);
                    setReadmissionDate('');
                    setActiveTab('contratacao');
                  }}
                  className="flex-1 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md active:scale-95"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <Briefcase className="h-4 w-4" /> Dados Corporativos
      </h3>

      {/* STATUS MENU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SearchableSelect
          label="Status"
          value={formData.status || 'active'}
          onChange={(v) => {
            const newStatus = v as 'active' | 'inactive' | 'Pré-Cadastro';
            if (originalStatus === 'inactive' && newStatus === 'active') {
              setPendingReactivation(true);
              return;
            }
            setFormData({ ...formData, status: newStatus as any });
            if (newStatus === 'inactive') setActiveTab('desligamento');
          }}
          options={[
            { name: 'Ativo', id: 'active' },
            { name: 'Pré-Cadastro (Aprovado em Vaga)', id: 'Pré-Cadastro' },
            { name: 'Inativo', id: 'inactive' }
          ]}
          uppercase={false}
          disabled={isViewMode}
        />

        <ManagedSelect
          label="Candidato Vinculado (ID / Histórico)"
          value={formData.candidato_id || ''}
          onChange={v => setFormData({ ...formData, candidato_id: v })}
          tableName="candidatos"
          orderBy="nome"
          nameColumn="nome"
          disabled={isViewMode}
        />

        <div className="flex items-center gap-3 md:pt-6">
          <input
            type="checkbox"
            id="is_team_leader"
            className={`w-4 h-4 text-[#1e3a8a] bg-white border-gray-300 rounded outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all ${isViewMode ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            checked={!!formData.is_team_leader}
            onChange={e => setFormData({ ...formData, is_team_leader: e.target.checked })}
            disabled={isViewMode}
          />
          {formData.is_team_leader ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] rounded-full shadow-sm border border-blue-800/20 relative group transition-all animate-in zoom-in-95 duration-200">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
              <Crown className="w-3.5 h-3.5 text-blue-100 drop-shadow-sm" />
              <span className="text-[10px] font-black text-white tracking-widest uppercase drop-shadow-sm select-none">
                Líder de Equipe
              </span>
            </div>
          ) : (
            <label htmlFor="is_team_leader" className={`text-sm font-medium text-gray-400 select-none ${isViewMode ? 'cursor-not-allowed' : 'cursor-pointer'} hover:text-[#1e3a8a] transition-colors`}>
              Marcar como Líder
            </label>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('contratacao')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'contratacao'
            ? 'bg-white text-[#1e3a8a] shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          Contratação
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('desligamento')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'desligamento'
            ? 'bg-white text-red-700 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          Desligamento
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'contratacao' ? (
          /* CONTRATAÇÃO TAB */
          <div className="bg-blue-50/30 p-6 rounded-xl space-y-6 border border-blue-100/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <ManagedSelect
                label="Rateio"
                value={formData.rateio_id || ''}
                onChange={v => setFormData({ ...formData, rateio_id: v })}
                tableName="rateios"
                placeholder="Selecione..."
                disabled={isViewMode}
              />

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Admissão</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className={`w-full pl-9 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={formData.hire_date || ''}
                    onChange={e => setFormData({ ...formData, hire_date: maskDate(e.target.value) })}
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                    disabled={isViewMode}
                    readOnly={isViewMode}
                  />
                </div>
              </div>

              <ManagedSelect
                label="Motivo da Contratação"
                value={formData.hiring_reason_id || ''}
                onChange={v => setFormData({ ...formData, hiring_reason_id: v })}
                tableName="hiring_reasons"
                disabled={isViewMode}
              />

              {/* Row 2 */}
              <div className="md:col-span-1">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">E-mail Corporativo</label>
                <input
                  className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  disabled={isViewMode}
                  readOnly={isViewMode}
                />
              </div>

              <ManagedMultiSelect
                label="Sócios Responsáveis"
                value={formData.partner_ids || []}
                onChange={v => setFormData({ ...formData, partner_ids: v })}
                tableName="partners"
                disabled={isViewMode}
              />

              <ManagedMultiSelect
                label="Líderes Diretos"
                value={formData.leader_ids || []}
                onChange={v => setFormData({ ...formData, leader_ids: v })}
                tableName="collaborators"
                disabled={isViewMode}
              />



              {/* Row 3 */}
              <SearchableSelect
                label="Área"
                value={formData.area || ''}
                onChange={(v) => {
                  setFormData({
                    ...formData,
                    area: v as any,
                    role: '' // Clear role when area changes to avoid conflicts
                  })
                }}
                options={[
                  { id: 'Administrativa', name: 'Administrativa' },
                  { id: 'Jurídica', name: 'Jurídica' },
                  { id: 'Terceirizada', name: 'Terceirizada' }
                ]}
                uppercase={false}
                disabled={isViewMode}
              />

              <SearchableMultiSelect
                label="Atuação"
                value={formData.atuacao || ''}
                onChange={v => setFormData({ ...formData, atuacao: v })}
                table="atuacoes"
                disabled={isViewMode}
                allowCustom={true}
                clientFilter={(item: any) => {
                  const name = item.name || item;
                  if (formData.area === 'Jurídica') return ATUACOES_JURIDICA.includes(name);
                  if (formData.area === 'Administrativa') return ATUACOES_ADMINISTRATIVA.includes(name);
                  if (formData.area === 'Terceirizada') return ATUACOES_TERCEIRIZADA.includes(name);
                  return true;
                }}
              />

              <ManagedSelect
                label="Cargo/Classe"
                value={formData.role || ''}
                onChange={v => setFormData({ ...formData, role: v })}
                tableName="roles"
                manageColumns={[{
                  key: 'area',
                  label: 'Área',
                  type: 'select',
                  options: [
                    { id: 'Jurídica', name: 'Jurídica' },
                    { id: 'Administrativa', name: 'Administrativa' },
                    { id: 'Terceirizada', name: 'Terceirizada' },
                    { id: 'Ambas', name: 'Ambas' }
                  ]
                }]}
                clientFilter={(item: any) => {
                  if (!formData.area) return true;
                  if (item.area) return item.area === formData.area || item.area === 'Ambas' || item.area === 'Ambos';
                  
                  const roleName = item.name;
                  if (formData.area === 'Jurídica') return CARGOS_JURIDICA.includes(roleName);
                  if (formData.area === 'Administrativa') return CARGOS_ADMINISTRATIVA.includes(roleName);
                  if (formData.area === 'Terceirizada') return CARGOS_TERCEIRIZADA.includes(roleName);
                  return true;
                }}
                disabled={isViewMode}
              />

              {formData.original_role && formData.original_role !== formData.role && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest">Data da Mudança de Cargo/Classe</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, original_role: formData.role, role_change_date: '' })}
                      className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-tighter"
                    >
                      Remover Agendamento
                    </button>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1e3a8a]" />
                    <input
                      className={`w-full pl-9 bg-blue-50/50 border border-blue-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                      value={formData.role_change_date || ''}
                      onChange={e => setFormData({ ...formData, role_change_date: maskDate(e.target.value) })}
                      maxLength={10}
                      placeholder="DD/MM/AAAA"
                      disabled={isViewMode}
                      readOnly={isViewMode}
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1 font-medium">
                    Informe a data em que o integrante assumirá o novo cargo/classe.
                  </p>
                </div>
              )}

              <div className="animate-in fade-in duration-300">
                <SearchableSelect
                  label="Tipo de Vínculo"
                  value={formData.contract_type || ''}
                  onChange={(v) => setFormData({ ...formData, contract_type: v })}
                  options={[
                    { id: 'ADVOGADO ASSOCIADO', name: 'ADVOGADO ASSOCIADO' },
                    { id: 'CLT', name: 'CLT' },
                    { id: 'ESTAGIÁRIO', name: 'ESTAGIÁRIO' },
                    { id: 'JOVEM APRENDIZ', name: 'JOVEM APRENDIZ' },
                    { id: 'PJ', name: 'PJ' },
                    { id: 'Sócio Administrador', name: 'Sócio Administrador' },
                    { id: 'Sócio de Capital', name: 'Sócio de Capital' },
                    { id: 'Sócio de Serviço', name: 'Sócio de Serviço' },
                    { id: 'TERCEIRIZADO', name: 'TERCEIRIZADO' }
                  ]}
                  uppercase={false}
                  disabled={isViewMode}
                  icon={isSocio ? <Crown className="w-3 h-3 text-amber-500" /> : undefined}
                />
              </div>

              {/* Row 4 */}
              <ManagedSelect
                label="Local"
                value={formData.local || ''}
                onChange={v => setFormData({ ...formData, local: v })}
                tableName="locations"
                disabled={isViewMode}
              />

              <div className="md:col-span-1 animate-in fade-in slide-in-from-right-2 duration-300">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2" title="Código da Mesa no Mapa Físico">Posto (Mesa)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    className={`w-full pl-9 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-bold uppercase tracking-wider ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={formData.posto || ''}
                    onChange={e => setFormData({ ...formData, posto: e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase() })}
                    placeholder="Ex: J19"
                    maxLength={5}
                    disabled={isViewMode}
                    readOnly={isViewMode}
                  />
                </div>
              </div>

              {isEstagiario && (
                <div className="md:col-span-3 bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 p-5 rounded-xl mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Dados do Estágio
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Término do contrato</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1e3a8a]" />
                        <input
                          className={`w-full pl-9 bg-white border border-blue-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                          value={formData.termino_contrato_estagio || ''}
                          onChange={e => setFormData({ ...formData, termino_contrato_estagio: maskDate(e.target.value) })}
                          maxLength={10}
                          placeholder="DD/MM/AAAA"
                          disabled={isViewMode}
                          readOnly={isViewMode}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Previsão de Formatura</label>
                      <input
                        className={`w-full bg-white border border-blue-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                        value={formData.previsao_formatura || ''}
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 6) val = val.slice(0, 6);
                          if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                          setFormData({ ...formData, previsao_formatura: val });
                        }}
                        maxLength={7}
                        placeholder="MM/AAAA"
                        disabled={isViewMode}
                        readOnly={isViewMode}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2 flex items-center justify-between">
                        <span>Bolsa</span>
                        {isCalculatingScholarship && <span className="text-[8px] text-amber-500 normal-case">(calculando...)</span>}
                        {(!isCalculatingScholarship && formData.area === 'Jurídica') && <span className="text-[8px] text-emerald-600 normal-case">(Tabela)</span>}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
                        <input
                          className={`w-full pl-9 bg-white border border-blue-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''} ${formData.area === 'Jurídica' ? 'bg-emerald-50/30' : ''}`}
                          value={formData.bolsa_valor || ''}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (!val) {
                              setFormData({ ...formData, bolsa_valor: '' });
                              return;
                            }
                            const num = Number(val) / 100;
                            const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
                            setFormData({ ...formData, bolsa_valor: formatted });
                          }}
                          placeholder="0,00"
                          disabled={isViewMode}
                          readOnly={isViewMode}
                          title={formData.area === 'Jurídica' ? "Valor sugerido automaticamente pela tabela de regras para estagiários da área Jurídica." : undefined}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2">VR</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
                        <input
                          className={`w-full pl-9 bg-white border border-blue-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                          value={formData.vr_valor || ''}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (!val) {
                              setFormData({ ...formData, vr_valor: '' });
                              return;
                            }
                            const num = Number(val) / 100;
                            const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
                            setFormData({ ...formData, vr_valor: formatted });
                          }}
                          placeholder="0,00"
                          disabled={isViewMode}
                          readOnly={isViewMode}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* HORÁRIO DE TRABALHO */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Horário de Trabalho
              </h4>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Entrada</label>
                  <input
                    type="time"
                    className={`w-full bg-blue-50/50 border border-blue-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={formData.work_schedule_start || ''}
                    onChange={e => setFormData({ ...formData, work_schedule_start: e.target.value })}
                    disabled={isViewMode}
                    readOnly={isViewMode}
                  />
                </div>

                <span className="text-gray-400 font-bold self-end mb-3px md:mb-3">às</span>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2">Saída</label>
                  <input
                    type="time"
                    className={`w-full bg-blue-50/50 border border-blue-200 text-[#0a192f] text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={formData.work_schedule_end || ''}
                    onChange={e => setFormData({ ...formData, work_schedule_end: e.target.value })}
                    disabled={isViewMode}
                    readOnly={isViewMode}
                  />
                </div>
              </div>
            </div>



            <TransporteSection
              transportes={formData.transportes || []}
              setTransportes={(t) => setFormData({ ...formData, transportes: t })}
              isViewMode={isViewMode}
            />

            {/* HISTÓRICO DE READMISSÕES / CICLOS PASSADOS */}
            {(formData.employment_cycles && formData.employment_cycles.length > 0) && (
              <div className="mt-8 border-t border-blue-200/50 pt-8 animate-in fade-in duration-500">
                <h4 className="text-[12px] font-black text-[#1e3a8a] uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> Ciclos de Contratação Anteriores
                </h4>
                <div className="space-y-4">
                  {formData.employment_cycles.map((cycle, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gray-200 group-hover:bg-[#1e3a8a] transition-colors" />
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b border-gray-100 pb-4 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Ciclo Fechado #{formData.employment_cycles!.length - idx}
                          </p>
                          <h5 className="font-bold text-[#0a192f] mt-1 text-sm uppercase">
                            {cycle.contract_type || 'Contrato Padrão'} {cycle.role ? `- ${refMaps.roles[cycle.role] || cycle.role}` : ''}
                          </h5>
                        </div>
                        <div className="text-left sm:text-right bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Período de Atuação</p>
                          <p className="font-bold text-[#1e3a8a] text-xs">
                            {cycle.hire_date || 'N/D'} <span className="text-gray-400 font-medium mx-1">até</span> {cycle.termination_date || 'N/D'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block text-gray-400 text-[9px] uppercase tracking-wider font-bold mb-1">Rateio Base</span>
                          <span className="font-medium text-gray-700">{refMaps.rateios[cycle.rateio_id] || cycle.rateio_id || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-[9px] uppercase tracking-wider font-bold mb-1">Motivo Contratação</span>
                          <span className="font-medium text-gray-700">{refMaps.hiring_reasons[cycle.hiring_reason_id] || cycle.hiring_reason_id || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'desligamento' ? (
          /* DESLIGAMENTO TAB */
          <div className="space-y-6">
            <div className="bg-red-50/30 p-6 rounded-xl space-y-6 border border-red-100/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Data Desligamento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      className={`w-full pl-9 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                      value={formData.termination_date || ''}
                      onChange={e => setFormData({ ...formData, termination_date: maskDate(e.target.value) })}
                      maxLength={10}
                      placeholder="DD/MM/AAAA"
                      disabled={isViewMode}
                      readOnly={isViewMode}
                    />
                  </div>
                </div>

                <ManagedSelect
                  label="Iniciativa do Desligamento"
                  value={formData.termination_initiative_id || ''}
                  onChange={v => {
                    setFormData({
                      ...formData,
                      termination_initiative_id: v,
                      termination_reason_id: '',
                    })
                  }}
                  tableName="termination_initiatives"
                  disabled={isViewMode}
                />

                <ManagedSelect
                  label="Tipo do Desligamento"
                  value={formData.termination_type_id || ''}
                  onChange={v => setFormData({ ...formData, termination_type_id: v })}
                  tableName="termination_types"
                  disabled={isViewMode}
                />

                <ManagedSelect
                  label="Motivo"
                  value={formData.termination_reason_id || ''}
                  onChange={v => setFormData({ ...formData, termination_reason_id: v })}
                  tableName="termination_reasons"
                  filter={formData.termination_initiative_id ? {
                    column: 'initiative_id',
                    value: formData.termination_initiative_id
                  } : undefined}
                  extraInsertFields={formData.termination_initiative_id ? {
                    initiative_id: formData.termination_initiative_id
                  } : undefined}
                  disabled={!formData.termination_initiative_id || isViewMode}
                  placeholder={!formData.termination_initiative_id ? "Selecione a Iniciativa primeiro..." : "Selecione o Motivo..."}
                />
              </div>
            </div>

            {/* Formulário de Desligamento via Link Mágico */}
            {formData.id && (
              <div className="bg-[#1e3a8a]/5 p-6 rounded-xl border border-[#1e3a8a]/20 shadow-sm animate-in zoom-in-95 duration-500 mt-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertTriangle className="w-24 h-24 text-[#1e3a8a]" />
                </div>
                <h4 className="text-[12px] font-black text-[#1e3a8a] uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                  <AlertTriangle className="h-5 w-5" /> Formulário de Desligamento
                </h4>
                <p className="text-[10px] text-gray-600 font-medium mb-6 relative z-10 max-w-xl leading-relaxed">
                  Gere o link único do formulário de avaliação para o integrante. O modelo das perguntas é adaptado automaticamente pelo RH de acordo com o vínculo <span className="font-bold">({formData.contract_type || 'Estagiário'})</span>.
                </p>
                <div className="relative z-10 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.id) return;
                      const btn = document.getElementById('btn-magic-link-desligamento');
                      if (btn) btn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Gerando...';
                      try {
                        const { data: template, error: tmplError } = await supabase
                          .from('form_templates')
                          .select('id')
                          .ilike('vinculo_type', formData.contract_type || 'Estagiário')
                          .limit(1)
                          .maybeSingle();
                        
                        if (tmplError || !template) {
                           setAlertInfo({
                               isOpen: true,
                               title: 'Atenção',
                               description: `Nenhum modelo de formulário ativo encontrado para este tipo de vínculo (${formData.contract_type || 'Estagiário'}).\n\nCrie ou configure um modelo na aba de Configurações do Manager primeiro.`,
                               variant: 'warning'
                           });
                           if (btn) btn.innerHTML = 'Gerar Link do Formulário em Nova Aba';
                           return;
                        }

                        let tokenStr = '';
                        const { data: existing, error: existErr } = await supabase
                          .from('exit_interviews')
                          .select('token')
                          .eq('collaborator_id', formData.id)
                          .maybeSingle();
                        
                        if (existing) {
                           tokenStr = existing.token;
                        } else {
                           const { data, error } = await supabase
                             .from('exit_interviews')
                             .insert({
                                collaborator_id: formData.id,
                                template_id: template.id
                             })
                             .select('token')
                             .single();
                           if (error) throw error;
                           tokenStr = data?.token;
                        }
                        
                        setRefreshInterview(r => r + 1);
                        
                        const url = `${window.location.origin}/desligamento/${tokenStr}`;
                        await navigator.clipboard.writeText(url);
                        window.open(url, '_blank');
                        if (btn) btn.innerHTML = '✓ Link Copiado e Aberto!';
                        setTimeout(() => {
                           if (btn) btn.innerHTML = 'Gerar e Copiar Link Mágico Novamente';
                        }, 4000);
                      } catch (err: any) {
                        console.error('Erro ao gerar formulário de desligamento:', err);
                        setAlertInfo({
                           isOpen: true,
                           title: 'Erro de Geração',
                           description: 'Ocorreu um erro ao gerar o Link Mágico. Detalhes técnicos:\n' + err.message,
                           variant: 'error'
                        });
                        if (btn) btn.innerHTML = 'Tentar Novamente';
                      }
                    }}
                    id="btn-magic-link-desligamento"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-[11px] font-black tracking-[0.2em] uppercase rounded-xl shadow-lg shadow-[#1e3a8a]/20 text-white bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] hover:scale-[1.02] hover:shadow-xl active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a8a]"
                  >
                    Gerar e Copiar Link Mágico
                  </button>
                  {exitInterview?.status === 'pending' && (
                     <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-3 rounded-xl border border-amber-100 text-xs font-bold w-full sm:w-auto">
                        <Clock className="w-4 h-4 shrink-0" />
                        Formulário Gerado e Aguardando Resposta
                     </div>
                  )}
                </div>
                
                {exitInterview?.status === 'completed' && (
                  <div className="mt-6 space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white p-5 rounded-xl border border-emerald-100 text-sm shadow-sm">
                       <div className="flex items-center gap-2 mb-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Clock className="w-4 h-4" />
                         </div>
                         <div>
                           <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Status do Link Mágico</p>
                           <p className="text-emerald-700 font-bold">Respostas salvas em: {new Date(exitInterview.completed_at).toLocaleDateString()}</p>
                         </div>
                       </div>
                       <p className="text-gray-600 text-xs pl-10 border-l-2 border-emerald-50 ml-4">
                         As respostas desta entrevista estão disponíveis na base de dados de People Analytics e serão utilizadas nos novos painéis gerenciais (Turnover).
                       </p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                         <Crown className="w-4 h-4" /> Observações do RH (Notas Internas)
                       </label>
                       <div className="flex flex-col sm:flex-row items-end gap-3">
                         <textarea
                           className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 transition-all resize-y"
                           rows={3}
                           placeholder="Anotações internas do RH sobre esta entrevista (apenas visão gerencial)..."
                           defaultValue={exitInterview.rh_notes || ''}
                           id={`rh-notes-${exitInterview.id}`}
                         />
                         <button
                           type="button"
                           onClick={async () => {
                              const notes = (document.getElementById(`rh-notes-${exitInterview.id}`) as HTMLTextAreaElement)?.value;
                              const btn = document.getElementById(`btn-rh-notes-${exitInterview.id}`);
                              if (btn) btn.innerText = '⏳';
                              await supabase.from('exit_interviews').update({ rh_notes: notes }).eq('id', exitInterview.id);
                              if (btn) btn.innerText = '✓ Salvo';
                              setTimeout(() => { if (btn) btn.innerText = 'Salvar Notas'; }, 2000);
                           }}
                           id={`btn-rh-notes-${exitInterview.id}`}
                           className="w-full sm:w-auto shrink-0 bg-[#0a192f] text-white px-6 py-3 rounded-xl font-bold tracking-widest text-[10px] uppercase hover:bg-[#112240] transition-colors shadow-lg"
                         >
                           Salvar Notas
                         </button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TIMELINE */}
            {formData.termination_date && duration && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in zoom-in-95 duration-500 mt-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Linha do Tempo
                </h4>

                <div className="relative px-4 pb-2">
                  {/* Line Background */}
                  <div className="absolute top-2.5 left-0 w-full h-0.5 bg-gray-200 rounded-full" />

                  {/* Duration Badge (Centered) */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm z-10">
                    <p className="text-[10px] font-black uppercase text-gray-500 whitespace-nowrap">
                      {duration.years > 0 && `${duration.years} ano${duration.years > 1 ? 's' : ''}`}
                      {duration.years > 0 && duration.months > 0 && ' e '}
                      {duration.months > 0 && `${duration.months} m${duration.months > 1 ? 'eses' : 'ês'}`}
                      {duration.years === 0 && duration.months === 0 && 'Recente'}
                    </p>
                  </div>

                  <div className="flex justify-between relative z-0">
                    {/* Start Point */}
                    <div className="flex flex-col items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-[#1e3a8a] ring-4 ring-white relative z-10 shadow-sm" />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Admissão</p>
                        <p className="text-sm font-bold text-[#1e3a8a]">{formData.hire_date}</p>
                      </div>
                    </div>

                    {/* End Point */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="w-5 h-5 rounded-full bg-red-500 ring-4 ring-white relative z-10 shadow-sm" />
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Desligamento</p>
                        <p className="text-sm font-bold text-red-600">{formData.termination_date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HISTÓRICO DE DESLIGAMENTOS (CICLOS PASSADOS) */}
            {(formData.employment_cycles && formData.employment_cycles.length > 0) && (
              <div className="mt-8 border-t border-red-200/50 pt-8 animate-in fade-in duration-500">
                <h4 className="text-[12px] font-black text-red-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Histórico de Desligamentos
                </h4>
                <div className="space-y-4">
                  {formData.employment_cycles.map((cycle, idx) => (
                    <div key={idx} className="bg-white border border-red-100 rounded-xl p-6 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-200 group-hover:bg-red-500 transition-colors" />
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b border-gray-100 pb-4 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Desligamento do Ciclo #{formData.employment_cycles!.length - idx}
                          </p>
                          <h5 className="font-bold text-[#0a192f] mt-1 text-sm uppercase">
                            {cycle.contract_type || 'Contrato Padrão'} {cycle.role ? `- ${refMaps.roles[cycle.role] || cycle.role}` : ''}
                          </h5>
                        </div>
                        <div className="text-left sm:text-right bg-red-50/50 p-2 rounded-lg border border-red-100">
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Data</p>
                          <p className="font-bold text-red-700 text-xs">
                            {cycle.termination_date || 'Não informada'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="block text-gray-400 text-[9px] uppercase tracking-wider font-bold mb-1">Iniciativa</span>
                          <span className="font-medium text-gray-700">{refMaps.termination_initiatives[cycle.termination_initiative_id] || cycle.termination_initiative_id || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-[9px] uppercase tracking-wider font-bold mb-1">Tipo</span>
                          <span className="font-medium text-gray-700">{refMaps.termination_types[cycle.termination_type_id] || cycle.termination_type_id || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-[9px] uppercase tracking-wider font-bold mb-1">Motivo</span>
                          <span className="font-medium text-gray-700">{refMaps.termination_reasons[cycle.termination_reason_id] || cycle.termination_reason_id || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-[9px] uppercase tracking-wider font-bold mb-1">Detalhes Extras</span>
                          <span className="font-medium text-gray-700">{cycle.motivo_desligamento || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {alertInfo && (
        <AlertModal
          isOpen={alertInfo.isOpen}
          onClose={() => setAlertInfo(null)}
          title={alertInfo.title}
          description={alertInfo.description}
          variant={alertInfo.variant}
          confirmText="Entendi"
        />
      )}
    </section>
  )
}
