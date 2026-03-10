import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/logger';

interface AuthContextType {
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    isResettingPassword: boolean;
    user: any; // Using any to match existing usage in App.tsx temporarily, should be refined
    isAuthorized: boolean | null;
    userRole: string | null;
}

const SESSION_COOKIE_NAME = 'app_session_active';

const setSessionCookie = () => {
    // Set a session cookie (no expires/max-age means it gets deleted when browser closes)
    document.cookie = `${SESSION_COOKIE_NAME}=true;path=/`;
};

const hasSessionCookie = () => {
    return document.cookie.includes(`${SESSION_COOKIE_NAME}=true`);
};

const clearSessionCookie = () => {
    document.cookie = `${SESSION_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    const checkAuthorization = async (currentSession: Session | null) => {
        console.log('🔍 [AuthContext] checkAuthorization init. Session exists:', !!currentSession);
        if (currentSession) {
            console.log('🔍 [AuthContext] User data:', currentSession.user);
        }
        if (!currentSession?.user) {
            setIsAuthorized(false);
            setLoading(false);
            return;
        }

        const email = currentSession.user.email?.toLowerCase();
        if (!email) {
            setIsAuthorized(false);
            setLoading(false);
            return;
        }

        if (email === 'marcio.gama@salomaoadv.com.br') {
            setIsAuthorized(true);
            setUserRole('admin');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('user_id, role')
                .eq('email', email)
                .maybeSingle();

            if (error) {
                console.error('Erro ao verificar autorização:', error);
                setIsAuthorized(false);
            } else if (data && data.user_id) {
                // Tem perfil e o user_id não é nulo -> Autorizado
                setIsAuthorized(true);
                setUserRole(data.role as string || 'user');
            } else if (data && !data.user_id) {
                // Tem perfil mas user_id é nulo -> Pendente na fila
                setIsAuthorized(false);
            } else {
                // Não tem perfil -> Insere na fila (user_id = null)
                // O nome pode ser extraído do metadata se disponível
                // const name = currentSession.user.user_metadata?.name || currentSession.user.user_metadata?.full_name || email.split('@')[0];
                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: crypto.randomUUID(),
                        email: email,
                        role: 'user',
                        allowed_modules: ['crm'] // Permissões padrão
                    });

                if (insertError) console.error('Erro ao inserir na fila de autorização:', insertError);
                setIsAuthorized(false);
            }
        } catch (err) {
            console.error('Falha na autorização:', err);
            setIsAuthorized(false);
        }

        setLoading(false);
    };

    useEffect(() => {
        // Intercept OAuth hash
        if (window.location.hash && window.location.hash.includes('access_token')) {
            console.log('🔍 [AuthContext] Hash Detected! Handing over to Supabase...');
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                checkAuthorization(session);
            });
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // If there's a session but NO session cookie, it means the browser was just reopened
                // after being closed, because session cookies don't persist across browser restarts.
                // We must log the user out to enforce the "logout on browser close" rule.
                if (!hasSessionCookie()) {
                    // Não forçar logout em rotas públicas que não precisam de sessão
                    const publicPaths = ['/candidato/perfil/', '/atualizacao-cadastral/', '/report/controladoria'];
                    const isPublicRoute = publicPaths.some(p => window.location.pathname.startsWith(p));
                    if (!isPublicRoute) {
                        console.log('🚪 Browser restart detected (no session cookie). Logging out automatically.');
                        // Don't set state, just force a sign out and let the onAuthStateChange handle the rest
                        supabase.auth.signOut().then(() => {
                            window.location.href = '/login';
                        });
                        return;
                    }
                }
                
                // Otherwise this is a normal reload or tab open with an active session cookie
                setSessionCookie();
            }
            
            setSession(session);
            checkAuthorization(session);
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
            if (event === 'SIGNED_IN') {
                setSessionCookie(); // Set cookie right when they log in
                checkAuthorization(session);
            } else if (event === 'INITIAL_SESSION') {
                // Ignore here as getSession already handles the initial session check
                // checkAuthorization is called from getSession above
            } else if (event === 'SIGNED_OUT') {
                clearSessionCookie();
                setIsAuthorized(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            // 1. Log action BEFORE clearing storage to preserve session identity
            await logAction('LOGOUT', 'AUTH', 'Usuário realizou logout', 'Logout')

            const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');

            // 2. Clear Storage
            localStorage.clear();
            sessionStorage.clear();

            // Restore welcome modal flag if it existed
            if (hasSeenWelcome) {
                localStorage.setItem('hasSeenWelcomeModal', hasSeenWelcome);
            }

            // 3. Clear Cache Storage (Broad Cleanup)
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            }

            // 4. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(reg => reg.unregister()));
            }

            // 5. Clear all cookies (including our auto-logout session cookie)
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
                // Preserve the Supabase internal auth token if it exists just in case, but clear ours
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            }
            clearSessionCookie();

            // 6. Supabase SignOut
            await supabase.auth.signOut();

            // 7. Force Hard Reload to clear in-memory state and ensure CSS/JS freshness
            window.location.href = '/login';
        } catch (error) {
            console.error('❌ Error signing out:', error);
            // Fallback reload if something fails
            window.location.href = '/login';
        }
    };

    const value = {
        session,
        loading,
        signOut,
        isResettingPassword,
        user: session?.user ?? null,
        isAuthorized,
        userRole
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
