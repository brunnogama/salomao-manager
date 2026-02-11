import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    isResettingPassword: boolean;
    user: any; // Using any to match existing usage in App.tsx temporarily, should be refined
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state changed:', event);
            setSession(session);
            if (event === 'PASSWORD_RECOVERY') {
                setIsResettingPassword(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');
            localStorage.clear();
            sessionStorage.clear();

            // Restore welcome modal flag if it existed
            if (hasSeenWelcome) {
                localStorage.setItem('hasSeenWelcomeModal', hasSeenWelcome);
            }

            await supabase.auth.signOut();
            // No need to reload window with React Router, we just redirect
        } catch (error) {
            console.error('❌ Error signing out:', error);
        }
    };

    const value = {
        session,
        loading,
        signOut,
        isResettingPassword,
        user: session?.user ?? null
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
