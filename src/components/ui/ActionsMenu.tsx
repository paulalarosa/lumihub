import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Copy, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ActionsMenuProps {
    id: string;
    contractUrl?: string | null;
    onDelete: (id: string) => void;
}

export const ActionsMenu = ({ id, contractUrl, onDelete }: ActionsMenuProps) => {

    const handleCopyId = () => {
        navigator.clipboard.writeText(id);
        toast.success("ID COPIED TO CLIPBOARD");
    };

    const handleOpenContract = () => {
        if (contractUrl) {
            window.open(contractUrl, '_blank');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-none hover:bg-black/5 focus-visible:ring-black">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-[200px] p-0 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                <DropdownMenuLabel className="font-mono text-xs uppercase text-gray-400 bg-gray-50 border-b border-black/10 px-3 py-2">
                    Actions
                </DropdownMenuLabel>

                <div className="p-1 space-y-1">
                    <DropdownMenuItem
                        onClick={handleCopyId}
                        className="font-mono text-xs uppercase cursor-pointer hover:bg-yellow-100 hover:text-black focus:bg-yellow-100 focus:text-black rounded-none px-2 py-2 flex items-center gap-2 outline-none border border-transparent focus:border-black/20"
                    >
                        <Copy className="w-3 h-3" />
                        Copy ID
                    </DropdownMenuItem>

                    {contractUrl && (
                        <DropdownMenuItem
                            onClick={handleOpenContract}
                            className="font-mono text-xs uppercase cursor-pointer hover:bg-yellow-100 hover:text-black focus:bg-yellow-100 focus:text-black rounded-none px-2 py-2 flex items-center gap-2 outline-none border border-transparent focus:border-black/20"
                        >
                            <FileText className="w-3 h-3" />
                            View Contract
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-black/10 m-1" />

                    <DropdownMenuItem
                        onClick={() => onDelete(id)}
                        className="font-mono text-xs uppercase cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 rounded-none px-2 py-2 flex items-center gap-2 outline-none border border-transparent focus:border-red-200"
                    >
                        <Trash2 className="w-3 h-3" />
                        Delete Target
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
