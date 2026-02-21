import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PresentationContextType {
    isPresentationMode: boolean;
    togglePresentationMode: () => void;
    setPresentationMode: (value: boolean) => void;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export function PresentationProvider({ children }: { children: ReactNode }) {
    const [isPresentationMode, setIsPresentationMode] = useState(false);

    const togglePresentationMode = () => {
        setIsPresentationMode(prev => !prev);
    };

    return (
        <PresentationContext.Provider value={{
            isPresentationMode,
            togglePresentationMode,
            setPresentationMode: setIsPresentationMode
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
