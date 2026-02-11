import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AuthLayout() {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#112240]">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
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
