import { useState, useRef } from 'react';
import { Camera, Link as LinkIcon, Image as ImageIcon, Loader2, X } from 'lucide-react';

interface CandidatoPhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPhotoUrl: string | null;
    onPhotoSelected: (file: File | null) => void;
    onUrlUpdated: (url: string) => void;
    uploadingPhoto: boolean;
}

export function CandidatoPhotoModal({
    isOpen,
    onClose,
    currentPhotoUrl,
    onPhotoSelected,
    onUrlUpdated,
    uploadingPhoto
}: CandidatoPhotoModalProps) {
    const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || '');
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const photoInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleUrlSubmit = () => {
        onUrlUpdated(photoUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#0a192f]/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col overflow-hidden shadow-2xl relative">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-[13px] font-black tracking-widest uppercase text-[#0a192f]">
                        Alterar Foto
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl w-full">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Camera className="w-3.5 h-3.5" /> Arquivo
                        </button>
                        <button
                            onClick={() => setActiveTab('url')}
                            className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'url' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LinkIcon className="w-3.5 h-3.5" /> URL
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === 'upload' ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div
                                onClick={() => photoInputRef.current?.click()}
                                className="w-32 h-32 rounded-full bg-gray-50 border-4 border-gray-100 shadow-inner overflow-hidden flex items-center justify-center relative group cursor-pointer hover:border-[#1e3a8a]/30 transition-all"
                            >
                                {currentPhotoUrl ? (
                                    <img src={currentPhotoUrl} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <ImageIcon className="h-10 w-10 text-gray-300" />
                                )}

                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-sm">
                                        <Loader2 className="animate-spin text-white h-8 w-8" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-sm">
                                    <Camera className="text-white h-8 w-8" />
                                </div>
                            </div>
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                className="text-[10px] uppercase font-black tracking-widest text-[#1e3a8a] hover:bg-[#1e3a8a]/10 transition-colors py-2 px-6 rounded-xl border border-[#1e3a8a]/20 w-full"
                            >
                                Buscar no computador
                            </button>
                            <input
                                type="file"
                                hidden
                                ref={photoInputRef}
                                accept="image/*"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        onPhotoSelected(f);
                                        onClose();
                                    } else {
                                        onPhotoSelected(null);
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    Link da Foto (Ex: LinkedIn, etc)
                                </label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] block p-3 outline-none transition-all font-medium"
                                    value={photoUrl}
                                    onChange={e => setPhotoUrl(e.target.value)}
                                    placeholder="Cole a URL pública da imagem aqui..."
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleUrlSubmit}
                                className="w-full px-6 py-3 bg-[#1e3a8a] text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-[#112240] font-black transition-all text-[10px] uppercase tracking-widest flex justify-center items-center gap-2"
                            >
                                Salvar URL
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

