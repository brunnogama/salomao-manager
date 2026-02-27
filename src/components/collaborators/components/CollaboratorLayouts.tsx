import React from 'react'
import { X, Users } from 'lucide-react'

interface LayoutProps {
    title: string
    onClose: () => void
    activeTab: number
    setActiveTab: (id: number) => void
    children: React.ReactNode
    footer?: React.ReactNode
    sidebarContent?: React.ReactNode
    isEditMode?: boolean
    currentSteps: { id: number; label: string; icon: any }[]
}

// Layout Original em Modal (Exclusivo para Visualização)
export const CollaboratorModalLayout = ({
    title,
    onClose,
    activeTab,
    setActiveTab,
    children,
    footer,
    sidebarContent,
    isEditMode = false,
    currentSteps
}: LayoutProps) => {
    return (
        <div className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-7xl max-h-[95vh] flex overflow-hidden animate-in zoom-in-50 duration-300 shadow-2xl border border-gray-200 relative">
                {/* Left Sidebar */}
                <div className="w-80 bg-white border-r border-gray-100 flex flex-col py-10 px-6 shrink-0 overflow-y-auto no-scrollbar">
                    {/* Photo Area */}
                    <div className="mb-10 flex justify-center">{sidebarContent}</div>
                    {/* Vertical Tabs */}
                    <div className="space-y-1 w-full">
                        {currentSteps.map((step: any) => {
                            const Icon = step.icon
                            const isActive = activeTab === step.id
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setActiveTab(step.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left relative group ${isActive
                                        ? isEditMode ? 'text-amber-600 bg-amber-50 font-bold shadow-sm' : 'text-[#1e3a8a] bg-blue-50 font-bold shadow-sm'
                                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                        }`}
                                >
                                    <div className={`p-1 rounded-lg transition-colors ${isActive ? (isEditMode ? 'text-amber-600' : 'text-[#1e3a8a]') : 'text-gray-300 group-hover:text-gray-500'}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">{step.label}</span>
                                    {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 ${isEditMode ? 'bg-amber-500' : 'bg-[#1e3a8a]'} rounded-r-full`} />}
                                </button>
                            )
                        })}
                    </div>
                </div>
                {/* Right Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
                    {/* Content Header (Title + Close) */}
                    <div className="px-12 py-8 pb-2 flex justify-between items-center shrink-0">
                        <h2 className="text-3xl font-black text-[#0a192f] tracking-tight">{title}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-red-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto px-12 py-6 pb-32 custom-scrollbar">
                        {children}
                    </div>
                    {/* Footer */}
                    {footer && (
                        <div className="px-12 py-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Layout Espaçoso em Tela Cheia (Exclusivo para Formulários)
export const CollaboratorPageLayout = ({
    title,
    onClose,
    activeTab,
    setActiveTab,
    children,
    footer,
    sidebarContent,
    isEditMode = false,
    currentSteps
}: LayoutProps) => {
    return (
        <div className="absolute inset-0 z-[100] bg-gray-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            {/* PAGE HEADER COMPLETO - Restored to System Standard */}
            <div className="flex items-center justify-between bg-white px-8 py-4 border-b border-gray-200 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all hover:-translate-x-1 shrink-0"
                        title="Voltar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4 border-l border-gray-200 pl-4 ml-2">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
                                {title}
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">
                                {isEditMode ? 'Formulário de Cadastro' : 'Visualização de Perfil'}
                            </p>
                        </div>
                    </div>
                </div>
                {footer && (
                    <div className="flex items-center gap-4">
                        {footer}
                    </div>
                )}
            </div>

            {/* PAGE BODY */}
            <div className="flex-1 flex overflow-hidden w-full max-w-[1700px] mx-auto bg-white border-x border-gray-100 shadow-sm">
                {/* Left Sidebar */}
                <div className="w-80 bg-gray-50/50 border-r border-gray-100 flex flex-col py-6 px-6 shrink-0 overflow-y-auto no-scrollbar">
                    {/* Photo Area */}
                    <div className="mb-6 flex justify-center">
                        {sidebarContent}
                    </div>

                    {/* Vertical Tabs */}
                    <div className="space-y-0.5 w-full">
                        {currentSteps.map((step: any) => {
                            const Icon = step.icon
                            const isActive = activeTab === step.id
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setActiveTab(step.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left relative group ${isActive
                                        ? isEditMode ? 'text-amber-600 bg-amber-50 font-bold shadow-sm border border-amber-100/50' : 'text-[#1e3a8a] bg-blue-50 font-bold shadow-sm border border-blue-100/50'
                                        : 'text-gray-500 hover:bg-white hover:shadow-sm hover:border-gray-100 border border-transparent'
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? (isEditMode ? 'text-amber-600 bg-amber-100' : 'text-white bg-[#1e3a8a]') : 'text-gray-400 group-hover:text-gray-600 bg-gray-100 group-hover:bg-gray-200'}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-[0.2em]">{step.label}</span>
                                    {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 ${isEditMode ? 'bg-amber-500' : 'bg-[#1e3a8a]'} rounded-r-full`} />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                    <div className="max-w-5xl mx-auto px-12 py-10 pb-32">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
