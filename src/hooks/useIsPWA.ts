import { useState, useEffect } from 'react';

export const useIsPWA = () => {
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        const isInstalled =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        setIsPWA(isInstalled);
    }, []);

    return isPWA;
};
