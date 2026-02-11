import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorStack: string[];
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorStack: []
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🔴 ErrorBoundary capturou erro:', error);
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorStack: []
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detalhado do erro
    console.error('🔴 ERRO CAPTURADO:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      name: error.name,
      cause: (error as any).cause
    });

    // Extrai a stack trace
    const stack = error.stack?.split('\n').slice(0, 10) || [];

    this.setState({
      error,
      errorInfo,
      errorStack: stack
    });

    // Envia para o console de forma organizada
    console.group('📍 STACK TRACE DETALHADA');
    stack.forEach((line, idx) => {
      console.log(`${idx + 1}. ${line.trim()}`);
    });
    console.groupEnd();

    // Log do component stack
    if (errorInfo.componentStack) {
      console.group('📦 COMPONENT STACK');
      console.log(errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorStack: []
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-red-100">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-600">
                  Erro no Sistema
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Um erro inesperado ocorreu. Detalhes abaixo:
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Mensagem do Erro:
              </h2>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="font-mono text-sm text-red-800 break-words">
                  {this.state.error.message}
                </p>
              </div>
            </div>

            {/* Error Type */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Tipo:
              </h2>
              <p className="font-mono text-sm bg-gray-100 p-3 rounded border border-gray-200">
                {this.state.error.name}
              </p>
            </div>

            {/* Stack Trace */}
            {this.state.errorStack.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Stack Trace:
                </h2>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  {this.state.errorStack.map((line, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="text-gray-500 mr-2">{idx + 1}.</span>
                      {line.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Component Stack */}
            {this.state.errorInfo?.componentStack && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Componente que Falhou:
                </h2>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <pre className="font-mono text-xs text-blue-900 overflow-x-auto whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Tentar Novamente
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
              >
                <Home className="w-5 h-5" />
                Voltar ao Início
              </button>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                <strong>💡 Para Desenvolvedores:</strong> Abra o Console do Navegador (F12) para ver logs detalhados.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}