import { toast } from "sonner";
import * as Sentry from "@sentry/react";

interface LogOptions {
    message?: string;
    context?: Record<string, unknown>;
    tags?: Record<string, string>;
    showToast?: boolean;
}

export const logger = {
    error: (error: unknown, optionsOrContext?: LogOptions | string, maybeOptions?: LogOptions) => {
        let resolvedOptions: LogOptions = {};

        if (typeof optionsOrContext === 'string') {
            resolvedOptions = { ...maybeOptions, context: { ...maybeOptions?.context, source: optionsOrContext } };
        } else if (optionsOrContext) {
            resolvedOptions = optionsOrContext;
        }

        const {
            message = "Ocorreu um erro inesperado",
            context = {},
            tags = {},
            showToast = true
        } = resolvedOptions;

        try {
            Sentry.captureException(error, {
                extra: {
                    friendlyMessage: message,
                    ...context,
                },
                tags: {
                    area: (context.area as string) || tags.area || 'general',
                    ...tags
                }
            });
        } catch {
            if (import.meta.env.DEV) console.warn("Sentry não disponível para log.");
        }

        if (import.meta.env.DEV) {
            console.group('🔴 [Khaos Error]');
            console.error('Mensagem:', message);
            console.error('Erro Original:', error);
            if (Object.keys(context).length > 0) console.table(context);
            console.groupEnd();
        }

        if (showToast) {
            toast.error(message, {
                description: "Nossa equipe técnica já foi notificada e está analisando.",
                duration: 5000,
            });
        }
    },

    success: (message: string, description?: string) => {
        toast.success(message, {
            description,
            duration: 3000,
        });
    },

    info: (message: string, context?: Record<string, unknown>) => {
        if (import.meta.env.DEV) {
            console.info(`ℹ️ [Khaos Info]: ${message}`, context);
        }
        try {
            Sentry.addBreadcrumb({
                category: 'action',
                message,
                level: 'info',
                data: context
            });
        } catch {
            // Sentry not available
        }
    }
};
