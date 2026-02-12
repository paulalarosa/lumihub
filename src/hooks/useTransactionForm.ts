import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { Logger } from "@/services/logger";

export interface TransactionFormData {
    description: string;
    amount: string;
    category: string;
    date: string;
    payment_method: string;
    project_id: string;
    service_id: string;
    assistant_id: string;
}

interface UseTransactionFormProps {
    open: boolean;
    type: "income" | "expense";
    onSuccess?: () => void;
    onOpenChange: (open: boolean) => void;
}

export function useTransactionForm({ open, type, onSuccess, onOpenChange }: UseTransactionFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<TransactionFormData>({
        description: "",
        amount: "",
        category: "",
        date: format(new Date(), "yyyy-MM-dd"),
        payment_method: "pix",
        project_id: "",
        service_id: "",
        assistant_id: "",
    });

    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [services, setServices] = useState<{ id: string; name: string }[]>([]);
    const [assistants, setAssistants] = useState<{ id: string; full_name: string | null }[]>([]);

    useEffect(() => {
        if (open && user) {
            fetchOptions();
        }
    }, [open, user]);

    const fetchOptions = async () => {
        try {
            const { data: p } = await supabase.from('projects').select('id, name');
            if (p) setProjects(p);

            const { data: s } = await supabase.from('services').select('id, name');
            if (s) setServices(s);

            const { data: a } = await supabase.from('profiles').select('id, full_name').eq('role', 'assistant');
            if (a) setAssistants(a);
        } catch (error) {
            console.error("Error fetching options:", error);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        value = (Number(value) / 100).toFixed(2) + "";
        value = value.replace(".", ",");
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        setFormData((prev) => ({ ...prev, amount: `R$ ${value}` }));
    };

    const handleChange = (field: keyof TransactionFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

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

            const { data: transaction, error } = await supabase.from("transactions").insert({
                user_id: user.id,
                type: type,
                description: formData.description,
                amount: amountValue,
                category: formData.category,
                date: formData.date,
                payment_method: formData.payment_method,
                project_id: formData.project_id || null,
                service_id: formData.service_id || null,
                assistant_id: formData.assistant_id || null,
            }).select().single();

            if (error) throw error;

            // Audit the action
            if (transaction) {
                Logger.action("FINANCIAL_TRANSACTION_CREATE", user.id, "transactions", transaction.id, {
                    type: transaction.type,
                    amount: transaction.amount,
                    category: transaction.category
                });
            }

            toast.success(`${type === 'income' ? 'Receita' : 'Despesa'} registrada com sucesso!`);
            onOpenChange(false);
            setFormData({
                description: "",
                amount: "",
                category: "",
                date: format(new Date(), "yyyy-MM-dd"),
                payment_method: "pix",
                project_id: "",
                service_id: "",
                assistant_id: "",
            });
            onSuccess?.();
        } catch (error) {
            console.error("Erro ao salvar transação:", error);
            toast.error("Erro ao salvar transação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        options: { projects, services, assistants },
        handleAmountChange,
        handleChange,
        handleSubmit
    };
}
