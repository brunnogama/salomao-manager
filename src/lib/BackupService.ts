import { supabase } from './supabase'
import { logAction } from './logger'

const BACKUP_TABLES = [
    'user_profiles',
    'analysts',
    'partners',
    'clients',
    'contracts',
    'contract_processes',
    'contract_documents',
    'contract_timeline',
    'kanban_tasks',
    'financial_installments',
    'colaboradores',
    'marcacoes_ponto',
    'presenca_portaria',
    'aeronave_frota',
    'aeronave_lancamentos',
    'financeiro_aeronave',
    'familia_salomao_dados',
    'logs',
    'audit_logs'
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
                console.warn('Bucket "backups" não encontrado. Criando manualmente ou ignorando.');
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
        const today = now.toISOString().split('T')[0];
        const lastBackupDate = localStorage.getItem('last_backup_date');

        // Triggers if it's 19:00 or later AND no backup was done today
        if (currentHour >= 19 && lastBackupDate !== today) {
            try {
                const data = await this.runBackup();
                await this.uploadBackupToStorage(data);
                console.log('✅ Backup automático concluído com sucesso.');
            } catch (error) {
                console.error('❌ Erro no backup automático:', error);
            }
        }
    }
};
