import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar as CrmSidebar } from '../components/crm/Sidebar';
import { Sidebar as RhSidebar } from '../components/collaborators/Sidebar';
import { Sidebar as ExecutiveSidebar } from '../components/secretaria/Sidebar';
import { SidebarFinanceiro } from '../components/finance/SidebarFinanceiro';
import { Sidebar as ControladoriaSidebar } from '../components/layout/Sidebar';
import { Sidebar as OperationalSidebar } from '../components/operational/Sidebar';
import { WelcomeModal } from '../components/WelcomeModal';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import { InactivityModal } from '../components/common/InactivityModal';
import { useAuth } from '../contexts/AuthContext';
import { usePresentation } from '../contexts/PresentationContext';

export function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showInactivityModal, setShowInactivityModal] = useState(false);
    const [minutesLeft, setMinutesLeft] = useState(1);
    const location = useLocation();
    const path = location.pathname;
    const { signOut } = useAuth();
    const { isPresentationMode } = usePresentation();
    const [isHoveringEdge, setIsHoveringEdge] = useState(false);

    // Setup inactivity monitoring
    const { resetTimers } = useInactivityTimeout({
        onWarning: () => {
            setShowInactivityModal(true);
            setMinutesLeft(1); // 1 minute to respond
        },
        onIdle: () => {
            setShowInactivityModal(false);
            signOut();
        },
        warningTimeoutMs: 30 * 60 * 1000, // 30 minutes
        idleTimeoutMs: 31 * 60 * 1000,    // 31 minutes (30 + 1)
    });

    const handleExtendSession = () => {
        setShowInactivityModal(false);
        resetTimers();
    };

    // Determine which sidebar to show based on the current path
    const renderSidebar = () => {
        // Pages that don't have a specific module sidebar
        if (['/configuracoes', '/apresentacao', '/'].includes(path)) {
            return null;
        }

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
        if (path.startsWith('/operational')) {
            return (
                <OperationalSidebar
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

    // Logic for presentation mode hiding the sidebar unless hovered
    const shouldShowSidebar = !isRoot && (!isPresentationMode || isHoveringEdge);

    return (
        <div
            className="flex h-screen bg-gray-100 overflow-hidden w-full relative"
            onMouseMove={(e) => {
                if (isPresentationMode) {
                    // Show sidebar if mouse is within left 50px. Keep it open if cursor is over sidebar (< 260px)
                    setIsHoveringEdge(prev => prev ? e.clientX < 260 : e.clientX < 50);
                }
            }}
            onMouseLeave={() => setIsHoveringEdge(false)}
        >
            <Toaster position="top-right" richColors closeButton />
            <WelcomeModal />
            <InactivityModal
                isOpen={showInactivityModal}
                onClose={handleExtendSession}
                onLogout={signOut}
                minutesLeft={minutesLeft}
            />

            {/* Sidebar with dynamic visibility */}
            <div
                className={`transition-all duration-300 ease-in-out z-40 ${isPresentationMode
                    ? (isHoveringEdge ? 'absolute left-0 h-full shadow-2xl' : 'absolute -left-full h-full')
                    : 'relative flex-shrink-0'
                    }`}
            >
                {shouldShowSidebar && renderSidebar()}
            </div>

            {/* Main content area */}
            <main className={`flex-1 flex flex-col h-screen overflow-hidden min-w-0 transition-all duration-300`}>
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

