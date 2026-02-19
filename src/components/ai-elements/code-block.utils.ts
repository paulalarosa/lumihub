
import type { BundledLanguage, BundledTheme, HighlighterGeneric, ThemedToken } from "shiki";
import { createHighlighter } from "shiki";

// Types
export interface TokenizedCode {
    tokens: ThemedToken[][];
    fg: string;
    bg: string;
}

export interface KeyedToken {
    token: ThemedToken;
    key: string;
}

export interface KeyedLine {
    tokens: KeyedToken[];
    key: string;
}

// Utilities
export const addKeysToTokens = (lines: ThemedToken[][]): KeyedLine[] =>
    lines.map((line, lineIdx) => ({
        key: `line-${lineIdx}`,
        tokens: line.map((token, tokenIdx) => ({
            key: `line-${lineIdx}-${tokenIdx}`,
            token,
        })),
    }));

export const createRawTokens = (code: string): TokenizedCode => ({
    bg: "transparent",
    fg: "inherit",
    tokens: code.split("\n").map((line) =>
        line === ""
            ? []
            : [
                {
                    color: "inherit",
                    content: line,
                } as ThemedToken,
            ]
    ),
});

// Highlighter cache
const highlighterCache = new Map<
    string,
    Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>
>();

// Token cache
const tokensCache = new Map<string, TokenizedCode>();

// Subscribers
const subscribers = new Map<string, Set<(result: TokenizedCode) => void>>();

const getTokensCacheKey = (code: string, language: BundledLanguage) => {
    const start = code.slice(0, 100);
    const end = code.length > 100 ? code.slice(-100) : "";
    return `${language}:${code.length}:${start}:${end}`;
};

const getHighlighter = (
    language: BundledLanguage
): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> => {
    const cached = highlighterCache.get(language);
    if (cached) {
        return cached;
    }

    const highlighterPromise = createHighlighter({
        langs: [language],
        themes: ["github-light", "github-dark"],
    });

    highlighterCache.set(language, highlighterPromise);
    return highlighterPromise;
};

// Main highlight function
export const highlightCode = (
    code: string,
    language: BundledLanguage,
    callback?: (result: TokenizedCode) => void
): TokenizedCode | null => {
    const tokensCacheKey = getTokensCacheKey(code, language);

    // Return cached result if available
    const cached = tokensCache.get(tokensCacheKey);
    if (cached) {
        return cached;
    }

    // Subscribe callback if provided
    if (callback) {
        if (!subscribers.has(tokensCacheKey)) {
            subscribers.set(tokensCacheKey, new Set());
        }
        subscribers.get(tokensCacheKey)?.add(callback);
    }

    // Start highlighting in background
    getHighlighter(language)
        .then((highlighter) => {
            const availableLangs = highlighter.getLoadedLanguages();
            const langToUse = availableLangs.includes(language) ? language : "text";

            const result = highlighter.codeToTokens(code, {
                lang: langToUse,
                themes: {
                    dark: "github-dark",
                    light: "github-light",
                },
            });

            const tokenized: TokenizedCode = {
                bg: result.bg ?? "transparent",
                fg: result.fg ?? "inherit",
                tokens: result.tokens,
            };

            tokensCache.set(tokensCacheKey, tokenized);

            const subs = subscribers.get(tokensCacheKey);
            if (subs) {
                for (const sub of subs) {
                    sub(tokenized);
                }
                subscribers.delete(tokensCacheKey);
            }
        })
        .catch((error) => {
            console.error("Failed to highlight code:", error);
            subscribers.delete(tokensCacheKey);
        });

    return null;
};
