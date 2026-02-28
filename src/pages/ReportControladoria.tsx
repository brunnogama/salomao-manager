import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertTriangle, Scale } from 'lucide-react';
import { Dashboard as ControlDashboard } from '../components/controladoria/pages/Dashboard';
import { supabase } from '../lib/supabase'; // Assuming supabase client is exported from this path

export default function ReportControladoria() {
    const [searchParams] = useSearchParams();
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const tokenUrl = searchParams.get('token');

    useEffect(() => {
        async function validateTokenAndLogin() {
            if (!tokenUrl) {
                setIsValidToken(false);
                return;
            }

            try {
                // Verifica no banco de dados se esse token existe e está ativo
                // Criaremos um token estático ou usaremos o da tabela 'system_settings' futuramente.
                // Para acelerar a automação provisória via Make, podemos usar uma validação via Env ou token fixo (seguro apenas para leitura)
                const EXPECTED_REPORT_TOKEN = import.meta.env.VITE_REPORT_TOKEN || 'SLM-CTRL-89XF-2026';

                if (tokenUrl === EXPECTED_REPORT_TOKEN) {
                    // Precisamos fazer login silencioso para passar pelo RLS (Segurança de Linhas) do Supabase
                    const botEmail = import.meta.env.VITE_REPORT_USER;
                    const botPass = import.meta.env.VITE_REPORT_PASSWORD;

                    if (!botEmail || !botPass) {
                        setAuthError("Credenciais do robô ausentes no arquivo .env");
                        setIsValidToken(false);
                        return;
                    }

                    const { error } = await supabase.auth.signInWithPassword({
                        email: botEmail,
                        password: botPass,
                    });

                    if (error) {
                        setAuthError("O autorizador do robô falhou (Email/Senha inválidos no .env).");
                        setIsValidToken(false);
                    } else {
                        setIsValidToken(true);
                    }
                } else {
                    setIsValidToken(false);
                }
            } catch (err) {
                setIsValidToken(false);
                setAuthError("Ocorreu um erro inesperado durante a validação.");
            }
        }

        validateTokenAndLogin();
    }, [tokenUrl]);

    if (isValidToken === null) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a] mb-4" />
                <p className="text-gray-500 font-medium text-sm animate-pulse">Autenticando Robô na Nuvem...</p>
            </div>
        );
    }

    if (isValidToken === false) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <AlertTriangle className="h-16 w-16 text-amber-500 mb-6 drop-shadow-sm" />
                <h1 className="text-2xl font-black text-[#0a192f] mb-2 tracking-tight">Cofre Fechado</h1>
                <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                    {authError || "O token fornecido expirou ou é inválido."}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white max-w-[1280px] mx-auto p-4 report-container">
            {/* 
        Container especial do Report que carrega o Dashboard da Controladoria
        * injeta props vazias para evitar erros do useAuth
        * esconde botões export, navbar e backgrounds com CSS local
      */}
            <style>{`
        body { background: white !important; }
        .report-container #dashboard-filters { display: none !important; }
        .report-container button { display: none !important; } /* Esconde botões geradores */
      `}</style>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="bg-[#0a192f] p-2 rounded-lg">
                    <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-[#0a192f] tracking-tighter">Salomão Advogados</h2>
                    <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest leading-none mt-1">
                        Panorama Geral • Controladoria
                    </p>
                </div>
            </div>

            {/* 
        A Controladoria precisa apenas dos dados onModuleHome e onLogout vazios já que é visualização estática 
      */}
            <ControlDashboard
                userName="Bot Make.com"
                onModuleHome={() => { }}
                onLogout={() => { }}
            />

            <div className="mt-12 pt-6 border-t border-gray-100 text-center pb-8">
                <p className="text-xs font-bold text-gray-400">
                    Relatório Semanal Gerado Automaticamente em {new Date().toLocaleDateString('pt-BR')}
                </p>
            </div>
        </div>
    );
}
