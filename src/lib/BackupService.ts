import { supabase } from './supabase'
import { logAction } from './logger'

const BACKUP_TABLES = [
    'aeronave_frota',
    'aeronave_lancamentos',
    'analysts',
    'audit_logs',
    'certificates',
    'client_contacts',
    'clients',
    'collaborator_absences',
    'collaborator_education_history',
    'collaborator_role_history',
    'collaborator_warnings',
    'collaborators',
    'config_magistrados',
    'contract_documents',
    'contract_processes',
    'contract_statuses',
    'contract_timeline',
    'contracts',
    'courts',
    'eventos',
    'familia_config_opcoes',
    'familia_salomao_dados',
    'familia_salomao_demandas',
    'finance_clientes',
    'finance_faturas',
    'financeiro_aeronave',
    'financeiro_oab',
    'financial_installments',
    'ged_colaboradores',
    'ged_documentos',
    'hiring_reasons',
    'locations',
    'logs',
    'magistrados',
    'marcacoes_ponto',
    'oab_number',
    'office_locations',
    'operational_assets',
    'operational_fornecedores',
    'operational_items',
    'opponents',
    'partners',
    'perfil_tags',
    'presenca_portaria',
    'processos',
    'rateios',
    'reembolsos',
    'rh_actions',
    'rh_export_templates',
    'rh_mapa_elementos',
    'rh_postos',
    'roles',
    'shopping_list_items',
    'sucumbencias',
    'tasks',
    'team_leader',
    'teams',
    'termination_initiatives',
    'termination_reasons',
    'termination_types',
    'tipos_brinde',
    'user_kanban_settings',
    'user_profiles',
    'vacation_requests',
    'vagas'
];

export interface BackupData {
    timestamp: string;
    version: string;
    tables: Record<string, any[]>;
}

export const BackupService = {
    async runBackup(): Promise<BackupData> {
        const backup: BackupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            tables: {}
        };

        for (const table of BACKUP_TABLES) {
            const { data, error } = await supabase.from(table).select('*');
            if (error) {
                console.error(`Erro ao fazer backup da tabela ${table}:`, error);
                backup.tables[table] = [];
            } else {
                backup.tables[table] = data || [];
            }
        }

        return backup;
    },

    async downloadBackup(data: BackupData) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `salomao_manager_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        await logAction('BACKUP', 'SYSTEM', 'Realizou download de backup manual');
    },

    async uploadBackupToStorage(data: BackupData) {
        const date = new Date().toISOString().split('T')[0];
        const fileName = `backups/backup_${date}.json`;
        const { error } = await supabase.storage
            .from('backups')
            .upload(fileName, JSON.stringify(data, null, 2), {
                contentType: 'application/json',
                upsert: true
            });

        if (error) {
            if (error.message.includes('bucket not found')) {
                console.warn('Bucket "backups" não encontrado. Backup não foi salvo.');
                // Não propaga o erro para não quebrar a aplicação (fallback silencioso)
                return;
            }
            throw error;
        }

        await logAction('BACKUP', 'SYSTEM', `Backup automático realizado: ${fileName}`);
        localStorage.setItem('last_backup_date', date);
    },

    async checkAndRunAutomaticBackup() {
        const isAutoBackupEnabled = localStorage.getItem('auto_backup_enabled') === 'true';
        if (!isAutoBackupEnabled) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const today = now.toISOString().split('T')[0];
        const lastBackupDate = localStorage.getItem('last_backup_date');

        const configuredTime = localStorage.getItem('auto_backup_time') || '19:00';
        const [configHourStr, configMinuteStr] = configuredTime.split(':');
        const configHour = parseInt(configHourStr, 10);
        const configMinute = parseInt(configMinuteStr, 10);

        // Triggers if current time is >= configured time AND no backup was done today
        const isAfterTime = currentHour > configHour || (currentHour === configHour && currentMinute >= configMinute);

        if (isAfterTime && lastBackupDate !== today) {
            try {
                const { toast } = await import('sonner');
                toast.info('Realizando backup automático do sistema...', {
                    description: 'Aguarde a conclusão do processo.',
                    duration: 5000
                });

                const data = await this.runBackup();
                await this.uploadBackupToStorage(data);

                toast.success('Backup automático concluído com sucesso.', {
                    description: 'Os dados foram salvos com segurança.'
                });
                console.log('✅ Backup automático concluído com sucesso.');
            } catch (error) {
                const { toast } = await import('sonner');
                toast.error('Erro ao realizar backup automático.', {
                    description: 'Por favor, tente realizar o backup manual nas configurações.'
                });
                console.error('❌ Erro no backup automático:', error);
            }
        }
    }
};
