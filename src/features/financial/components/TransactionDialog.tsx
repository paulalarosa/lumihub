import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTransactionForm } from "@/hooks/useTransactionForm";

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
    const {
        formData,
        loading,
        options,
        handleAmountChange,
        handleChange,
        handleSubmit
    } = useTransactionForm({ open, type, onOpenChange, onSuccess });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#050505] border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">
                        {type === "income" ? "Nova Receita" : "Nova Despesa"}
                    </DialogTitle>
                    <p className="text-gray-400 text-sm">
                        Preencha os dados da transação financeira.
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Ex: Corte de Cabelo"
                            className="bg-white/5 border-white/10 focus:border-white/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                                value={formData.amount}
                                onChange={handleAmountChange}
                                placeholder="R$ 0,00"
                                className="bg-white/5 border-white/10 focus:border-white/50 font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleChange("date", e.target.value)}
                                className="bg-white/5 border-white/10 focus:border-white/50"
                            />
                        </div>
                    </div>

                    {/* New Fields: Project, Service, Assistant */}
                    {type === 'income' && (
                        <div className="space-y-4 border-t border-white/10 pt-4 mt-2">
                            <div className="space-y-2">
                                <Label>Vincular a Projeto (Noiva)</Label>
                                <Select
                                    value={formData.project_id}
                                    onValueChange={(value) => handleChange("project_id", value)}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                                        <SelectValue placeholder="Selecione o Projeto" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                        {options.projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Serviço Dedicado</Label>
                                <Select
                                    value={formData.service_id}
                                    onValueChange={(value) => handleChange("service_id", value)}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                                        <SelectValue placeholder="Selecione o Serviço" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                        {options.services.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Assistente Responsável (Opcional)</Label>
                                <Select
                                    value={formData.assistant_id}
                                    onValueChange={(value) => handleChange("assistant_id", value)}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                        {options.assistants.map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.full_name || 'Sem nome'}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => handleChange("category", value)}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
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
                                onValueChange={(value) => handleChange("payment_method", value)}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 focus:border-white/50">
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
