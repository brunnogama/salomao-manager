import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PresentationContextType {
    isPresentationMode: boolean;
    togglePresentationMode: () => void;
    setPresentationMode: (value: boolean) => void;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export function PresentationProvider({ children }: { children: ReactNode }) {
    const [isPresentationMode, setIsPresentationMode] = useState(false);

    const togglePresentationMode = async () => {
        try {
            if (!isPresentationMode) {
                await document.documentElement.requestFullscreen();
            } else {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                }
            }
        } catch (err) {
            console.error('Erro ao alternar modo tela cheia:', err);
        }
        setIsPresentationMode(prev => !prev);
    };

    const handleSetPresentationMode = async (value: boolean) => {
        try {
            if (value && !document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else if (!value && document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Erro ao definir modo tela cheia:', err);
        }
        setIsPresentationMode(value);
    };

    return (
        <PresentationContext.Provider value={{
            isPresentationMode,
            togglePresentationMode,
            setPresentationMode: handleSetPresentationMode
        }}>
            {children}
        </PresentationContext.Provider>
    );
}

export function usePresentation() {
    const context = useContext(PresentationContext);
    if (context === undefined) {
        throw new Error('usePresentation must be used within a PresentationProvider');
    }
    return context;
}
