import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Service {
    id: string;
    name: string;
    title?: string; // backward compat
    price: number | null;
    duration_minutes: number | null;
    description: string | null;
}

interface ServiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: Service | null;
    onSuccess: () => void;
}

const DURATION_OPTIONS = [
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "1h" },
    { value: 90, label: "1h 30min" },
    { value: 120, label: "2h" },
    { value: 150, label: "2h 30min" },
    { value: 180, label: "3h" },
    { value: 240, label: "4h" },
    { value: 300, label: "5h" },
    { value: 360, label: "6h" },
    { value: 480, label: "8h (Diária)" },
];

export default function ServiceDialog({
    open,
    onOpenChange,
    service,
    onSuccess,
}: ServiceDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("60");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (service) {
            setTitle(service.title);
            setPrice(service.price.toString());
            setDuration(service.duration_minutes.toString());
            setDescription(service.description || "");
        } else {
            resetForm();
        }
    }, [service, open]);

    const resetForm = () => {
        setTitle("");
        setPrice("");
        setDuration("60");
        setDescription("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validation: Name is required
        if (!title.trim()) {
            toast({
                title: t('service.error.name_required') || "Nome obrigatório",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        const serviceData = {
            user_id: user.id,
            name: title.trim(),
            price: price.replace(",", "."), // DB expects string or numeric, let's try string if type says so, or keep number if only duration failed
            duration_minutes: duration, // DB type expects string for duration_minutes
            description: description || null,
        };

        try {
            if (service) {
                const { error } = await supabase
                    .from("services")
                    .update(serviceData)
                    .eq("id", service.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("services").insert(serviceData);
                if (error) throw error;
            }

            toast({
                title: "Sucesso",
                description: service
                    ? "Serviço atualizado com sucesso!"
                    : "Novo serviço criado!",
            });
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error("Error saving service:", error);
            const message = error instanceof Error ? error.message : "Erro ao salvar serviço.";
            toast({
                title: "Erro",
                description: message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-white/5 text-white">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
                        {service ? t('service.dialog.title.edit') : t('service.dialog.title.new')}
                    </DialogTitle>
                    <p className="text-gray-400 text-sm">
                        {service ? "Edite as informações do serviço abaixo." : "Preencha os dados criar um novo serviço."}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-gray-300">
                            {t('service.name.label')} *
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('service.name.placeholder')}
                            required
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/50 focus:ring-1 focus:ring-white/50 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Price */}
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-gray-300">
                                {t('service.price.label')} *
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/50 rounded-xl"
                            />
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">{t('service.duration.label')} *</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    {DURATION_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value.toString()}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-300">
                            {t('service.description.label')}
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('service.description.placeholder')}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 rounded-xl resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
                        >
                            {t('service.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-white text-black hover:bg-gray-200 rounded-xl px-6 font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('service.save')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
