import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientFilterStore } from "@/stores/useClientFilterStore";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    notes: string | null;
    last_visit: string | null;
    created_at: string;
    user_id: string;
    is_bride?: boolean;
    wedding_date?: string | null;
    access_pin?: string | null;
    portal_link?: string | null;
    status?: string;
    company?: string;
}

interface UseClientsQueryOptions {
    enabled?: boolean;
}

export function useClientsQuery(options: UseClientsQueryOptions = {}) {
    const { user } = useAuth();
    const { organizationId } = useOrganization();
    const queryClient = useQueryClient();

    const { search, status, dateRange, company, sortBy } = useClientFilterStore();

    const queryKey = [
        "clients",
        organizationId,
        search,
        status,
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString(),
        company,
        sortBy,
    ];

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<Client[]> => {
            if (!organizationId) return [];

            let query = supabase
                .from("wedding_clients")
                .select("*")
                .eq("user_id", organizationId);

            if (search) {
                query = query.or(
                    `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
                );
            }

            if (status === "active") {
                query = query.eq("status", "active");
            } else if (status === "inactive") {
                query = query.eq("status", "inactive");
            }

            if (dateRange.from) {
                query = query.gte("created_at", dateRange.from.toISOString());
            }

            if (dateRange.to) {
                const endOfDay = new Date(dateRange.to);
                endOfDay.setHours(23, 59, 59, 999);
                query = query.lte("created_at", endOfDay.toISOString());
            }

            if (company) {
                query = query.eq("company", company);
            }

            switch (sortBy) {
                case "name_asc":
                    query = query.order("name", { ascending: true });
                    break;
                case "name_desc":
                    query = query.order("name", { ascending: false });
                    break;
                case "date_desc":
                    query = query.order("created_at", { ascending: false });
                    break;
                case "date_asc":
                    query = query.order("created_at", { ascending: true });
                    break;
                default:
                    query = query.order("name", { ascending: true });
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        },
        enabled: !!user && !!organizationId && options.enabled !== false,
        staleTime: 1000 * 60 * 5,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
    };

    const refetch = () => {
        query.refetch();
    };

    return {
        clients: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch,
        invalidate,
    };
}

export type { Client };
