import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AuthLayout() {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        if (location.pathname === '/login') {
            return (
                <div className="min-h-screen flex w-full bg-white">
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[#f8fafc]">
                        <Loader2 className="h-8 w-8 animate-spin text-[#0a192f]" />
                    </div>
                    <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] items-center justify-center overflow-hidden">
                        <div
                            className="absolute inset-0 z-0 bg-cover bg-center opacity-70 mix-blend-overlay"
                            style={{ backgroundImage: "url('/foto-fundo.jpg')" }}
                        ></div>
                        <div className="absolute inset-0 z-1 bg-gradient-to-br from-[#0a192f]/80 via-[#0a0a0a]/70 to-[#1a2c4e]/80"></div>
                        <div className="absolute inset-0 z-5 opacity-[0.03]" style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                            backgroundSize: '48px 48px'
                        }}></div>
                    </div>
                </div>
            );
        }

        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-[#0a192f]" />
            </div>
        );
    }

    // If user is authenticated, redirect to home
    if (session) {
        return <Navigate to="/" replace />;
    }

    // Render child routes (Login, ResetPassword) without extra styling wrappers
    // allowing them to control their own full-screen layouts.
    return <Outlet />;
}
