import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";
import "./lib/chart-setup";
import { registerSW } from 'virtual:pwa-register';

// Registrar service worker
const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('Nova versão disponível! Atualizar agora?')) {
            updateSW(true);
        }
    },
    onOfflineReady() {
        console.log('App pronto para funcionar offline!');
    },
});


import { LanguageProvider } from "@/contexts/LanguageContext";

import { ThemeProvider } from "@/contexts/ThemeContext";

import { HelmetProvider } from 'react-helmet-async';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <LanguageProvider>
            <HelmetProvider>
                <QueryClientProvider client={queryClient}>
                    <App />
                </QueryClientProvider>
            </HelmetProvider>
        </LanguageProvider>
    </ThemeProvider>
);
