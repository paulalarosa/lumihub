import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";
import "./lib/chart-setup";


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
