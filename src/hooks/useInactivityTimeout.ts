import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityTimeoutOptions {
    onWarning: () => void;
    onIdle: () => void;
    warningTimeoutMs?: number; // Time before warning (default: 25 mins)
    idleTimeoutMs?: number;    // Time before actual logout (default: 30 mins)
}

export function useInactivityTimeout({
    onWarning,
    onIdle,
    warningTimeoutMs = 25 * 60 * 1000,
    idleTimeoutMs = 30 * 60 * 1000,
}: UseInactivityTimeoutOptions) {
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const onWarningRef = useRef(onWarning);
    const onIdleRef = useRef(onIdle);

    // Keep refs updated
    useEffect(() => {
        onWarningRef.current = onWarning;
        onIdleRef.current = onIdle;
    }, [onWarning, onIdle]);

    const resetTimers = useCallback(() => {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

        warningTimerRef.current = setTimeout(() => {
            onWarningRef.current();
        }, warningTimeoutMs);

        idleTimerRef.current = setTimeout(() => {
            onIdleRef.current();
        }, idleTimeoutMs);
    }, [warningTimeoutMs, idleTimeoutMs]);

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

        const handleActivity = () => {
            resetTimers();
        };

        // Initialize timers
        resetTimers();

        // Attach event listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            // Cleanup event listeners
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            // Cleanup timers
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [resetTimers]);

    return { resetTimers };
}
