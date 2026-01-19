import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Gem } from "lucide-react"; // Gem used as Ring alternative
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Define the shape of the form data
export interface ClientFormData {
    name: string;
    email: string;
    phone: string;
    notes: string;
    is_bride: boolean;
    wedding_date?: Date;
    access_pin?: string;
}

interface ClientFormProps {
    initialData?: ClientFormData;
    onSubmit: (data: ClientFormData) => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export function ClientForm({ initialData, onSubmit, isLoading, submitLabel = "Salvar" }: ClientFormProps) {
    const [formData, setFormData] = useState<ClientFormData>({
        name: "",
        email: "",
        phone: "",
        notes: "",
        is_bride: initialData?.is_bride || false,
        wedding_date: initialData?.wedding_date,
        access_pin: initialData?.access_pin || "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (field: keyof ClientFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-500 font-mono">Nome *</Label>
                <Input
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="NOME COMPLETO"
                    className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-12 font-mono text-sm"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-500 font-mono">Email</Label>
                <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="EMAIL@EXEMPLO.COM"
                    className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-12 font-mono text-sm"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-500 font-mono">Telefone</Label>
                <Input
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-12 font-mono text-sm"
                />
            </div>

            {/* Bride VIP Section */}
            <div className="border border-white/10 p-4 bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Gem className={cn("h-4 w-4", formData.is_bride ? "text-white" : "text-gray-500")} />
                        <Label className="text-xs uppercase tracking-widest text-white font-mono cursor-pointer" htmlFor="is-bride">
                            É Noiva? (VIP Portal)
                        </Label>
                    </div>
                    <Switch
                        id="is_bride"
                        checked={formData.is_bride}
                        onCheckedChange={(checked) => handleChange("is_bride", checked)}
                        className="data-[state=checked]:bg-zinc-100 data-[state=unchecked]:bg-zinc-800 border-zinc-700"
                    />
                </div>

                {formData.is_bride && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-gray-500 font-mono">Data do Casamento</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-none h-12 bg-black border-white/30 text-white hover:bg-white/10 hover:text-white",
                                            !formData.wedding_date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.wedding_date ? (
                                            format(formData.wedding_date, "PPP", { locale: ptBR })
                                        ) : (
                                            <span>Selecione a data</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-black border-white/20" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.wedding_date}
                                        onSelect={(date) => handleChange("wedding_date", date)}
                                        initialFocus
                                        className="bg-black text-white"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-gray-500 font-mono">PIN de Acesso (4 dígitos)</Label>
                            <Input
                                value={formData.access_pin}
                                onChange={(e) => {
                                    // Only allow numbers and max 4 chars
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    handleChange("access_pin", val);
                                }}
                                placeholder="0000"
                                className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none h-12 font-mono text-sm tracking-[0.5em] text-center font-bold"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-gray-500 font-mono">Anotações</Label>
                <Textarea
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="OBSERVAÇÕES TÉCNICAS..."
                    rows={3}
                    className="bg-black border border-white/30 text-white placeholder:text-white/20 focus:border-white rounded-none font-mono text-sm resize-none"
                />
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-zinc-900 text-white hover:bg-black border border-white/10 rounded-none font-mono text-xs uppercase tracking-widest h-12"
            >
                {isLoading ? "SALVANDO..." : submitLabel}
            </Button>
        </form>
    );
}
