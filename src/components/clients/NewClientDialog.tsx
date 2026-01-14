import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { ClientService } from "@/services/clientService";

export default function NewClientDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string, name: string }[]>([]);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    notes: "",
    origin: "",
    referred_by: ""
  });

  useEffect(() => {
    if (open && user?.id) {
      loadClients();
    }
  }, [open, user]);

  const loadClients = async () => {
    if (!user) return;
    const { data } = await ClientService.list(user.id); // Assuming user.id is organizationId
    if (data) {
      setClients(data);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  }

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
      // 2. Envia via Service
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        company_name: formData.company_name || null,
        notes: formData.notes || null,
        status: "active",
        user_id: user.id,
        origin: formData.origin || null,
        referred_by: formData.referred_by || null
      };

      const { error } = await ClientService.create(payload as any); // Cast as any for new fields until types regen

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        throw error;
      }

      toast.success("Cliente criado com sucesso!");
      setOpen(false);
      setFormData({ name: "", email: "", phone: "", company_name: "", notes: "", origin: "", referred_by: "" });

      // Atualiza a lista na tela de trás
      if (onSuccess) onSuccess();

    } catch (error: any) {
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
      <DialogContent className="sm:max-w-[500px] bg-[#1A1A1A] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Adicionar Novo Cliente</DialogTitle>
          <DialogDescription className="text-white/60">
            Preencha os dados abaixo. O cliente será vinculado à sua conta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-white">Nome Completo *</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Maria Silva" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="origin" className="text-white">Origem</Label>
              <Select onValueChange={(v) => handleSelectChange('origin', v)} value={formData.origin}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.origin === 'indicacao' && (
              <div className="grid gap-2">
                <Label htmlFor="referred_by" className="text-white">Indicado por</Label>
                <Select onValueChange={(v) => handleSelectChange('referred_by', v)} value={formData.referred_by}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Selecione Cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/10 text-white max-h-60 overflow-y-auto">
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.origin !== 'indicacao' && (
              <div className="grid gap-2">
                <Label htmlFor="company_name" className="text-white">Empresa (Opcional)</Label>
                <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Ex: Lumi Inc." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input id="email" name="email" value={formData.email} onChange={handleChange} placeholder="maria@email.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-white">Telefone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-white">Observações</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Detalhes extras..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-white/10 text-white hover:bg-white/5 hover:text-white">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}