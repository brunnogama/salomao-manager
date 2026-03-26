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
        version: '1.4.0',
        date: '07/03/2026',
        title: 'Inteligência Artificial Recrutadora e Experiência de Vagas',
        description: 'Trouxemos grandes aprimoramentos focados na automação do módulo de Recrutamento (ATS) e melhorias na experiência de uso geral.',
        features: [
            'IA Leitora de Currículos Aprimorada: Agora a IA é capaz de varrer números de telefone em formatos variados e deduzir o gênero do candidato automaticamente pelo currículo!',
            'Indicador Visual de Preenchimento Automático (IA): O campo Gênero também recebeu o efeito visual para demonstrar preenchimento da IA.',
            'Padronização Visual nas Abas de Vagas: As Visualizações de "Vagas Abertas" e "Vagas Fechadas" ganharam as tags de perfil abaixo do Cargo, se igualando ao grid de Talentos.'
        ],
        fixes: [
            'O salvamento de Telefones dos candidatos recém-ingestados pela IA voltou a funcionar corretamente.',
            'O Tooltip de Novidades foi implementado na barra lateral para garantir que você não perca nenhuma atualização do sistema!'
        ]
    },
    {
        version: '1.3.0',
        date: '02/03/2026',
        title: 'Melhorias de Interface no Link Mágico e Cadastro de Colaboradores',
        description: 'Trouxemos grandes aprimoramentos focados na automação do módulo de Recrutamento (ATS) e melhorias na experiência de uso geral.',
        features: [
            'IA Leitora de Currículos Aprimorada: Agora a IA é capaz de varrer números de telefone em formatos variados e deduzir o gênero do candidato (Masculino/Feminino) automaticamente pelo currículo!',
            'Indicador Visual de Preenchimento Automático (IA): O campo Gênero também recebeu o efeito de "brilho roxo" para mostrar que a IA preencheu o dado para você.',
            'Padronização Visual nas Abas de Vagas: As Visualizações de "Vagas Abertas" e "Vagas Fechadas" ganharam as tags de perfil abaixo do Cargo, se igualando ao grid de Talentos.'
        ],
        fixes: [
            'O salvamento de Telefones dos candidatos recém-ingestados pela IA voltou a funcionar corretamente.',
            'Solucionamos o travamento do "Scroll Vertical" em todas as telas de Recursos Humanos e Recrutamento. A rolagem nativa agora funciona sem "engolir" a tabela.',
            'O Tooltip de Novidades foi implementado na barra lateral para garantir que você não perca nenhuma atualização do sistema!'
        ]
    },
    {
        version: '1.3.0',
        date: '02/03/2026',
        title: 'Melhorias de Interface no Link Mágico e Cadastro de Colaboradores',
        description: 'Implementamos novos ajustes focados em facilitar o preenchimento de dados de emergência, transporte e a leitura da política de privacidade no Link Mágico.',
        features: [
            'Botão de Emergência Simplificado: A interface para adição de múltiplos contatos de emergência foi reduzida a um prático botão de (+).',
            'Privacidade Reforçada: O alerta sobre a proteção de dados (LGPD) foi resumido e movido estrategicamente para o topo do Link Mágico.',
            'Adição Instantânea de Transporte: O menu de seleção de transporte agora se encontra abaixo da lista, e a adição ocorre imediatamente ao clicar (sem a necessidade do botão +).',
            'Novos Tipos de Transporte: Adicionamos as opções "Barcas" e "Não Optante", além de corrigir a nomenclatura de "Integração Bilhete Único".'
        ],
        fixes: [
            'O título interno da aba de Gestão de Documentos (GED) no Link Mágico foi renomeado de "Gestão de Documentos" para "Arquivos Vinculados" para maior clareza.'
        ]
    },
    {
        version: '1.2.0',
        date: '02/03/2026',
        title: 'Melhorias de RH e Logística de Transporte',
        description: 'Lançamos um conjunto de novidades voltadas para a otimização de Admissões, Transporte Corporativo e UX Geral da plataforma.',
        features: [
            'Alertas Automáticos de RH: O sistema agora notifica a equipe do RH sempre que um colaborador completar 3 meses de casa (Entrega de Mochila) ou for Aniversariante do Dia.',
            'Gestão Avançada de Transporte: Implementamos o cadastro de múltiplos transportes na aba de Dados Corporativos, contabilizando automaticamente a estimativa de custo mensal baseada em dias úteis.',
            'Interface Mais Limpa: Reformulamos as abas de Filtros Avançados e o botão de Adição na tela principal de gerenciamento de equipe para ocupar menos espaço e focar no que importa.',
            'Nova Experiência de Novidades: O modal de novidades do sistema não abre mais repentinamente. Ele foi substituído por um ícone piscante de aviso no menu de módulos.'
        ],
        fixes: [
            'Correção na barra de transbordamento horizontal de tabelas para não encobrir os cabeçalhos.'
        ]
    },
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
            'A página "Integrantes" agora está agrupada dentro do painel "Dashboard" para melhor organização da barra lateral.'
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
            'Correção no Display de Integrantes (Nomes ao invés de IDs)',
            'Recuperação de Dados de Integrantes (Fix Join Query)'
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
