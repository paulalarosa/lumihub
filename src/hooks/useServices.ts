import { useState, useEffect, useCallback } from "react";
import { ServicesService, ServiceItem } from "@/services/services.service";
import { toast } from "sonner";

export const useServices = (userId?: string) => {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchServices = useCallback(async () => {
        if (!userId) return; // Wait for auth
        setLoading(true);
        setError(null);
        try {
            const data = await ServicesService.getAll();
            setServices(data);
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            console.error("Error fetching services:", error);
            setError(error);
            toast.error("Erro ao carregar serviços.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const removeService = async (id: string) => {
        try {
            await ServicesService.delete(id);
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success("Serviço excluído.");
        } catch (err: unknown) {
            console.error("Error deleting service:", err);
            toast.error("Não foi possível excluir o serviço.");
            throw err;
        }
    };

    return {
        services,
        loading,
        error,
        refetch: fetchServices,
        removeService
    };
};
