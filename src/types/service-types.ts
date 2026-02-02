export interface EventServiceItem {
    id?: string;
    name?: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
    services?: {
        name: string;
    };
}

export interface ReportProject {
    title: string;
    event_date: string | null;
    location: string | null;
    status: string;
    total_value?: number;
    project_services?: EventServiceItem[];
}

export interface FinancialExportItem {
    [key: string]: string | number | boolean | null | undefined;
}

export interface OriginStat {
    name: string;
    value: number;
}
