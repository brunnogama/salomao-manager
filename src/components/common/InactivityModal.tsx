import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, Clock } from 'lucide-react';

interface InactivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    minutesLeft: number;
}

export function InactivityModal({ isOpen, onClose, onLogout, minutesLeft }: InactivityModalProps) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-8 border border-gray-100">
                                <div>
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 ring-8 ring-orange-50">
                                        <Clock className="h-8 w-8 text-orange-600 animate-pulse" aria-hidden="true" />
                                    </div>
                                    <div className="mt-6 text-center">
                                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                                            Aviso de Inatividade
                                        </Dialog.Title>
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Sua sessão irá expirar em aproximadamente <span className="font-semibold text-gray-900">{minutesLeft} minutos</span> devido à inatividade.
                                                Deseja continuar conectado?
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-blue-500 hover:to-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto transition-all"
                                        onClick={onClose}
                                    >
                                        Estender Sessão
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:w-auto transition-all"
                                        onClick={onLogout}
                                    >
                                        Sair Agora
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
