import { BookOpen, Search, CheckCircle, AlertTriangle, Gift, Users, Settings } from 'lucide-react'

export function Manual() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      
      {/* HEADER DO MANUAL */}
      <div className="bg-[#112240] rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"><BookOpen className="h-6 w-6 text-blue-300" /></div>
            <h2 className="text-3xl font-bold">Manual do Sistema</h2>
          </div>
          <p className="text-gray-300 max-w-2xl text-lg">
            Guia completo de utilização do Salomão Manager v1.6. Aprenda a gerenciar clientes, brindes e usuários de forma eficiente.
          </p>
        </div>
        {/* Elemento decorativo de fundo */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* SIDEBAR DE NAVEGAÇÃO DO MANUAL */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-4">
                <h3 className="font-bold text-[#112240] mb-4 text-sm uppercase tracking-wide">Tópicos Principais</h3>
                <ul className="space-y-3 text-sm">
                    <li><a href="#intro" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Visão Geral</a></li>
                    <li><a href="#clientes" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Gestão de Clientes</a></li>
                    <li><a href="#brindes" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Histórico de Brindes</a></li>
                    <li><a href="#incompletos" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Cadastros Pendentes</a></li>
                    <li><a href="#admin" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Administração & Usuários</a></li>
                </ul>
            </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="md:col-span-2 space-y-10">

            {/* INTRODUÇÃO */}
            <section id="intro" className="scroll-mt-6">
                <h3 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <Search className="h-6 w-6 text-blue-600" /> Visão Geral da Navegação
                </h3>
                <div className="prose text-gray-600 leading-relaxed">
                    <p>
                        O <strong>Salomão Manager</strong> foi atualizado para facilitar o acesso aos diferentes módulos (Jurídico, Família e RH). 
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Trocar Módulo:</strong> No topo da tela (cabeçalho), ao lado do nome "Salomão Manager", existe um botão para voltar à seleção de sistemas.</li>
                        <li><strong>Menu Lateral:</strong> Use a barra lateral esquerda para navegar entre Dashboard, Clientes, Kanban e Configurações.</li>
                        <li><strong>Mobile:</strong> Em celulares, o menu é acessível pelo botão flutuante no canto inferior direito.</li>
                    </ul>
                </div>
            </section>

            <hr className="border-gray-100" />

            {/* CLIENTES */}
            <section id="clientes" className="scroll-mt-6">
                <h3 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" /> Gestão de Clientes
                </h3>
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-bold text-blue-800 text-sm mb-2">Como cadastrar um novo cliente?</h4>
                        <p className="text-sm text-blue-700">
                            Acesse a aba <strong>Clientes</strong> e clique no botão <strong>+ Novo Cliente</strong> no topo direito. 
                            Preencha os dados básicos. O CEP busca o endereço automaticamente.
                        </p>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Você pode editar qualquer cliente clicando no ícone de lápis (✏️) na lista. Para excluir, use o ícone de lixeira (🗑️).
                    </p>
                </div>
            </section>

            <hr className="border-gray-100" />

            {/* BRINDES (NOVIDADE) */}
            <section id="brindes" className="scroll-mt-6">
                <h3 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <Gift className="h-6 w-6 text-purple-600" /> Histórico de Brindes (Atualizado)
                </h3>
                <div className="prose text-gray-600 text-sm">
                    <p>
                        Agora é possível manter um registro detalhado do que foi enviado ano a ano para cada cliente.
                        Ao editar um cliente, vá na aba <strong>Histórico Brindes</strong>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <strong className="block text-[#112240] mb-2">Adicionar Ano Novo</strong>
                            <p>Clique em <strong>+ Adicionar Ano Futuro</strong>. O sistema perguntará qual ano você deseja inserir (ex: 2026). O ano será criado no topo da lista.</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <strong className="block text-[#112240] mb-2">Registrar Envio</strong>
                            <p>Selecione o tipo de brinde no menu suspenso (ex: Brinde VIP) e adicione uma observação se necessário.</p>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="border-gray-100" />

            {/* INCOMPLETOS */}
            <section id="incompletos" className="scroll-mt-6">
                <h3 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-orange-500" /> Cadastros Pendentes
                </h3>
                <p className="text-gray-600 mb-4">
                    O sistema monitora automaticamente campos vazios importantes (como Endereço, Cargo ou Tipo de Brinde).
                </p>
                <ul className="space-y-3">
                    <li className="flex gap-3 items-start bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="mt-1"><CheckCircle className="h-5 w-5 text-green-500" /></div>
                        <div>
                            <strong className="text-gray-800 text-sm">Botão Resolver:</strong>
                            <p className="text-xs text-gray-500">Abre o formulário do cliente para você preencher o que falta.</p>
                        </div>
                    </li>
                    <li className="flex gap-3 items-start bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="mt-1"><AlertTriangle className="h-5 w-5 text-gray-400" /></div>
                        <div>
                            <strong className="text-gray-800 text-sm">Botão Ignorar:</strong>
                            <p className="text-xs text-gray-500">Se um campo não for necessário para aquele cliente, clique em Ignorar. O sistema parará de cobrar aqueles campos específicos para aquele cliente.</p>
                        </div>
                    </li>
                </ul>
            </section>

            <hr className="border-gray-100" />

            {/* ADMINISTRAÇÃO */}
            <section id="admin" className="scroll-mt-6">
                <h3 className="text-2xl font-bold text-[#112240] mb-4 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-gray-700" /> Administração
                </h3>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                    <p className="text-sm text-gray-700">
                        Acesse a aba <strong>Configurações</strong> para:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Cadastrar novos usuários de acesso.</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Bloquear/Desbloquear contas.</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Gerenciar lista de Sócios.</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Importar clientes via Excel.</li>
                    </ul>
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-xs text-red-700">
                        <strong>Cuidado:</strong> A função "Resetar Sistema" apaga TUDO. Use com extrema cautela.
                    </div>
                </div>
            </section>

        </div>
      </div>
    </div>
  )
}
