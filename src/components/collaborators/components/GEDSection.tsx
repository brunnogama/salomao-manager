import React from 'react'
import { Files, Plus, Trash2, FileText, ExternalLink } from 'lucide-react'
import { SearchableSelect } from '../../crm/SearchableSelect'
import { GEDDocument } from '../../../types/controladoria'

interface GEDSectionProps {
    gedCategories: { id: string, name?: string, label?: string, value?: string }[];
    selectedGedCategory: string;
    setSelectedGedCategory: (category: string) => void;
    atestadoDatas: { inicio: string, fim: string };
    setAtestadoDatas: (updateFn: (prev: { inicio: string, fim: string }) => { inicio: string, fim: string }) => void;
    gedInputRef: React.RefObject<HTMLInputElement>;
    handleGedUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    gedDocs: GEDDocument[];
    pendingGedDocs: { file: File, category: string, label?: string, tempId: string, atestadoDatas?: { inicio: string, fim: string } }[];
    setPendingGedDocs: (updateFn: (prev: any[]) => any[]) => void;
    handleDeleteGed: (doc: GEDDocument) => void;
    hideDeleteButton?: boolean;
}

export function GEDSection({
    gedCategories,
    selectedGedCategory,
    setSelectedGedCategory,
    atestadoDatas,
    setAtestadoDatas,
    gedInputRef,
    handleGedUpload,
    gedDocs,
    pendingGedDocs,
    setPendingGedDocs,
    handleDeleteGed,
    hideDeleteButton = false
}: GEDSectionProps) {
    return (
        <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 bg-gray-50/50">
            <div className="text-center mb-6">
                <Files className="h-10 w-10 mx-auto mb-2 text-[#1e3a8a] opacity-50" />
                <h3 className="text-sm font-bold text-[#0a192f]">Arquivos Vinculados</h3>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row items-end gap-3">
                    <div className="flex-1 w-full relative z-[110]">
                        <SearchableSelect
                            label="Tipo de Documento"
                            placeholder="Selecione..."
                            value={selectedGedCategory}
                            onChange={setSelectedGedCategory}
                            options={gedCategories}
                            uppercase={false}
                        />
                    </div>

                    {selectedGedCategory === 'Atestado Médico' && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative">
                                <input
                                    type="date"
                                    className="pl-3 pr-2 py-2.5 bg-white border border-gray-200 rounded-lg text-xs w-32"
                                    value={atestadoDatas.inicio}
                                    onChange={e => setAtestadoDatas(p => ({ ...p, inicio: e.target.value }))}
                                    placeholder="Início"
                                />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="pl-3 pr-2 py-2.5 bg-white border border-gray-200 rounded-lg text-xs w-32"
                                    value={atestadoDatas.fim}
                                    onChange={e => setAtestadoDatas(p => ({ ...p, fim: e.target.value }))}
                                    placeholder="Fim"
                                />
                            </div>
                        </div>
                    )}

                    <div className="shrink-0 w-full md:w-auto">
                        <input type="file" hidden ref={gedInputRef} accept=".pdf,image/*" onChange={handleGedUpload} />
                        <button
                            disabled={!selectedGedCategory || (selectedGedCategory === 'Atestado Médico' && (!atestadoDatas.inicio || !atestadoDatas.fim))}
                            onClick={() => gedInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] hover:bg-[#112240] hover:shadow-xl disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-md active:scale-95"
                        >
                            <Plus className="h-4 w-4" /> Anexar
                        </button>
                    </div>
                </div>
            </div>

            {/* List of files (Existing + Pending) */}
            <div className="space-y-3">
                {/* Existing Files */}
                {gedDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded"><FileText className="h-4 w-4" /></div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-[#0a192f] truncate">{doc.categoria}</p>
                                <span className="text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded uppercase tracking-wider">
                                    {doc.nome_arquivo.includes('.') ? doc.nome_arquivo.split('.').pop()?.toUpperCase() : 'DOC'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 text-[#1e3a8a] hover:bg-[#1e3a8a]/10 rounded transition-all"><ExternalLink className="h-4 w-4" /></a>
                            {!hideDeleteButton && (
                                <button onClick={() => handleDeleteGed(doc)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"><Trash2 className="h-4 w-4" /></button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Pending Files */}
                {pendingGedDocs.map(doc => (
                    <div key={doc.tempId} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded"><FileText className="h-4 w-4" /></div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-[#0a192f] truncate">{doc.label || doc.category}</p>
                                <div className="flex gap-2">
                                    <span className="text-[9px] text-yellow-600 italic px-1 py-0.5">Pendente</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setPendingGedDocs(prev => prev.filter(p => p.tempId !== doc.tempId))}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {gedDocs.length === 0 && pendingGedDocs.length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-4">Nenhum documento anexado ainda.</p>
                )}
            </div>
        </div>
    )
}
