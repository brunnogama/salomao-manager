import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { PresentationProvider } from './contexts/PresentationContext';
import './index.css'; // Ensure styles are imported

export default function App() {
  console.log('🔄 App - Inicializando com Rotas');

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