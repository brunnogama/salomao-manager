export interface AppUpdate {
    version: string;
    date: string;
    title: string;
    description: string;
    features: string[];
    fixes: string[];
}

export const APP_UPDATES: AppUpdate[] = [
    {
        version: '1.1.0',
        date: '01/03/2026',
        title: 'Atualizações no Calendário e Correções',
        description: 'Nesta atualização, melhoramos a visualização do calendário e corrigimos alguns problemas encontrados no sistema recentemente.',
        features: [
            'Inclusão do campo do LinkedIn no cadastro de Colaboradores.',
            'Adição do histórico de mudança de cargos no perfil dos Colaboradores.',
            'Ajuste no layout do Calendário: os cards de "Aniversariantes" e "Eventos" agora ficam lado a lado, otimizando o espaço da tela.',
            'Melhoria na exibição do gráfico de "Colaboradores por Líder" segmentado por "Jurídico - Sócios", "Jurídico - Líderes" e "Administrativo".',
            'A página "Colaboradores" agora está agrupada dentro do painel "Dashboard" para melhor organização da barra lateral.'
        ],
        fixes: [
            'Correção no envio de e-mails via Make.com que estava apresentando erro 410.',
            'Ajuste nas máscaras de formatação dos campos CPF e Identidade (RG) para inserção de dados.'
        ]
    },
    {
        version: '3.1.0',
        date: '11/02/2026',
        title: '⚙️ Configurações Controladoria',
        description: 'Nova aba e funcionalidades restritas para a Controladoria.',
        features: [
            'Nova aba de configurações exclusivas da Controladoria',
            'Reset modular para Financeiro, Tarefas, Contratos e Clientes',
            'Zona de perigo com Factory Reset específico para o módulo'
        ],
        fixes: []
    },
    {
        version: '3.0.0',
        date: '11/02/2026',
        title: '🚀 Padronização e Recuperação',
        description: 'Padronização do sistema e recuperação de dados de colaboradores.',
        features: [
            'Padronização de Cabeçalho Geral (Settings)'
        ],
        fixes: [
            'Migração de Configurações da Controladoria',
            'Correção no Display de Colaboradores (Nomes ao invés de IDs)',
            'Recuperação de Dados de Colaboradores (Fix Join Query)'
        ]
    },
    {
        version: '2.9.9',
        date: '04/02/2026',
        title: '🛡️ Ajuste Permissão RH/Collaborators',
        description: 'Ajustes de permissões e segurança.',
        features: [],
        fixes: [
            'Unificação de flags de acesso para o módulo de colaboradores',
            'Correção de bypass emergencial'
        ]
    },
    {
        version: '2.9.8',
        date: '03/02/2026',
        title: '🛡️ Reset de Segurança e Bypass',
        description: 'Correções críticas de restrição de segurança.',
        features: [],
        fixes: [
            'Remoção de políticas RLS conflitantes (Erro 500)',
            'Bypass local prioritário para marcio.gama',
            'Sincronização forçada de UUID via Upsert'
        ]
    }
];
