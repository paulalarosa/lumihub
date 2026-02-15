import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ClientService } from "@/services/clientService";

interface RecordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    onSuccess?: () => void;
}

export function RecordDialog({ open, onOpenChange, clientId, onSuccess }: RecordDialogProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) return;

        setLoading(true);
        // Mock submission for now
        setTimeout(() => {
            // console.log("Creating record:", {
            //     client_id: clientId,
            //     date: date,
            //     description: title,
            //     notes: notes
            // });

            toast({
                title: "RECORD_LOGGED",
                description: "CLIENT_HISTORY_UPDATED (MOCKED)",
            });

            onSuccess?.();
            onOpenChange(false);
            setLoading(false);

            // Reset form
            setTitle("");
            setNotes("");
            setDate(new Date().toISOString().split('T')[0]);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-black border border-white/20 rounded-none text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-mono uppercase tracking-widest text-white flex items-center gap-2">
            /// NEW_CLINICAL_RECORD
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-xs font-mono text-white/50 uppercase tracking-widest">
                            DATE
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="bg-black border-white/20 rounded-none text-white font-mono focus:border-white invert-calendar-icon"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-mono text-white/50 uppercase tracking-widest">
                            PROCEDURE / TITLE
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="EX: FACIAL_TREATMENT_01"
                            required
                            className="bg-black border-white/20 rounded-none text-white font-mono placeholder:text-white/20 focus:border-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-xs font-mono text-white/50 uppercase tracking-widest">
                            OBSERVATIONS / NOTES
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="TECHNICAL_DETAILS..."
                            rows={4}
                            className="bg-black border-white/20 rounded-none text-white font-mono placeholder:text-white/20 focus:border-white resize-none"
                        />
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-none text-white/50 hover:text-white hover:bg-white/10 font-mono text-xs uppercase tracking-widest"
                            disabled={loading}
                        >
                            CANCEL
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-none bg-white text-black hover:bg-white/90 font-mono text-xs uppercase tracking-widest min-w-[100px]"
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "SAVE_RECORD"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
