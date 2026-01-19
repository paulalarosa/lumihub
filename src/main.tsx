import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";

import { ThemeProvider } from "@/contexts/ThemeContext";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <LanguageProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </LanguageProvider>
    </ThemeProvider>
);
