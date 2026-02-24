
import { useState, useEffect } from 'react'
import { Armchair, Plus, Search, MapPin, Tag, Box, Trash2, Pencil, Save, X, RotateCcw } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { ConfirmationModal } from '../../ui/ConfirmationModal'
import { AlertModal } from '../../ui/AlertModal'

interface Asset {
    id: string
    name: string
    description?: string
    category: string
    location: string
    patrimony_number?: string
    acquisition_date?: string
    value: number
    status: string
    brand?: string
    model?: string
    serial_number?: string
}

export function Imobiliario() {
    const [activeLocation, setActiveLocation] = useState('Todos')
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal & Form State
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
    const [formData, setFormData] = useState<Partial<Asset>>({})

    const [itemToDelete, setItemToDelete] = useState<string | null>(null)
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        variant: 'success' | 'error' | 'info';
    }>({
        isOpen: false,
        title: '',
        description: '',
        variant: 'info'
    })

    // Handle ESC key for form modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsFormOpen(false)
            }
        }
        if (isFormOpen) {
            window.addEventListener('keydown', handleKeyDown)
        }
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFormOpen])

    const locations = [
        { id: 'Todos', label: 'Todas as Salas' },
        { id: 'Recepcao', label: 'Recepção' },
        { id: 'Reuniao1', label: 'Reunião 1' },
        { id: 'Reuniao2', label: 'Reunião 2' },
        { id: 'Operacional', label: 'Área Operacional' },
        { id: 'Copa', label: 'Copa' },
        { id: 'Socios', label: 'Salas Sócios' },
        { id: 'Outros', label: 'Outros' },
    ]

    const categories = [
        'Móveis', 'Equipamentos', 'Decoração', 'Eletrodomésticos', 'Outros'
    ]

    const statusOptions = [
        'Bom', 'Regular', 'Ruim', 'Em Manutenção', 'Descartado'
    ]

    useEffect(() => {
        fetchAssets()
    }, [])

    const fetchAssets = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('operational_assets')
                .select('*')
                .order('name')

            if (error) throw error
            if (data) setAssets(data)
        } catch (error: any) {
            console.error('Error fetching assets:', error.message)
            // Optional: showAlert('Erro', 'Erro ao carregar ativos.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const showAlert = (title: string, description: string, variant: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ isOpen: true, title, description, variant })
    }

    const handleOpenForm = (asset?: Asset) => {
        if (asset) {
            setEditingAsset(asset)
            setFormData(asset)
        } else {
            setEditingAsset(null)
            setFormData({
                status: 'Bom',
                category: 'Móveis',
                location: activeLocation === 'Todos' ? 'Recepcao' : activeLocation
            })
        }
        setIsFormOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.category || !formData.location) {
            showAlert('Atenção', 'Preencha os campos obrigatórios (Nome, Categoria, Local).', 'info')
            return
        }

        try {
            setLoading(true)
            if (editingAsset) {
                // Update
                const { error } = await supabase
                    .from('operational_assets')
                    .update(formData)
                    .eq('id', editingAsset.id)

                if (error) throw error
                setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...formData } as Asset : a))
                showAlert('Sucesso', 'Ativo atualizado com sucesso.', 'success')
            } else {
                // Create
                const { data, error } = await supabase
                    .from('operational_assets')
                    .insert(formData)
                    .select()
                    .single()

                if (error) throw error
                if (data) setAssets(prev => [...prev, data])
                showAlert('Sucesso', 'Ativo cadastrado com sucesso.', 'success')
            }
            setIsFormOpen(false)
        } catch (error: any) {
            showAlert('Erro', 'Erro ao salvar ativo: ' + error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!itemToDelete) return
        try {
            const { error } = await supabase
                .from('operational_assets')
                .delete()
                .eq('id', itemToDelete)

            if (error) throw error
            setAssets(prev => prev.filter(a => a.id !== itemToDelete))
            showAlert('Sucesso', 'Ativo removido com sucesso.', 'success')
        } catch (error: any) {
            showAlert('Erro', 'Erro ao remover ativo: ' + error.message, 'error')
        } finally {
            setItemToDelete(null)
        }
    }

    const filteredAssets = assets.filter(asset => {
        const matchesLocation = activeLocation === 'Todos' || asset.location === activeLocation
        const matchesSearch = !searchTerm ||
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.patrimony_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesLocation && matchesSearch
    })

    const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0)

    const getLocationLabel = (id: string) => locations.find(l => l.id === id)?.label || id

    return (
        <div className="flex flex-col h-full space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
                        <Armchair className="h-6 w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                            Controle Imobiliário
                        </h1>
                        <p className="text-xs md:text-sm font-semibold text-gray-500 mt-1 md:mt-0.5">
                            Gestão de móveis e ativos fixos do escritório
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => handleOpenForm()}
                    className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] hover:bg-[#112240] text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    NOVO ATIVO
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">

                <div className="flex overflow-x-auto pb-4 gap-2 custom-scrollbar">
                    {locations.map((loc) => (
                        <button
                            key={loc.id}
                            onClick={() => setActiveLocation(loc.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all border ${activeLocation === loc.id
                                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-medium">{loc.label}</span>
                        </button>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por patrimônio, descrição ou nome..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                        />
                    </div>
                    {/* Placeholder for advanced filters if needed */}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Box className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total de Itens</p>
                            <h4 className="text-2xl font-bold text-gray-800">{assets.length}</h4>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <Tag className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Patrimônio Total</p>
                            <h4 className="text-2xl font-bold text-gray-800">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                            </h4>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Salas/Locais</p>
                            <h4 className="text-2xl font-bold text-gray-800">{locations.length - 1}</h4>
                        </div>
                    </div>
                </div>

                {/* List / Table */}
                {filteredAssets.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <div className="min-w-[1000px]">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patrimônio</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome/Descrição</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Local</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                                            <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredAssets.map((asset) => (
                                            <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6 text-sm font-medium text-gray-600">
                                                    {asset.patrimony_number || '-'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800">{asset.name}</span>
                                                        {asset.brand && <span className="text-xs text-gray-500">{asset.brand} {asset.model}</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                                        {asset.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-600">
                                                    {getLocationLabel(asset.location)}
                                                </td>
                                                <td className="py-4 px-6 text-sm font-medium text-gray-900">
                                                    {asset.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value) : '-'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase
                                                ${asset.status === 'Bom' ? 'bg-green-100 text-green-700' :
                                                            asset.status === 'Regular' ? 'bg-yellow-100 text-yellow-700' :
                                                                asset.status === 'Ruim' ? 'bg-orange-100 text-orange-700' :
                                                                    asset.status === 'Em Manutenção' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {asset.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenForm(asset)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setItemToDelete(asset.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-12 text-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Armchair className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Nenhum ativo encontrado</h3>
                            <p className="mb-6 max-w-sm mx-auto">Cadastre o mobiliário e equipamentos do escritório para controle patrimonial.</p>
                            <button
                                onClick={() => handleOpenForm()}
                                className="text-indigo-600 font-medium hover:underline text-sm"
                            >
                                Cadastrar primeiro ativo
                            </button>
                        </div>
                    </div>
                )}

                {/* FORM MODAL */}
                {isFormOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                                <h2 className="text-xl font-black text-[#0a192f]">
                                    {editingAsset ? 'Editar Ativo' : 'Novo Ativo'}
                                </h2>
                                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-red-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Item <span className="text-red-500">*</span></label>
                                        <input
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
                                            placeholder="Ex: Cadeira Herman Miller"
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Número Patrimônio</label>
                                        <input
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Ex: 001234"
                                            value={formData.patrimony_number || ''}
                                            onChange={e => setFormData({ ...formData, patrimony_number: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Valor (R$)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="0.00"
                                            value={formData.value || ''}
                                            onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Aquisição</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            value={formData.acquisition_date || ''}
                                            onChange={e => setFormData({ ...formData, acquisition_date: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria <span className="text-red-500">*</span></label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                            value={formData.category || ''}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Localização <span className="text-red-500">*</span></label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                            value={formData.location || ''}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {locations.filter(l => l.id !== 'Todos').map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                            value={formData.status || 'Bom'}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Marca</label>
                                        <input
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Marca"
                                            value={formData.brand || ''}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Modelo</label>
                                        <input
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Modelo"
                                            value={formData.model || ''}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Descrição / Observações</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-none"
                                            placeholder="Detalhes adicionais sobre o ativo..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Salvar Ativo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={handleDelete}
                    title="Excluir Ativo"
                    description="Tem certeza que deseja remover este ativo? Esta ação não pode ser desfeita."
                    variant="danger"
                    confirmText="Excluir"
                    cancelText="Cancelar"
                />

                <AlertModal
                    isOpen={alertConfig.isOpen}
                    onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                    title={alertConfig.title}
                    description={alertConfig.description}
                    variant={alertConfig.variant}
                />
            </div>
        </div>
    )
}
