import { useEffect } from 'react';

/**
 * Hook to handle Escape key press to trigger a callback (e.g., closing a modal).
 * @param isOpen Whether the modal/component is open.
 * @param onClose Callback function to call when ESC is pressed.
 */
export function useEscKey(isOpen: boolean, onClose: () => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
}
