import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "income" | "expense";
    onSuccess?: () => void;
}

const CATEGORIES = {
    income: [
        { value: "Service", label: "Serviço" },
        { value: "Product", label: "Produto" },
        { value: "Consulting", label: "Consultoria" },
        { value: "Other", label: "Outro" },
    ],
    expense: [
        { value: "Rent", label: "Aluguel" },
        { value: "Marketing", label: "Marketing" },
        { value: "Equipment", label: "Equipamentos" },
        { value: "Supplies", label: "Suprimentos / Produtos" },
        { value: "Utilities", label: "Contas (Luz, Água, Net)" },
        { value: "Salary", label: "Salários" },
        { value: "Tax", label: "Impostos" },
        { value: "Other", label: "Outro" },
    ],
};

const PAYMENT_METHODS = [
    { value: "pix", label: "Pix" },
    { value: "credit_card", label: "Cartão de Crédito" },
    { value: "debit_card", label: "Cartão de Débito" },
    { value: "cash", label: "Dinheiro" },
    { value: "transfer", label: "Transferência Bancária" },
    { value: "other", label: "Outro" },
];

export default function TransactionDialog({ open, onOpenChange, type, onSuccess }: TransactionDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "",
        date: format(new Date(), "yyyy-MM-dd"),
        payment_method: "pix",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.description || !formData.amount || !formData.category || !formData.date) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        try {
            setLoading(true);

            const amountValue = parseFloat(formData.amount.replace("R$ ", "").replace(".", "").replace(",", "."));

            const { error } = await supabase.from("transactions" as any).insert({
                user_id: user.id,
                type: type,
                description: formData.description,
                amount: amountValue,
                category: formData.category,
                date: formData.date,
                payment_method: formData.payment_method,
            });

            if (error) throw error;

            toast.success(`${type === 'income' ? 'Receita' : 'Despesa'} registrada com sucesso!`);
            onOpenChange(false);
            setFormData({
                description: "",
                amount: "",
                category: "",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "pix",
            });
            onSuccess?.();
        } catch (error: any) {
            console.error("Erro ao salvar transação:", error);
            toast.error("Erro ao salvar transação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        value = (Number(value) / 100).toFixed(2) + "";
        value = value.replace(".", ",");
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        setFormData({ ...formData, amount: `R$ ${value}` });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#050505] border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">
                        {type === "income" ? "Nova Receita" : "Nova Despesa"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ex: Corte de Cabelo"
                            className="bg-white/5 border-white/10 focus:border-cyan-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                                value={formData.amount}
                                onChange={handleAmountChange}
                                placeholder="R$ 0,00"
                                className="bg-white/5 border-white/10 focus:border-cyan-500/50 font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-cyan-500/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 focus:border-cyan-500/50">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                    {CATEGORIES[type].map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Método de Pagamento</Label>
                            <Select
                                value={formData.payment_method}
                                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 focus:border-cyan-500/50">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                    {PAYMENT_METHODS.map((method) => (
                                        <SelectItem key={method.value} value={method.value}>
                                            {method.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-white/60 hover:text-white hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={`text-black ${type === "income" ? "bg-emerald-400 hover:bg-emerald-500" : "bg-red-400 hover:bg-red-500"
                                }`}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar {type === "income" ? "Receita" : "Despesa"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
