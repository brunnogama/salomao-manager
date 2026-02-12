import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ModuleSelector } from './components/ModuleSelector';
import Login from './Login';
import ResetPassword from './ResetPassword';
import { UnderConstruction } from './components/UnderConstruction';

// CRM Components
import { Dashboard as CrmDashboard } from './components/crm/Dashboard';
import { Clients } from './components/crm/Clients';
import { Magistrados } from './components/crm/Magistrados';
import { IncompleteClients } from './components/crm/IncompleteClients';
import { Manual } from './components/crm/Manual';
import { Kanban as CrmKanban } from './components/crm/Kanban';
import { History as CrmHistory } from './components/crm/History';
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
import { RHRemuneracao } from './components/collaborators/pages/RHRemuneracao';
import { RHAcoes } from './components/collaborators/pages/RHAcoes';
import { RHGED } from './components/collaborators/pages/RHGED';
import { RHKanban } from './components/collaborators/pages/RHKanban';

// Financeiro Components
import { FinanceDashboard } from './components/finance/pages/FinanceDashboard';
import { Calendario as CalendarioFinanceiro } from './components/finance/pages/Calendario';
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
import { useState } from 'react';

// Wrapper for Protected Routes to inject props
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { session, loading } = useAuth();

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#112240]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;

    if (!session) return <Navigate to="/login" replace />;

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
    // State for CRM Filters (passing down to Clients from Dashboard)
    const [clientFilters, setClientFilters] = useState<{ socio?: string; brinde?: string }>({});

    // Mapeamento de chaves de módulo para rotas
    const moduleRoutes: Record<string, string> = {
        crm: '/crm/dashboard',
        family: '/family/dashboard',
        collaborators: '/rh/dashboard',
        operational: '/operational/dashboard',
        financial: '/financeiro/dashboard',
        executive: '/executivo/dashboard',
        'legal-control': '/controladoria/dashboard',
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
                    <Route path="historico" element={<CrmHistory />} />
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
                    <Route path="remuneracao" element={<WithProps Component={RHRemuneracao} />} />
                    <Route path="acoes" element={<WithProps Component={RHAcoes} />} />
                    <Route path="ged" element={<WithProps Component={RHGED} />} />
                    <Route path="kanban" element={<WithProps Component={RHKanban} />} />
                </Route>

                {/* Financeiro */}
                <Route path="/financeiro">
                    <Route path="dashboard" element={<WithProps Component={FinanceDashboard} />} />
                    <Route path="calendario" element={<WithProps Component={CalendarioFinanceiro} />} />
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
                    <Route path="jurimetria" element={<WithProps Component={ControlJurimetria} />} />
                    <Route path="volumetria" element={<WithProps Component={ControlVolumetry} />} />
                    <Route path="historico" element={<WithProps Component={ControlHistory} />} />
                    <Route path="configuracoes" element={<WithProps Component={ControlSettings} />} />
                </Route>

                {/* Fallback for under construction modules */}
                <Route path="/family/*" element={<UnderConstruction moduleName="family" onBack={() => navigate('/')} />} />
                <Route path="/operational/*" element={<UnderConstruction moduleName="operational" onBack={() => navigate('/')} />} />

                <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
        </Routes>
    );
}
