import { useQuery } from "@tanstack/react-query";
import { getClients } from "../api/get-clients";

export const useClients = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['clients', page],
        queryFn: () => getClients(page, limit),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    });
};
