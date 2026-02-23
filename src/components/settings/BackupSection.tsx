import { useState, useEffect } from 'react'
import { Database, Download, RefreshCw, Clock, AlertCircle, CheckCircle, Shield } from 'lucide-react'
import { BackupService } from '../../lib/BackupService'
import { toast } from 'sonner'

interface BackupSectionProps {
    isAdmin: boolean
}

export function BackupSection({ isAdmin }: BackupSectionProps) {
    const [loading, setLoading] = useState(false)
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
    const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)

    useEffect(() => {
        const savedAutoBackup = localStorage.getItem('auto_backup_enabled') === 'true'
        const savedLastBackup = localStorage.getItem('last_backup_date')
        setAutoBackupEnabled(savedAutoBackup)
        setLastBackupDate(savedLastBackup)
    }, [])

    const handleManualBackup = async () => {
        setLoading(true)
        try {
            const data = await BackupService.runBackup()
            await BackupService.downloadBackup(data)
            toast.success('Backup realizado e baixado com sucesso!')
        } catch (error) {
            console.error('Erro no backup:', error)
            toast.error('Erro ao realizar backup manual.')
        } finally {
            setLoading(false)
        }
    }

    const toggleAutoBackup = () => {
        const newState = !autoBackupEnabled
        setAutoBackupEnabled(newState)
        localStorage.setItem('auto_backup_enabled', newState.toString())
        toast.info(`Backup automático ${newState ? 'ativado' : 'desativado'}`)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Database className="h-24 w-24 text-blue-900" />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Backup de Dados</h3>
                        <p className="text-sm text-gray-500">Gerencie a segurança e integridade das informações do sistema.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {/* Manual Backup Card */}
                    <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Download className="h-4 w-4 text-blue-600" />
                                <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Backup Manual</h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                Gera um arquivo completo com todos os dados das tabelas do sistema em formato JSON para salvaguarda local.
                            </p>
                        </div>
                        <button
                            onClick={handleManualBackup}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            {loading ? 'Processando...' : 'Realizar Backup Agora'}
                        </button>
                    </div>

                    {/* Auto Backup Card */}
                    <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-emerald-600" />
                                    <h4 className="font-bold text-gray-800 uppercase text-xs tracking-wider">Backup Automático</h4>
                                </div>
                                <div
                                    className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${autoBackupEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}
                                >
                                    {autoBackupEnabled ? 'Ativado' : 'Desativado'}
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                Quando ativado, o sistema realiza um backup diário às 19:00 (se houver um administrador conectado).
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Status do Agendamento</span>
                                <button
                                    onClick={toggleAutoBackup}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoBackupEnabled ? 'bg-emerald-500' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {lastBackupDate && (
                                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest justify-center">
                                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                                    Último backup: {lastBackupDate}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                    <h5 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Informação de Segurança</h5>
                    <p className="text-xs text-amber-800 leading-relaxed">
                        Os backups automáticos são salvos no ambiente seguro de Storage do Supabase. Apenas administradores do sistema têm acesso para restaurar ou gerenciar estes arquivos.
                    </p>
                </div>
            </div>

            {!isAdmin && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                    <Shield className="h-5 w-5 text-red-600 shrink-0" />
                    <p className="text-xs text-red-800">
                        Algumas funcionalidades de backup podem estar limitadas para o seu nível de acesso.
                    </p>
                </div>
            )}
        </div>
    )
}
