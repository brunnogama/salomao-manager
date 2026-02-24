import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Shield, Lock, Eye, FileText, CheckCircle, X } from 'lucide-react'
import { useEscKey } from '../hooks/useEscKey'

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  useEscKey(isOpen, () => setIsOpen(false));

  useEffect(() => {
    // Verifica se o usuário já viu o modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal')

    if (!hasSeenWelcome) {
      // Aguarda 500ms para o app carregar antes de mostrar
      setTimeout(() => {
        setIsOpen(true)
      }, 500)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('hasSeenWelcomeModal', 'true')
    setIsOpen(false)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={() => { }}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-bold text-white">
                        Bem-vindo ao Salomão Manager
                      </Dialog.Title>
                      <p className="text-sm text-blue-100 mt-0.5">
                        Sistema de Gestão de Relacionamento
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-5">

                  {/* Intro */}
                  <div className="text-center">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Antes de começar, é importante que você conheça nossas práticas de <strong>proteção de dados</strong> e <strong>privacidade</strong>.
                    </p>
                  </div>

                  {/* Cards de informação */}
                  <div className="space-y-3">

                    {/* LGPD */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-blue-900 mb-1">Conformidade LGPD</h3>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            Este sistema está em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>. Todos os dados pessoais são tratados com o máximo cuidado e transparência.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confidencialidade */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Lock className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-purple-900 mb-1">Confidencialidade Total</h3>
                          <p className="text-xs text-purple-700 leading-relaxed">
                            Todas as informações armazenadas são <strong>estritamente confidenciais</strong> e protegidas por criptografia. Apenas usuários autorizados têm acesso aos dados.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Segurança */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Eye className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-green-900 mb-1">Acesso Controlado</h3>
                          <p className="text-xs text-green-700 leading-relaxed">
                            Todas as ações são <strong>registradas e auditadas</strong>. O sistema mantém histórico completo de acessos e modificações para garantir a segurança.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compromissos */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      Nossos Compromissos
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-700">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <span>Não compartilhamos seus dados com terceiros sem autorização</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <span>Você tem direito de acessar, corrigir ou excluir seus dados a qualquer momento</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <span>Mantemos backups seguros e criptografados de todas as informações</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <span>Utilizamos as melhores práticas de segurança da informação</span>
                      </li>
                    </ul>
                  </div>

                  {/* Nota final */}
                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Ao continuar, você confirma que leu e compreendeu nossas práticas de proteção de dados.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={handleAccept}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Entendi e Concordo
                  </button>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}