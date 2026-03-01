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
        date: '2026-03-01',
        title: 'Atualizações no Calendário e Correções',
        description: 'Nesta atualização, melhoramos a visualização do calendário e corrigimos alguns problemas encontrados no sistema recentemente.',
        features: [
            'Ajuste no layout do Calendário: os cards de "Aniversariantes" e "Eventos" agora ficam lado a lado, otimizando o espaço da tela.',
            'Melhoria na exibição do gráfico de "Colaboradores por Líder" segmentado por "Jurídico - Sócios", "Jurídico - Líderes" e "Administrativo".',
            'A página "Colaboradores" agora está agrupada dentro do painel "Dashboard" para melhor organização da barra lateral.'
        ],
        fixes: [
            'Correção no envio de e-mails via Make.com que estava apresentando erro 410.',
            'Ajuste nas máscaras de formatação dos campos CPF e Identidade (RG) para inserção de dados.'
        ]
    }
];
