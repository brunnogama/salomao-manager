import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ModuleSelector } from './components/ModuleSelector';
import Login from './Login';
import ResetPassword from './ResetPassword';
import AtualizacaoCadastral from './pages/AtualizacaoCadastral';
import { Presentation } from './pages/presentation/Presentation';
import { BackupService } from './lib/BackupService';
import { useEffect } from 'react';

// CRM Components
import { Dashboard as CrmDashboard } from './components/crm/Dashboard';
import { Clients } from './components/crm/Clients';
import { Magistrados } from './components/crm/Magistrados';
import { IncompleteClients } from './components/crm/IncompleteClients';
import { Manual } from './components/crm/Manual';
import { Kanban as CrmKanban } from './components/crm/Kanban';
import { Settings } from './components/Settings';

// RH Components
import { RHDashboard } from './components/collaborators/pages/RHDashboard';
import { Calendario as CalendarioRH } from './components/collaborators/pages/Calendario';
import { Presencial } from './components/collaborators/pages/Presencial';
import { Colaboradores } from './components/collaborators/pages/Colaboradores';
import { RHEvolucaoPessoal } from './components/collaborators/pages/RHEvolucaoPessoal';
import { RHTempoCasa } from './components/collaborators/pages/RHTempoCasa';
import { RHHeadcount } from './components/collaborators/pages/RHHeadcount';
import { RHTurnover } from './components/collaborators/pages/RHTurnover';
import { RHVagas } from './components/collaborators/pages/RHVagas';
import { RHAcoes } from './components/collaborators/pages/RHAcoes';
import { RHGED } from './components/collaborators/pages/RHGED';

// Financeiro Components
import { FinanceDashboard } from './components/finance/pages/FinanceDashboard';
import { FinanceContasPagar } from './components/finance/pages/FinanceContasPagar';
import { FinanceContasReceber } from './components/finance/contasareceber/pages/FinanceContasReceber';
import { ListaOAB } from './components/finance/pages/ListaOAB';
import { GestaoAeronave } from './pages/GestaoAeronave';
import { GED as FinanceGED } from './components/finance/pages/GED';

// Executivo Components
import { SecretariaExecutivaDashboard } from './components/secretaria/pages/SecretariaExecutivaDashboard';
import { SecretariaExecutivaCalendario } from './components/secretaria/pages/SecretariaExecutivaCalendario';
import { SecretariaExecutivaDespesas } from './components/secretaria/pages/SecretariaExecutivaDespesas';
import { SecretariaExecutivaGED } from './components/secretaria/pages/SecretariaExecutivaGED';
import { GestaoFamilia } from './components/secretaria/GestaoFamilia';

// Controladoria Components
import { Dashboard as ControlDashboard } from './components/controladoria/pages/Dashboard';
import { Contracts as ControlContracts } from './components/controladoria/pages/Contracts';
import { Clients as ControlClients } from './components/controladoria/pages/Clients';
import { Kanban as ControlKanban } from './components/controladoria/pages/Kanban';
import { Finance as ControlFinance } from './components/controladoria/pages/Finance';
import { GED as ControlGED } from './components/controladoria/pages/GED';
import { Proposals as ControlProposals } from './components/controladoria/pages/Proposals';
import { Jurimetria as ControlJurimetria } from './components/controladoria/pages/Jurimetria';
import { Volumetry as ControlVolumetry } from './components/controladoria/pages/Volumetry';
import { History as ControlHistory } from './components/controladoria/pages/History';
import { Settings as ControlSettings } from './components/controladoria/pages/Settings';
import { Compliance as ControlCompliance } from './components/controladoria/pages/Compliance';

// Operational Components
import { Dashboard as OperationalDashboard } from './components/operational/pages/Dashboard';
import { Produtos as OperationalProdutos } from './components/operational/pages/Produtos';
import { Estoque as OperationalEstoque } from './components/operational/pages/Estoque';
import { Imobiliario as OperationalImobiliario } from './components/operational/pages/Imobiliario';
import { Compras } from './components/operational/pages/Compras';

import { useState } from 'react';

