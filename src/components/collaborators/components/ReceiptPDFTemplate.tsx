import React from 'react';

interface ParsedPeriod {
    originalText: string;
    index: number;
    start: string;
    end: string;
    days: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface ReceiptPDFTemplateProps {
    collaboratorName: string;
    collaboratorCpf?: string;
    contractType: string;
    vacationReq: any;
    periods: ParsedPeriod[];
    leaderName: string;
    approvalDate: string;
    approvalTime: string;
}

export const ReceiptPDFTemplate = React.forwardRef<HTMLDivElement, ReceiptPDFTemplateProps>(({
    collaboratorName,
    collaboratorCpf,
    contractType,
    vacationReq,
    periods,
    leaderName,
    approvalDate,
    approvalTime
}, ref) => {
    return (
        <div ref={ref} style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '800px',
            backgroundColor: '#ffffff',
            padding: '40px',
            fontFamily: 'Inter, sans-serif',
            color: '#111827'
        }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <img src="/logo-salomao.png" alt="Logo Salomão" crossOrigin="anonymous" style={{ height: '35px', width: 'auto', objectFit: 'contain' }} />
                    <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '20px' }}>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                            Recibo de Solicitação de Férias
                        </h1>
                    </div>
                </div>
            </div>

            {/* Informações do Integrante */}
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Dados do Integrante
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Nome Completo</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{collaboratorName}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>CPF</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{collaboratorCpf || '-'}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Tipo de Vínculo</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{contractType || 'Não informado'}</p>
                    </div>
                </div>
            </div>

            {/* Período Aquisitivo e Férias */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                    Detalhamento das Férias
                </h3>
                
                {vacationReq?.aquisitive_period_start && vacationReq?.aquisitive_period_end && (
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Período Aquisitivo Base</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 500 }}>
                            {new Date(vacationReq.aquisitive_period_start).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} até {new Date(vacationReq.aquisitive_period_end).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </p>
                    </div>
                )}

                <div style={{ marginTop: '15px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Períodos de Gozo Solicitados</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db', textAlign: 'left' }}>
                                <th style={{ padding: '8px', textTransform: 'uppercase', color: '#4b5563', fontSize: '10px' }}>#</th>
                                <th style={{ padding: '8px', textTransform: 'uppercase', color: '#4b5563', fontSize: '10px' }}>Início</th>
                                <th style={{ padding: '8px', textTransform: 'uppercase', color: '#4b5563', fontSize: '10px' }}>Retorno</th>
                                <th style={{ padding: '8px', textTransform: 'uppercase', color: '#4b5563', fontSize: '10px' }}>Dias</th>
                                <th style={{ padding: '8px', textTransform: 'uppercase', color: '#4b5563', fontSize: '10px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map((p, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '8px', fontWeight: 700, color: '#1e3a8a' }}>{p.index}</td>
                                    <td style={{ padding: '8px' }}>{p.start}</td>
                                    <td style={{ padding: '8px' }}>{p.end}</td>
                                    <td style={{ padding: '8px' }}>{p.days}</td>
                                    <td style={{ padding: '8px', color: '#059669', fontWeight: 700 }}>✓ APROVADO</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Abono e Observações */}
            {vacationReq?.sell_vacation && (
                <div style={{ marginBottom: '30px' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Abono Pecuniário</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#111827' }}>
                        Optante pela venda de <strong>{vacationReq.sell_vacation_days} dias</strong>.
                    </p>
                </div>
            )}

            {/* Auditoria / Assinatura */}
            <div style={{ marginTop: '50px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', fontWeight: 900, color: '#065f46', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                    Aprovação Digital Confirmada
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>Aprovado Por (Líder/Gestor)</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 700, color: '#064e3b' }}>{leaderName}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#047857', textTransform: 'uppercase', fontWeight: 700 }}>Data e Hora da Validação</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: 600, color: '#064e3b' }}>{approvalDate} às {approvalTime} (Horário de Brasília)</p>
                    </div>
                </div>
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #6ee7b7' }}>
                    <p style={{ margin: 0, fontSize: '9px', color: '#059669', fontStyle: 'italic' }}>
                        Este documento foi gerado e chancelado digitalmente pela plataforma Salomão Manager. Registros de autoria, IPs e logs estão armazenados em banco de dados seguro para fins de compliance e auditoria interna.
                    </p>
                </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>
                    Código de Rastreamento: <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>{vacationReq?.id}</span>
                </p>
                <p style={{ margin: 0, fontSize: '9px', color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>Salomão Manager Platform</p>
            </div>
        </div>
    );
});

export default ReceiptPDFTemplate;
