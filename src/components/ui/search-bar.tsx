import { useUIStore } from "@/stores/useUIStore";
import { Search } from "lucide-react";

export const SearchBar = () => {
    const { searchTerm, setSearchTerm } = useUIStore();

    return (
        <div className="flex items-center space-x-2 border border-black dark:border-white bg-transparent h-10 px-3 w-full max-w-md transition-colors focus-within:bg-black/5 dark:focus-within:bg-white/5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500 whitespace-nowrap">
                SEARCH_TARGET:
            </span>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-black dark:text-white placeholder-gray-500"
                placeholder="..."
            />
            {searchTerm && (
                <button
                    onClick={() => setSearchTerm('')}
                    className="text-[10px] uppercase hover:text-red-500 font-mono"
                >
                    [CLR]
                </button>
            )}
            <Search className="w-4 h-4 text-gray-400" />
        </div>
    );
};
