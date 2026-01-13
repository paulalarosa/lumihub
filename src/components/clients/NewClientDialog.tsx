import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export default function NewClientDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }
    
    if (!user) {
      toast.error("Erro de sessão: Faça login novamente.");
      return;
    }

    setLoading(true);

    try {
      // 2. Envia para o Supabase
      const { data, error } = await supabase.from("clients").insert([
        {
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          company_name: formData.company_name || null,
          notes: formData.notes || null,
          status: "active", // Padrão
          user_id: user.id,  // CRUCIAL: Vincula ao seu usuário
        },
      ]).select();

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        throw error;
      }

      toast.success("Cliente criado com sucesso!");
      setOpen(false);
      setFormData({ name: "", email: "", phone: "", company_name: "", notes: "" });
      
      // Atualiza a lista na tela de trás
      if (onSuccess) onSuccess();

    } catch (error: any) {
      // Mostra o erro real na tela
      toast.error(`Erro ao salvar: ${error.message || "Verifique o console"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo. O cliente será vinculado à sua conta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Maria Silva" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company_name">Empresa</Label>
            <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Ex: Lumi Inc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" value={formData.email} onChange={handleChange} placeholder="maria@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Detalhes extras..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}