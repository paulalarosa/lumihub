import { Loader2 } from "lucide-react";

export const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
);
