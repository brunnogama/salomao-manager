import { useState } from 'react'
import { 
  BookOpen, LayoutDashboard, Users, UserX, KanbanSquare, 
  Settings, History, Shield, Smartphone, FileSpreadsheet, 
  Search, MousePointerClick, Menu 
} from 'lucide-react'

export function Manual() {
  const [activeSection, setActiveSection] = useState('intro')

  const scrollTo = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const sections = [
    { id: 'intro', label: 'Introdução e Acesso', icon: BookOpen },
    { id: 'dashboard', label: 'Dashboard Interativo', icon: LayoutDashboard },
    { id: 'clientes', label: 'Gestão de Clientes', icon: Users },
    { id: 'incompletos', label: 'Cadastros Incompletos', icon: UserX },
    { id: 'kanban', label: 'Gestão de Tarefas', icon: KanbanSquare },
    { id: 'config', label: 'Configurações e Usuários', icon: Settings },
    { id: 'historico', label: 'Histórico e Auditoria', icon: History },
  ]

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 relative">
      
      {/* NAVEGAÇÃO INTERNA (ÍNDICE) */}
      <nav className="w-full lg:w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-fit lg:sticky lg:top-0 overflow-y-auto">
        <h3 className="font-bold text-[#112240] mb-4 px-2 uppercase text-xs tracking-wider">Índice do Manual</h3>
        <div className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              // ADICIONADO 'text-left' AQUI ABAIXO PARA CORRIGIR O ALINHAMENTO
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                activeSection === section.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {/* shrink-0 garante que o ícone não amasse se o texto for muito grande */}
              <section.icon className="h-4 w-4 flex-shrink-0" />
              <span className="leading-tight">{section.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* CONTEÚDO DO MANUAL */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-10 overflow-y-auto custom-scrollbar">
        
        {/* HEADER */}
        <div className="border-b border-gray-100 pb-8 mb-8">
            <h1 className="text-3xl font-extrabold text-[#112240] mb-4">Manual do Sistema Salomão CRM</h1>
            <p className="text-gray-500 text-lg leading-relaxed">
                Bem-vindo à documentação oficial. Este guia abrange todas as funcionalidades do CRM Jurídico, 
                desde o cadastro de clientes até a gestão administrativa de usuários.
            </p>
        </div>

        <div className="space-y-16">

            {/* 1. INTRODUÇÃO */}
            <section id="intro" className="scroll-mt-6">
                <h2 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-blue-600" /> Introdução e Acesso
                </h2>
                <div className="prose text-gray-600 space-y-4">
                    <p>
                        O <strong>Ecossistema Salomão</strong> é dividido em módulos. Ao realizar o login, você será direcionado para a tela de seleção onde poderá escolher entre:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>CRM Jurídico:</strong> O sistema principal para gestão de relacionamento e brindes.</li>
                        <li><strong>Gestão da Família:</strong> Módulo de administração pessoal (Em breve).</li>
                        <li><strong>Colaboradores:</strong> Portal de RH e time (Em breve).</li>
                    </ul>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                        <h4 className="font-bold text-blue-800 text-sm mb-1 flex items-center gap-2"><Menu className="h-4 w-4"/> Dica de Navegação</h4>
                        <p className="text-sm text-blue-700">
                            Para trocar de módulo sem sair do sistema, use o botão <strong>"Trocar Módulo"</strong> localizado no menu lateral esquerdo, logo acima do seu nome de usuário.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. DASHBOARD */}
            <section id="dashboard" className="scroll-mt-6">
                <h2 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6 text-blue-600" /> Dashboard Interativo
                </h2>
                <div className="prose text-gray-600 space-y-4">
                    <p>O Dashboard é a central de inteligência do CRM. Ele oferece uma visão rápida sobre:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Total de clientes cadastrados.</li>
                        <li>Contagem de brindes por tipo (VIP, Médio, etc).</li>
                        <li>Distribuição de clientes por Sócio Responsável.</li>
                        <li>Mapa de calor por Estados (UF).</li>
                    </ul>
                    
                    <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2 flex items-center gap-2"><MousePointerClick className="h-5 w-5"/> Funcionalidade Drill-down</h3>
                    <p>
                        O Dashboard é <strong>clicável</strong>. Ao clicar em qualquer cartão de brinde ou na barra de um sócio, o sistema irá redirecioná-lo automaticamente para a tela de <strong>Clientes</strong>, aplicando um filtro instantâneo correspondente ao que você clicou.
                    </p>
                </div>
            </section>

            {/* 3. CLIENTES */}
            <section id="clientes" className="scroll-mt-6">
                <h2 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" /> Gestão de Clientes
                </h2>
                <div className="prose text-gray-600 space-y-4">
                    <p>Este é o coração do sistema. Aqui você pode visualizar, cadastrar e interagir com sua base.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Search className="h-4 w-4"/> Cadastro Inteligente</h4>
                            <p className="text-sm">Ao cadastrar um novo cliente, digite o <strong>CEP</strong> e o sistema preencherá automaticamente o endereço, bairro, cidade e estado.</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Smartphone className="h-4 w-4"/> Ações Rápidas</h4>
                            <p className="text-sm">Nos cartões dos clientes, use os ícones para iniciar uma conversa no <strong>WhatsApp</strong>, fazer uma ligação ou enviar um <strong>E-mail</strong> com um clique.</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2">Impressão e Exportação</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Ficha Cadastral:</strong> Dentro do detalhe do cliente, clique em "Imprimir Ficha" para gerar um PDF formal.</li>
                        <li><strong>Relatório de Lista:</strong> Na barra superior, o ícone de impressora gera uma lista compacta dos clientes filtrados na tela.</li>
                        <li><strong>Excel:</strong> O botão "Exportar" baixa uma planilha .xlsx com todos os dados atuais.</li>
                    </ul>
                </div>
            </section>

            {/* 4. INCOMPLETOS */}
            <section id="incompletos" className="scroll-mt-6">
                <h2 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <UserX className="h-6 w-6 text-blue-600" /> Cadastros Incompletos
                </h2>
                <div className="prose text-gray-600 space-y-4">
                    <p>
                        O sistema monitora automaticamente a qualidade dos dados. Se um cliente não tiver campos essenciais (como Endereço, CEP, Email ou Sócio), ele aparecerá nesta lista.
                    </p>
                    <p>
                        Uma <strong>bolinha vermelha</strong> no menu lateral indica quantos clientes precisam de atenção. Mantenha este número sempre zerado para garantir a entrega correta dos brindes.
                    </p>
                </div>
            </section>

            {/* 5. KANBAN */}
            <section id="kanban" className="scroll-mt-6">
                <h2 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <KanbanSquare className="h-6 w-6 text-blue-600" /> Gestão de Tarefas (Kanban)
                </h2>
                <div className="prose text-gray-600 space-y-4">
                    <p>
                        Organize suas pendências diárias usando o quadro visual.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Criar:</strong> Clique em "+" para adicionar uma nova tarefa.</li>
                        <li><strong>Mover:</strong> Arraste e solte os cartões entre as colunas (A Fazer, Em Progresso, Concluído).</li>
                        <li><strong>Prioridade:</strong> Defina etiquetas de prioridade (Alta, Média, Baixa) que mudam a cor do cartão.</li>
                    </ul>
                </div>
            </section>

            {/* 6. CONFIGURAÇÕES E USUÁRIOS */}
            <section id="config" className="scroll-mt-6">
                <h2 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-blue-600" /> Configurações e Gestão de Usuários
                </h2>
                <div className="prose text-gray-600 space-y-4">
                    
                    <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2 flex items-center gap-2"><Shield className="h-5 w-5"/> Gestão de Acessos</h3>
                    <p>
                        Administradores podem controlar quem entra no sistema através da aba "Gestão de Usuários".
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Novo Usuário:</strong> Cadastre o Nome e E-mail. O usuário poderá criar sua senha no primeiro acesso.</li>
                        <li><strong>Cargos:</strong> Defina se o usuário é <em>Colaborador</em>, <em>Sócio</em> ou <em>Admin</em>.</li>
                        <li><strong>Inativar:</strong> Use o botão de bloqueio para revogar imediatamente o acesso de um usuário sem excluir seu histórico.</li>
                    </ul>

                    <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2 flex items-center gap-2"><FileSpreadsheet className="h-5 w-5"/> Importação em Lote</h3>
                    <p>
                        Para cadastrar muitos clientes de uma vez:
                        1. Baixe a <strong>Planilha Modelo</strong>.
                        2. Preencha os dados seguindo as colunas.
                        3. Faça o upload do arquivo para o sistema processar.
                    </p>
                </div>
            </section>

            {/* 7. HISTÓRICO */}
            <section id="historico" className="scroll-mt-6">
                <h2 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <History className="h-6 w-6 text-blue-600" /> Histórico e Auditoria
                </h2>
                <div className="prose text-gray-600 space-y-4">
                    <p>
                        Para segurança do escritório, todas as ações críticas são registradas (Logs). O histórico mostra:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Quem</strong> fez a ação (Usuário).</li>
                        <li><strong>O que</strong> foi feito (Criar, Editar, Excluir, Exportar).</li>
                        <li><strong>Quando</strong> foi feito (Data e Hora).</li>
                    </ul>
                    <p className="text-sm text-gray-500 mt-2">
                        Você pode filtrar os logs por data ou buscar por ações específicas para auditoria.
                    </p>
                </div>
            </section>

        </div>
        
        {/* FOOTER DO MANUAL */}
        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
            <p>Documentação atualizada em: 05/01/2026 - Versão do Sistema: 1.4</p>
        </div>
      </div>
    </div>
  )
}
