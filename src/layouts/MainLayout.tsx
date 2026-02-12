import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar as CrmSidebar } from '../components/crm/Sidebar';
import { Sidebar as RhSidebar } from '../components/collaborators/Sidebar';
import { Sidebar as ExecutiveSidebar } from '../components/secretaria/Sidebar';
import { SidebarFinanceiro } from '../components/finance/SidebarFinanceiro';
import { Sidebar as ControladoriaSidebar } from '../components/layout/Sidebar';
import { WelcomeModal } from '../components/WelcomeModal';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const path = location.pathname;

    // Determine which sidebar to show based on the current path
    const renderSidebar = () => {
        if (path.startsWith('/crm')) {
            return (
                <CrmSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            );
        }
        if (path.startsWith('/rh')) {
            return (
                <ErrorBoundary>
                    <RhSidebar
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </ErrorBoundary>
            );
        }
        if (path.startsWith('/financeiro')) {
            return (
                <SidebarFinanceiro
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            );
        }
        if (path.startsWith('/executivo')) {
            return (
                <ExecutiveSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            );
        }
        if (path.startsWith('/controladoria')) {
            return (
                <ControladoriaSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            );
        }
        console.log('[MainLayout] No matching sidebar for path:', path);
        return null;
    };

    // If we are at the root path, we don't show any sidebar (Module Selector is shown)
    const isRoot = path === '/';

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden w-full">
            <Toaster position="top-right" richColors closeButton />
            <WelcomeModal />

            {!isRoot && renderSidebar()}

            <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {!isRoot && (
                    <div className="md:hidden bg-white border-b px-4 py-3 flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
