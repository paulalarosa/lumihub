import { useState, useEffect, useCallback } from "react";
import { MarketingService, MarketingCampaign } from "@/services/marketing";
import { toast } from "sonner";

export const useMarketing = () => {
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await MarketingService.getAll();
            setCampaigns(data);
        } catch (err: any) {
            console.error("Error fetching campaigns:", err);
            setError(err);
            toast.error("Erro ao carregar campanhas de marketing.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    return {
        campaigns,
        loading,
        error,
        refetch: fetchCampaigns
    };
};
