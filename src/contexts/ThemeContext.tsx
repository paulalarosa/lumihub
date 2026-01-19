import { createContext, useContext, useEffect, useState } from "react";

// Minimal Safe Theme Context
type Theme = "dark" | "light" | "system";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "dark", storageKey = "vite-ui-theme" }: any) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
            return;
        }
        root.classList.add(theme);
    }, [theme]);

    const value = {
        theme,
        setTheme: (t: Theme) => {
            localStorage.setItem(storageKey, t);
            setTheme(t);
        },
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) return { theme: "dark", setTheme: () => { } }; // Safe fallback
    return context;
};
