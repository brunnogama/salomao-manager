import { useState, useMemo } from 'react'
import { Briefcase, Calendar, Clock, Bus, Plus, X, AlertTriangle } from 'lucide-react'
import { Collaborator } from '../../../types/controladoria'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { ManagedSelect } from '../../crm/ManagedSelect'
import { differenceInMonths, differenceInYears } from 'date-fns'

interface DadosCorporativosSectionProps {
  formData: Partial<Collaborator>
  setFormData: (data: Partial<Collaborator>) => void
  maskDate: (value: string) => string
  isViewMode?: boolean
}

import { formatCurrency, parseCurrency, getWorkingDaysInCurrentMonth } from '../utils/colaboradoresUtils';

export function DadosCorporativosSection({
  formData,
  setFormData,
  maskDate,
  isViewMode = false
}: DadosCorporativosSectionProps) {
  const [activeTab, setActiveTab] = useState<'contratacao' | 'desligamento'>('contratacao')

  const [pendingTransportType, setPendingTransportType] = useState('');
  const [showTransporteModal, setShowTransporteModal] = useState<{
    index: number;
    type: 'ida' | 'volta';
    numValue: number;
  } | null>(null);

  const selectedTransportes = formData.transportes || [];

  const handleAddTransport = () => {
    if (!pendingTransportType) return;
    if (selectedTransportes.some(t => t.tipo === pendingTransportType)) return;

    const newTransport = {
      tipo: pendingTransportType,
      ida_qtd: 0,
      volta_qtd: 0,
      ida_valores: [],
      volta_valores: []
    };

    setFormData({ ...formData, transportes: [...selectedTransportes, newTransport] });
    setPendingTransportType('');
  };

  const handleRemoveTransport = (indexToRemove: number) => {
    const newTransportes = selectedTransportes.filter((_, idx) => idx !== indexToRemove);
    setFormData({ ...formData, transportes: newTransportes.length > 0 ? newTransportes : undefined });
  };

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

  const handleTransporteQtdChange = (index: number, type: 'ida' | 'volta', value: string) => {
    const rawVal = parseInt(value, 10);
    const numValue = isNaN(rawVal) ? 0 : rawVal;

    if (numValue > 3) {
      // Prevent automatic update and open custom modal
      setShowTransporteModal({ index, type, numValue });
      return;
    }

    applyTransporteQtd(index, type, numValue);
  };

  const applyTransporteQtd = (index: number, type: 'ida' | 'volta', numValue: number) => {
    const currentArray = [...(formData.transportes || [])];
    const transportToUpdate = { ...currentArray[index] };

    if (type === 'ida') {
      transportToUpdate.ida_qtd = numValue;
      transportToUpdate.ida_valores = adjustValuesArray(transportToUpdate.ida_valores || [], numValue);
    } else {
      transportToUpdate.volta_qtd = numValue;
      transportToUpdate.volta_valores = adjustValuesArray(transportToUpdate.volta_valores || [], numValue);
    }

    currentArray[index] = transportToUpdate;
    setFormData({ ...formData, transportes: currentArray });
  };

  const adjustValuesArray = (arr: number[], length: number) => {
    let newArray = [...arr];
    if (newArray.length > length) {
      newArray = newArray.slice(0, length);
    } else {
      while (newArray.length < length) {
        newArray.push(0);
      }
    }
    return newArray;
  };

  const handleTransporteValorChange = (index: number, type: 'ida' | 'volta', valIdx: number, value: string) => {
    const currentArray = [...(formData.transportes || [])];
    const transportToUpdate = { ...currentArray[index] };
    const numVal = parseCurrency(value);

    if (type === 'ida') {
      const vals = [...(transportToUpdate.ida_valores || [])];
      vals[valIdx] = isNaN(numVal) ? 0 : numVal;
      transportToUpdate.ida_valores = vals;
    } else {
      const vals = [...(transportToUpdate.volta_valores || [])];
      vals[valIdx] = isNaN(numVal) ? 0 : numVal;
      transportToUpdate.volta_valores = vals;
    }

    currentArray[index] = transportToUpdate;
    setFormData({ ...formData, transportes: currentArray });
  };

  const totalTransporte = selectedTransportes.reduce((acc, t) => {
    const totalIda = (t.ida_valores || []).reduce((sum, v) => sum + (v || 0), 0);
    const totalVolta = (t.volta_valores || []).reduce((sum, v) => sum + (v || 0), 0);
    return acc + totalIda + totalVolta;
  }, 0);

  const workingDays = useMemo(() => getWorkingDaysInCurrentMonth(), []);
  const monthlyTotalTransporte = totalTransporte * workingDays;

  return (
    <section className="space-y-6">
      <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
        <Briefcase className="h-4 w-4" /> Dados Corporativos
      </h3>

      {/* STATUS MENU */}
      <div className="md:w-1/3">
        <SearchableSelect
          label="Status"
          value={formData.status || 'active'}
          onChange={(v) => {
            const newStatus = v as 'active' | 'inactive';
            setFormData({ ...formData, status: newStatus });
            if (newStatus === 'inactive') setActiveTab('desligamento');
          }}
          options={[{ name: 'Ativo', id: 'active' }, { name: 'Inativo', id: 'inactive' }]}
          uppercase={false}
          disabled={isViewMode}
        />
      </div>

      {/* 1. Rateio moved below into the main grid */}

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
          disabled={formData.status !== 'inactive'}
          onClick={() => setActiveTab('desligamento')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${activeTab === 'desligamento'
            ? 'bg-white text-red-700 shadow-sm'
            : formData.status !== 'inactive' ? 'text-gray-300 cursor-not-allowed opacity-50' : 'text-gray-400 hover:text-gray-600'
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

              <ManagedSelect
                label="Sócio Responsável"
                value={formData.partner_id || ''}
                onChange={v => setFormData({ ...formData, partner_id: v })}
                tableName="partners"
                disabled={isViewMode}
              />

              <ManagedSelect
                label="Líder Direto"
                value={formData.leader_id || ''}
                onChange={v => setFormData({ ...formData, leader_id: v })}
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
                  { id: 'Jurídica', name: 'Jurídica' }
                ]}
                uppercase={false}
                disabled={isViewMode}
              />


              <ManagedSelect
                label="Equipe"
                value={formData.equipe || ''}
                onChange={v => setFormData({ ...formData, equipe: v })}
                tableName="teams"
                disabled={isViewMode}
              />

              <ManagedSelect
                label="Cargo"
                value={formData.role || ''}
                onChange={v => setFormData({ ...formData, role: v })}
                tableName="roles"
                clientFilter={(item: any) => {
                  const roleName = item.name.toLowerCase();
                  const isJuridico = roleName.includes('advogado') || roleName.includes('sócio') || roleName.includes('socio') || roleName.includes('estagiário') || roleName.includes('estagiario');
                  if (formData.area === 'Jurídica') {
                    return isJuridico;
                  } else if (formData.area === 'Administrativa') {
                    return !isJuridico;
                  }
                  return true; // if no area is selected, show all
                }}
                disabled={isViewMode}
              />

              {formData.original_role && formData.original_role !== formData.role && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest">Data da Mudança de Cargo</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: formData.original_role, role_change_date: '' })}
                      className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-tighter"
                    >
                      Cancelar Mudança
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
                    Informe a data em que o colaborador assumirá o novo cargo.
                  </p>
                </div>
              )}

              <SearchableSelect
                label="Tipo da Contratação"
                value={formData.contract_type || ''}
                onChange={(v) => setFormData({ ...formData, contract_type: v })}
                options={[
                  { id: 'ADVOGADO', name: 'ADVOGADO' },
                  { id: 'CLT', name: 'CLT' },
                  { id: 'ESTAGIÁRIO', name: 'ESTAGIÁRIO' },
                  { id: 'JOVEM APRENDIZ', name: 'JOVEM APRENDIZ' },
                  { id: 'PJ', name: 'PJ' }
                ]}
                uppercase={false}
                disabled={isViewMode}
              />

              {/* Row 4 */}
              <ManagedSelect
                label="Local"
                value={formData.local || ''}
                onChange={v => setFormData({ ...formData, local: v })}
                tableName="locations"
                disabled={isViewMode}
              />

              <ManagedSelect
                label="Centro de Custo"
                value={formData.centro_custo || ''}
                onChange={v => setFormData({ ...formData, centro_custo: v })}
                tableName="cost_centers"
                disabled={isViewMode}
              />
            </div>

            {/* Nova Seção: TRANSPORTE */}
            <div className="mt-8 pt-6 border-t border-blue-100/50">
              <h4 className="text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest flex items-center gap-2 mb-6">
                <Bus className="h-4 w-4" /> Transporte
              </h4>

              {/* Seletor de Tipo para Adicionar Novo */}
              <div className="flex flex-col gap-2 md:w-1/3 mb-6">
                <div className="relative">
                  <SearchableSelect
                    label="Adicionar Tipo de Transporte"
                    value={pendingTransportType}
                    onChange={setPendingTransportType}
                    options={[
                      { id: 'Integração BU', name: 'Integração BU' },
                      { id: 'Metrô', name: 'Metrô' },
                      { id: 'Ônibus', name: 'Ônibus' },
                      { id: 'Trem', name: 'Trem' },
                      { id: 'VLT', name: 'VLT' }
                    ]}
                    uppercase={false}
                    disabled={isViewMode}
                  />
                  <button
                    type="button"
                    onClick={handleAddTransport}
                    disabled={!pendingTransportType || isViewMode}
                    className="absolute right-0 bottom-1 flex items-center justify-center h-[42px] w-[50px] bg-[#1e3a8a] text-white rounded-r-xl hover:bg-[#112240] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed border-none"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Blocos de Transporte Selecionados */}
              {selectedTransportes.length > 0 && (
                <div className="space-y-6 mb-6">
                  {selectedTransportes.map((t, idx) => {
                    const totalIda = (t.ida_valores || []).reduce((acc, curr) => acc + (curr || 0), 0);
                    const totalVolta = (t.volta_valores || []).reduce((acc, curr) => acc + (curr || 0), 0);

                    return (
                      <div key={idx} className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 relative animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-black text-[#1e3a8a] flex items-center gap-2">
                            <Bus className="h-4 w-4 text-blue-400" /> {t.tipo}
                          </h5>
                          {!isViewMode && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTransport(idx)}
                              className="text-gray-400 hover:text-red-500 rounded-full focus:outline-none transition-colors border border-gray-200 bg-white p-1"
                              title="Remover Transporte"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* IDA */}
                          <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantidade Ida</label>
                              <input
                                type="number"
                                min="0"
                                className={`w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                value={t.ida_qtd || ''}
                                onChange={e => handleTransporteQtdChange(idx, 'ida', e.target.value)}
                                placeholder="Máx 3"
                                disabled={isViewMode}
                                readOnly={isViewMode}
                              />
                            </div>
                            {/* Campos de Valor Dinâmicos para Ida */}
                            {Array.from({ length: t.ida_qtd || 0 }).map((_, i) => (
                              <div key={`ida_val_${i}`}>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Ida #{i + 1} (R$)</label>
                                <input
                                  type="text"
                                  className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                  value={formatCurrency(t.ida_valores?.[i])}
                                  onChange={e => handleTransporteValorChange(idx, 'ida', i, e.target.value)}
                                  disabled={isViewMode}
                                  readOnly={isViewMode}
                                />
                              </div>
                            ))}
                            {t.ida_qtd > 0 && (
                              <div className="text-right text-xs font-bold text-[#1e3a8a]">Subtotal: R$ {totalIda.toFixed(2)}</div>
                            )}
                          </div>

                          {/* VOLTA */}
                          <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantidade Volta</label>
                              <input
                                type="number"
                                min="0"
                                className={`w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2.5 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                value={t.volta_qtd || ''}
                                onChange={e => handleTransporteQtdChange(idx, 'volta', e.target.value)}
                                placeholder="Máx 3"
                                disabled={isViewMode}
                                readOnly={isViewMode}
                              />
                            </div>
                            {/* Campos de Valor Dinâmicos para Volta */}
                            {Array.from({ length: t.volta_qtd || 0 }).map((_, i) => (
                              <div key={`volta_val_${i}`}>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Volta #{i + 1} (R$)</label>
                                <input
                                  type="text"
                                  className={`w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-2 outline-none transition-all font-medium ${isViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                  value={formatCurrency(t.volta_valores?.[i])}
                                  onChange={e => handleTransporteValorChange(idx, 'volta', i, e.target.value)}
                                  disabled={isViewMode}
                                  readOnly={isViewMode}
                                />
                              </div>
                            ))}
                            {t.volta_qtd > 0 && (
                              <div className="text-right text-xs font-bold text-[#1e3a8a]">Subtotal: R$ {totalVolta.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {totalTransporte > 0 && (
                <div className="mt-4 p-4 bg-blue-50/70 border border-blue-200 rounded-xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                    <span className="text-sm font-bold text-[#1e3a8a]">Custo Total Diário de Transporte:</span>
                    <span className="text-base font-black text-[#1e3a8a]">R$ {totalTransporte.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700">Estimativa Mensal (S/ Feriado):</span>
                      <span className="text-[10px] uppercase text-gray-500 font-bold mt-1">*{workingDays} dias úteis no mês atual</span>
                    </div>
                    <span className="text-lg font-black text-emerald-600">R$ {monthlyTotalTransporte.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
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
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL for Transport Limits */}
      {showTransporteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-center text-[#0a192f] tracking-tight mb-4">
              Limite Excedido
            </h2>

            <p className="text-center text-gray-600 mb-8 font-medium">
              Atenção: O máximo sugerido de passagens por trecho é 3. Tem certeza que deseja incluir a quantidade atípica de <strong className="text-amber-600">{showTransporteModal.numValue}</strong>?
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowTransporteModal(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  applyTransporteQtd(showTransporteModal.index, showTransporteModal.type, showTransporteModal.numValue);
                  setShowTransporteModal(null);
                }}
                className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors uppercase tracking-wider shadow-lg shadow-amber-500/30 text-xs"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
