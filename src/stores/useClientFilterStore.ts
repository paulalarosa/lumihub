import { create } from "zustand";
import { persist } from "zustand/middleware";

type SortOption = "name_asc" | "name_desc" | "date_asc" | "date_desc";
type StatusOption = "all" | "active" | "inactive";

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface ClientFilterState {
    search: string;
    status: StatusOption;
    dateRange: DateRange;
    company: string;
    sortBy: SortOption;
}

interface ClientFilterActions {
    setSearch: (search: string) => void;
    setStatus: (status: StatusOption) => void;
    setDateRange: (range: DateRange) => void;
    setCompany: (company: string) => void;
    setSortBy: (sort: SortOption) => void;
    clearFilters: () => void;
    getActiveFilterCount: () => number;
}

const initialState: ClientFilterState = {
    search: "",
    status: "all",
    dateRange: { from: undefined, to: undefined },
    company: "",
    sortBy: "name_asc",
};

export const useClientFilterStore = create<ClientFilterState & ClientFilterActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            setSearch: (search) => set({ search }),
            setStatus: (status) => set({ status }),
            setDateRange: (dateRange) => set({ dateRange }),
            setCompany: (company) => set({ company }),
            setSortBy: (sortBy) => set({ sortBy }),

            clearFilters: () => set(initialState),

            getActiveFilterCount: () => {
                const state = get();
                let count = 0;
                if (state.search) count++;
                if (state.status !== "all") count++;
                if (state.dateRange.from || state.dateRange.to) count++;
                if (state.company) count++;
                if (state.sortBy !== "name_asc") count++;
                return count;
            },
        }),
        {
            name: "khaos-client-filters",
            partialize: (state) => ({
                status: state.status,
                company: state.company,
                sortBy: state.sortBy,
            }),
        }
    )
);

export type { ClientFilterState, SortOption, StatusOption, DateRange };
