import { create } from 'zustand';

interface UIStore {
    isSidebarOpen: boolean;
    searchTerm: string;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    openSidebar: () => void;
    setSearchTerm: (term: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isSidebarOpen: true,
    searchTerm: '',
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => set({ isSidebarOpen: false }),
    openSidebar: () => set({ isSidebarOpen: true }),
    setSearchTerm: (term) => set({ searchTerm: term }),
}));
