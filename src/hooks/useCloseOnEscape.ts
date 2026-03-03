import { useEffect, useRef } from 'react';

export function useCloseOnEscape(isOpen: boolean, onClose: () => void) {
    const onCloseRef = useRef(onClose);

    // Keep the latest onClose function
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCloseRef.current();
            }
        };

        // Use capture phase to intercept before other handlers if needed
        document.addEventListener('keydown', handleEscape, true);
        return () => document.removeEventListener('keydown', handleEscape, true);
    }, [isOpen]);
}
