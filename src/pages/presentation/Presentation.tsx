import React, { useEffect, useState } from 'react';
import {
    ShieldCheck,
    Lock,
    Database,
    Zap,
    Cloud,
    ArrowLeft,
    CheckCircle2,
    Fingerprint,
    RefreshCw,
    Globe,
    HardDrive
} from 'lucide-react';

interface PresentationProps {
    onModuleHome: () => void;
    userName: string;
}

export function Presentation({ onModuleHome }: PresentationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const sections = [
        {
            title: "O que é o Ecossistema Manager?",
            description: "Uma plataforma digital de alta performance desenvolvida exclusivamente para o escritório Salomão Advogados, integrando todas as áreas operacionais e estratégicas em um único ambiente seguro.",
            icon: <Globe className="w-12 h-12 text-[#d4af37]" />,
            features: [
                "Integração total entre CRM, RH, Financeiro e Controladoria",
                "Interface moderna e intuitiva para facilitar o dia a dia",
                "Acesso rápido a informações críticas em tempo real"
            ]
        },
        {
            title: "Segurança e Nuvem Global",
            description: "Nossos dados não estão em um servidor local. Utilizamos o Supabase, uma plataforma de nível empresarial que roda na infraestrutura da Amazon (AWS).",
            icon: <Cloud className="w-12 h-12 text-[#d4af37]" />,
            features: [
                "Hospedagem em data centers da Amazon Web Services (AWS)",
                "Segurança física e lógica de padrão internacional",
                "Disponibilidade global com latência mínima"
            ]
        },
        {
            title: "Banco de Dados Inteligente",
            description: "Utilizamos o PostgreSQL, o banco de dados mais avançado do mundo, otimizado para lidar com grandes volumes de dados jurídicos com segurança absoluta.",
            icon: <Database className="w-12 h-12 text-[#d4af37]" />,
            features: [
                "Sincronização instantânea em múltiplos dispositivos",
                "Backup automático de hora em hora",
                "Recuperação de dados em caso de falhas críticas"
            ]
        }
    ];

    return (
        <div className={`min-h-screen bg-[#0a192f] text-white transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#d4af37]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <header className="relative z-50 p-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md sticky top-0">
                <button
                    onClick={onModuleHome}
                    className="flex items-center gap-2 text-white/70 hover:text-[#d4af37] transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold uppercase tracking-widest text-xs">Voltar</span>
                </button>
                <img src="/logo-salomao.png" alt="Salomão" className="h-10 brightness-0 invert" />
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Apresentação Técnica</span>
                    <span className="text-sm font-bold text-[#d4af37]">Manager Ecosystem</span>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
                {/* Intro */}
                <section className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                        Tecnologia e <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#fcc200]">Segurança</span>
                    </h1>
                    <p className="text-xl text-blue-100/70 max-w-3xl mx-auto leading-relaxed">
                        Uma visão executiva sobre a infraestrutura digital que sustenta a operação do escritório Salomão, utilizando o que há de mais moderno na nuvem da Amazon (AWS).
                    </p>
                </section>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {sections.map((section, idx) => (
                        <div
                            key={idx}
                            className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-[#d4af37]/50 transition-all duration-500 hover:-translate-y-2 group"
                            style={{ transitionDelay: `${idx * 150}ms` }}
                        >
                            <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500">
                                {section.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-[#d4af37] transition-colors">
                                {section.title}
                            </h3>
                            <p className="text-blue-100/60 leading-relaxed mb-6">
                                {section.description}
                            </p>
                            <ul className="space-y-3">
                                {section.features.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-3 text-sm font-medium text-blue-100/80">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Security Deep Dive (Simplified) */}
                <section className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 rounded-[2.5rem] p-12 border border-white/10 relative overflow-hidden mb-24">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Fingerprint className="w-64 h-64 text-[#d4af37]" />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-black mb-8">Por que o Manager é seguro?</h2>

                            <div className="space-y-8">
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-[#d4af37]/20 flex items-center justify-center shrink-0">
                                        <Lock className="w-6 h-6 text-[#d4af37]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Padrão Amazon (AWS)</h4>
                                        <p className="text-blue-100/60 text-sm leading-relaxed">
                                            Nossa infraestrutura está hospedada na Amazon Web Services, a mesma utilizada por bancos e governos em todo o mundo. Isso garante que seus dados estão protegidos por camadas de segurança física e eletrônica de última geração.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-[#d4af37]/20 flex items-center justify-center shrink-0">
                                        <HardDrive className="w-6 h-6 text-[#d4af37]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Supabase: Tecnologia de Ponta</h4>
                                        <p className="text-blue-100/60 text-sm leading-relaxed">
                                            O Supabase atua como o cérebro das nossas operações. Ele gerencia o banco de dados de forma que cada registro é criptografado e isolado, garantindo que apenas usuários autorizados tenham acesso à informação correta.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-[#d4af37]/20 flex items-center justify-center shrink-0">
                                        <RefreshCw className="w-6 h-6 text-[#d4af37]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Sincronização em Tempo Real</h4>
                                        <p className="text-blue-100/60 text-sm leading-relaxed">
                                            Quando um dado é atualizado no financeiro, a informação reflete instantaneamente para os sócios. Não há risco de trabalhar com dados defasados. A informação é viva e atualizada em milissegundos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0a192f] rounded-3xl p-8 border border-white/5 shadow-2xl relative">
                            <div className="absolute -top-4 -right-4 bg-emerald-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-[#0a192f]">
                                Live Status
                            </div>
                            <h5 className="text-sm font-bold mb-6 text-white/40 uppercase tracking-widest">Infraestrutura Técnica</h5>
                            <div className="space-y-6">
                                {[
                                    { label: "Data Center (Amazon AWS)", status: "Operacional", tech: "EUA / Virginia", delay: "0s" },
                                    { label: "Banco de Dados (Supabase)", status: "Conectado", tech: "Postgres 15", delay: "0.1s" },
                                    { label: "Criptografia", status: "Ativo", tech: "AES-256", delay: "0.2s" },
                                    { label: "Rede / Firewall", status: "Seguro", tech: "Cloudflare", delay: "0.3s" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div>
                                            <div className="text-sm font-bold group-hover:text-[#d4af37] transition-colors">{item.label}</div>
                                            <div className="text-[10px] text-white/30 font-medium">{item.tech}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider font-mono">{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3 text-white/40 text-[10px] font-bold">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span>DISPONIBILIDADE: 99.9%</span>
                                    <span className="ml-auto">MONITORAMENTO 24/7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to action / Closing */}
                <section className="text-center">
                    <h2 className="text-4xl font-bold mb-8">Preparado para o futuro?</h2>
                    <button
                        onClick={onModuleHome}
                        className="px-12 py-4 rounded-full bg-[#d4af37] text-[#0a192f] font-black uppercase tracking-widest text-sm hover:bg-[#b8962f] hover:scale-105 transition-all shadow-xl shadow-[#d4af37]/20"
                    >
                        Acessar Ecossistema
                    </button>
                    <p className="mt-8 text-white/30 text-xs font-medium uppercase tracking-[0.2em]">
                        Desenvolvido por Brunno Gama em parceria com Antigravity AI
                    </p>
                </section>
            </main>

            <footer className="py-12 border-t border-white/5 text-center relative z-10">
                <img src="/logo-salomao.png" alt="Salomão" className="h-6 mx-auto mb-4 opacity-20 filter grayscale brightness-200" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">PRIVACY • SECURITY • EFFICIENCY</p>
            </footer>
        </div>
    );
}
