import React, { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface CopyChartButtonProps {
    targetId: string;
}

export function CopyChartButton({ targetId }: CopyChartButtonProps) {
    const [isCopying, setIsCopying] = useState(false);

    const handleCopy = async () => {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) {
            toast.error('Elemento não encontrado para copiar.');
            return;
        }

        setIsCopying(true);
        try {
            const canvas = await html2canvas(targetElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#F8FAFC',
                windowWidth: 1920,
            });

            canvas.toBlob((blob) => {
                if (!blob) {
                    toast.error('Erro ao gerar imagem para área de transferência.');
                    return;
                }
                navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]).then(() => {
                    toast.success('Gráfico copiado para a área de transferência!');
                }).catch(err => {
                    console.error("Erro ao copiar para clipboard:", err);
                    toast.error('Erro ao acessar a área de transferência.');
                });
            }, 'image/png');

        } catch (error) {
            console.error("Erro ao exportar gráfico:", error);
            toast.error('Ocorreu um erro ao copiar o gráfico.');
        } finally {
            setIsCopying(false);
        }
    };

    return (
        <button
            onClick={handleCopy}
            disabled={isCopying}
            title="Copiar Gráfico"
            className="flex justify-center items-center w-8 h-8 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-[#0a192f] transition-all border border-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isCopying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Copy className="w-4 h-4" />
            )}
        </button>
    );
}
