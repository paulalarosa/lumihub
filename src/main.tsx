import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
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
        console.log('Protocol_Ready: System_Available_Offline');
    },
});

import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ErrorBoundary>
            <HelmetProvider>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                        <LanguageProvider>
                            <App />
                        </LanguageProvider>
                    </ThemeProvider>
                </QueryClientProvider>
            </HelmetProvider>
        </ErrorBoundary>
    </StrictMode>
);