// Wrapper for Protected Routes to inject props
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { session, loading, isAuthorized, signOut } = useAuth();

    if (loading || isAuthorized === null) return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;

    if (!session) return <Navigate to="/login" replace />;

    if (isAuthorized === false) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=')] opacity-50 z-0"></div>
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-[#1e3a8a] via-[#d4af37] to-[#1e3a8a]"></div>

                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full text-center relative z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <ShieldAlert className="w-10 h-10 text-[#1e3a8a]" />
                    </div>
                    <h1 className="text-2xl font-black text-[#0a192f] mb-3 tracking-tight">Acesso Restrito</h1>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
                        Sua conta foi vinculada com sucesso, mas o seu perfil está <strong className="text-gray-800 font-bold">aguardando autorização</strong> do administrador para acessar o sistema.
                    </p>
                    <button
                        onClick={signOut}
                        className="w-full py-4 px-6 bg-[#0a192f] hover:bg-[#112240] text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da Conta
                    </button>
                </div>
                <div className="mt-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Salomão Manager © {new Date().getFullYear()}
                </div>
            </div>
        );
    }

    return children;
};

// Component helper to inject frequent props
const WithProps = ({ Component, extraProps = {} }: { Component: any, extraProps?: any }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const getUserDisplayName = () => {
        if (!user?.email) return 'Usuário';
        return user.email.split('@')[0].split('.').map((p: any) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    };

    const commonProps = {
        userName: getUserDisplayName(),
        onModuleHome: () => navigate('/'),
        onLogout: signOut,
        userEmail: user?.email,
        ...extraProps
    };

    return <Component {...commonProps} />;
};

export function AppRoutes() {
    const navigate = useNavigate();
    const { session } = useAuth();
    // State for CRM Filters (passing down to Clients from Dashboard)
    const [clientFilters, setClientFilters] = useState<{ socio?: string; brinde?: string }>({});

    useEffect(() => {
        if (session?.user?.email) {
            const email = session.user.email.toLowerCase();
            const ADMIN_EMAILS = ['marcio.gama@salomaoadv.com.br']; // Extendable list or fetch role

            if (ADMIN_EMAILS.includes(email)) {
                BackupService.checkAndRunAutomaticBackup();
            }
        }
    }, [session]);

    // Mapeamento de chaves de módulo para rotas
    const moduleRoutes: Record<string, string> = {
        crm: '/crm/dashboard',
        collaborators: '/rh/dashboard',
        operational: '/operational/dashboard',
        financial: '/financeiro/dashboard',
        executive: '/executivo/dashboard',
        controladoria: '/controladoria/dashboard',
        settings: '/configuracoes'
    };

    const handleCrmNavigateWithFilter = (page: string, filters: any) => {
        setClientFilters(filters);
        navigate(`/crm/${page}`);
    };

    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Public Routes accessible by everyone (including logged in users) */}
            <Route path="/atualizacao-cadastral/:token" element={<AtualizacaoCadastral />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

                {/* Home / Module Selector */}
                <Route path="/" element={
                    <WithProps Component={ModuleSelector} extraProps={{
                        onSelect: (m: string) => {
                            const path = moduleRoutes[m];
                            console.log(`[AppRoutes] Navigating to module: ${m} -> ${path}`);
                            if (path) {
                                navigate(path);
                            } else {
                                console.error(`[AppRoutes] No route found for module: ${m}`);
                            }
                        }
                    }} />
                } />

                <Route path="/apresentacao" element={<WithProps Component={Presentation} />} />
                <Route path="/configuracoes" element={<WithProps Component={Settings} />} />

                {/* CRM */}
                <Route path="/crm">
                    <Route path="dashboard" element={<WithProps Component={CrmDashboard} extraProps={{ onNavigateWithFilter: handleCrmNavigateWithFilter }} />} />
                    <Route path="clientes" element={<WithProps Component={Clients} extraProps={{ initialFilters: clientFilters }} />} />
                    <Route path="magistrados" element={<WithProps Component={Magistrados} />} />
                    <Route path="incompletos" element={<WithProps Component={IncompleteClients} />} />
                    <Route path="manual" element={<Manual />} />
                    <Route path="kanban" element={<WithProps Component={CrmKanban} />} />
                    <Route path="logistica" element={<div className="p-8 text-center text-gray-500">Módulo Logística em construção</div>} />
                </Route>

                {/* RH */}
                <Route path="/rh">
                    <Route path="dashboard" element={<WithProps Component={RHDashboard} />} />
                    <Route path="calendario" element={<WithProps Component={CalendarioRH} />} />
                    <Route path="presencial" element={<WithProps Component={Presencial} />} />
                    <Route path="colaboradores" element={<WithProps Component={Colaboradores} />} />
                    <Route path="evolucao" element={<WithProps Component={RHEvolucaoPessoal} />} />
                    <Route path="tempo-casa" element={<WithProps Component={RHTempoCasa} />} />
                    <Route path="headcount" element={<WithProps Component={RHHeadcount} />} />
                    <Route path="turnover" element={<WithProps Component={RHTurnover} />} />
                    <Route path="vagas" element={<WithProps Component={RHVagas} />} />
                    <Route path="acoes" element={<WithProps Component={RHAcoes} />} />
                    <Route path="ged" element={<WithProps Component={RHGED} />} />
                </Route>

                {/* Financeiro */}
                <Route path="/financeiro">
                    <Route path="dashboard" element={<WithProps Component={FinanceDashboard} />} />
                    <Route path="calendario" element={<WithProps Component={CalendarioRH} />} />
                    <Route path="contas-pagar" element={<WithProps Component={FinanceContasPagar} />} />
                    <Route path="contas-receber" element={<WithProps Component={FinanceContasReceber} />} />
                    <Route path="oab" element={<WithProps Component={ListaOAB} />} />
                    <Route path="gestao-aeronave" element={<WithProps Component={GestaoAeronave} />} />
                    <Route path="ged" element={<WithProps Component={FinanceGED} />} />
                </Route>

                {/* Executivo */}
                <Route path="/executivo">
                    <Route path="dashboard" element={<WithProps Component={SecretariaExecutivaDashboard} />} />
                    <Route path="calendario" element={<WithProps Component={SecretariaExecutivaCalendario} />} />
                    <Route path="agenda" element={<WithProps Component={SecretariaExecutivaCalendario} />} />
                    <Route path="despesas" element={<WithProps Component={SecretariaExecutivaDespesas} />} />
                    <Route path="ged" element={<WithProps Component={SecretariaExecutivaGED} />} />
                    <Route path="gestao-familia" element={<WithProps Component={GestaoFamilia} />} />
                </Route>

                {/* Controladoria */}
                <Route path="/controladoria">
                    <Route path="dashboard" element={<WithProps Component={ControlDashboard} />} />
                    <Route path="contratos" element={<WithProps Component={ControlContracts} />} />
                    <Route path="clientes" element={<WithProps Component={ControlClients} />} />
                    <Route path="kanban" element={<WithProps Component={ControlKanban} />} />
                    <Route path="financeiro" element={<WithProps Component={ControlFinance} />} />
                    <Route path="ged" element={<WithProps Component={ControlGED} />} />
                    <Route path="propostas" element={<WithProps Component={ControlProposals} />} />
                    <Route path="compliance" element={<WithProps Component={ControlCompliance} />} />
                    <Route path="jurimetria" element={<WithProps Component={ControlJurimetria} />} />
                    <Route path="volumetria" element={<WithProps Component={ControlVolumetry} />} />
                    <Route path="historico" element={<WithProps Component={ControlHistory} />} />
                    <Route path="configuracoes" element={<WithProps Component={ControlSettings} />} />
                </Route>

                {/* Operational */}
                <Route path="/operational">
                    <Route path="dashboard" element={<WithProps Component={OperationalDashboard} />} />
                    <Route path="produtos" element={<WithProps Component={OperationalProdutos} />} />
                    <Route path="estoque" element={<WithProps Component={OperationalEstoque} />} />
                    <Route path="imobiliario" element={<WithProps Component={OperationalImobiliario} />} />
                    <Route path="compras" element={<WithProps Component={Compras} />} />
                </Route>

                {/* Fallback for under construction modules */}

                <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
        </Routes>
    );
}
