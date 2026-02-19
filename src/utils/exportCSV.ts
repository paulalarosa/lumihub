import { format } from "date-fns";
import { logger } from "@/utils/logger";

interface ExportColumn<T> {
    key: keyof T;
    label: string;
    format?: (value: T[keyof T]) => string;
}

const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";

    if (value instanceof Date) {
        return format(value, "dd/MM/yyyy");
    }

    if (typeof value === "string") {
        // Check if it's an ISO date string
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
        if (isoDateRegex.test(value)) {
            try {
                return format(new Date(value), "dd/MM/yyyy");
            } catch {
                return value;
            }
        }
        // Escape quotes and wrap in quotes if contains comma
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    if (typeof value === "boolean") {
        return value ? "Sim" : "Não";
    }

    return String(value);
};

export function exportToCSV<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    columns?: ExportColumn<T>[]
): { success: boolean; error?: string } {
    if (!data || data.length === 0) {
        return { success: false, error: "Nenhum dado para exportar" };
    }

    try {
        // Determine columns to export
        const exportColumns: ExportColumn<T>[] = columns ||
            (Object.keys(data[0]) as (keyof T)[]).map((key) => ({
                key,
                label: String(key),
            }));

        // Create header row
        const headers = exportColumns.map((col) => col.label).join(",");

        // Create data rows
        const rows = data.map((item) =>
            exportColumns
                .map((col) => {
                    const value = item[col.key];
                    if (col.format) {
                        return formatValue(col.format(value));
                    }
                    return formatValue(value);
                })
                .join(",")
        );

        // Combine header and rows
        const csvContent = [headers, ...rows].join("\n");

        // Create blob and download
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        // Generate filename with date
        const dateStr = format(new Date(), "yyyy-MM-dd");
        const finalFilename = filename.includes(".csv")
            ? filename
            : `${filename}_${dateStr}.csv`;

        link.setAttribute("href", url);
        link.setAttribute("download", finalFilename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        logger.error(error, 'exportCSV.exportToCSV', { showToast: false });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido na exportação"
        };
    }
}

// Pre-configured export for clients
export function exportClientsToCSV(clients: Array<{
    name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    is_bride?: boolean;
    wedding_date?: string | null;
}>): { success: boolean; error?: string } {
    return exportToCSV(clients, "clientes_khaoskontrol", [
        { key: "name", label: "Nome" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Telefone" },
        { key: "is_bride", label: "Noiva" },
        { key: "wedding_date", label: "Data Casamento" },
        { key: "created_at", label: "Data Cadastro" },
    ]);
}
