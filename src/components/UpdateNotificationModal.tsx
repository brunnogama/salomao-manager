import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Sparkles, CheckCircle, Bug, Star, X } from 'lucide-react'
import { APP_UPDATES } from '../config/updates'

interface UpdateNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpdateNotificationModal({ isOpen, onClose }: UpdateNotificationModalProps) {
    const currentUpdate = APP_UPDATES[0]

    if (!currentUpdate) return null;

    const handleClose = () => {
        onClose();
    }

    if (!currentUpdate) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[200]" onClose={handleClose}>
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
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">

                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 relative">
                                    <button
                                        onClick={handleClose}
                                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-white/20 flex flex-col items-center justify-center backdrop-blur-sm shadow-inner border border-white/20 flex-shrink-0">
                                            <Sparkles className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-2">
                                                Novidades no Sistema
                                                <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">
                                                    v{currentUpdate.version}
                                                </span>
                                            </Dialog.Title>
                                            <p className="text-blue-100 mt-1 flex items-center gap-2 text-sm font-medium">
                                                {currentUpdate.date} <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span> {currentUpdate.title}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-8 py-6 max-h-[60vh] overflow-y-auto bg-gray-50/50">
                                    <p className="text-gray-600 mb-8 text-base leading-relaxed">
                                        {currentUpdate.description}
                                    </p>

                                    <div className="space-y-8">
                                        {currentUpdate.features && currentUpdate.features.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <div className="bg-green-100 p-1.5 rounded-lg flex-shrink-0">
                                                        <Star className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    Novos Recursos & Melhorias
                                                </h3>
                                                <ul className="space-y-3">
                                                    {currentUpdate.features.map((feature, index) => (
                                                        <li key={index} className="flex gap-3 text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                            <span className="leading-relaxed text-sm">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {currentUpdate.fixes && currentUpdate.fixes.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <div className="bg-orange-100 p-1.5 rounded-lg flex-shrink-0">
                                                        <Bug className="h-4 w-4 text-orange-600" />
                                                    </div>
                                                    Correções de Bugs
                                                </h3>
                                                <ul className="space-y-3">
                                                    {currentUpdate.fixes.map((fix, index) => (
                                                        <li key={index} className="flex gap-3 text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                            <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                                            <span className="leading-relaxed text-sm">{fix}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex justify-end">
                                    <button
                                        onClick={handleClose}
                                        className="bg-blue-600 text-white font-medium px-8 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
                                    >
                                        Fechar
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
