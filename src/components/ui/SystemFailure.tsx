
interface SystemFailureProps {
    error: Error;
    resetErrorBoundary: () => void;
}

export const SystemFailure = ({ error, resetErrorBoundary }: SystemFailureProps) => (
    <div className="h-screen w-full bg-zinc-950 text-zinc-400 flex flex-col items-center justify-center p-4 font-mono">
        <div className="border border-red-900/50 bg-red-950/10 p-8 max-w-md w-full">
            <h1 className="text-red-500 text-xl font-bold mb-4 tracking-tighter uppercase">
                [SYSTEM_CRITICAL_FAILURE]
            </h1>
            <p className="text-sm mb-6 border-l-2 border-zinc-800 pl-4 break-words">
                {error.message || "Unknown anomaly detected in the core."}
            </p>
            <button
                onClick={resetErrorBoundary}
                className="w-full bg-zinc-100 text-black hover:bg-zinc-300 py-3 px-6 text-xs uppercase tracking-widest font-bold transition-colors"
            >
                :: REBOOT_SYSTEM ::
            </button>
        </div>
    </div>
);
