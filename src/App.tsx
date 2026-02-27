import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { PresentationProvider } from './contexts/PresentationContext';
import { useEffect } from 'react';
import './index.css'; // Ensure styles are imported

export default function App() {
  console.log('🔄 App - Inicializando com Rotas');

  useEffect(() => {
    // Interceptar hash de erro retornado pelo Supabase (ex: OAuth Microsoft falho)
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get('error_description');
      if (errorDesc) {
        // Usa setTimeout para garantir que o Toast carregou
        setTimeout(() => {
          // Remove o hash feio da URL silenciosamente sem recarregar
          window.history.replaceState(null, '', window.location.pathname);
        }, 100);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        <AuthProvider>
          <PresentationProvider>
            <AppRoutes />
          </PresentationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}