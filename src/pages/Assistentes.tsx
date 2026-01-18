import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Users,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchAssistants as fetchAssistantsService } from '@/features/team/services/teamService';

interface Assistant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_registered: boolean;
  invite_token: string;
  created_at: string;
}

export default function Assistentes() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAssistants();
    }
  }, [user]);

  const fetchAssistants = async () => {
    setLoadingAssistants(true);
    const { data, error } = await fetchAssistantsService();

    if (error) {
      console.error('Error fetching assistants:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as assistentes",
        variant: "destructive"
      });
    } else {
      setAssistants(data || []);
    }
    setLoadingAssistants(false);
  };

  const handleOpenDialog = (assistant?: Assistant) => {
    if (assistant) {
      setEditingAssistant(assistant);
      setName(assistant.name);
      setEmail(assistant.email || '');
      setPhone(assistant.phone || '');
    } else {
      setEditingAssistant(null);
      setName('');
      setEmail('');
      setPhone('');
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    // Generate a simple random token if creating new
    const token = crypto.randomUUID();

    const assistantData = {
      user_id: user.id,
      name,
      email: email || null,
      phone: phone || null,
      // Only set invite_token on creation
      ...(!editingAssistant ? { invite_token: token } : {})
    };

    try {
      if (editingAssistant) {
        const { error } = await supabase
          .from('assistants')
          .update(assistantData)
          .eq('id', editingAssistant.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Assistente atualizada"
        });
      } else {
        const { error } = await supabase
          .from('assistants')
          .insert(assistantData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Assistente cadastrada"
        });
      }

      setDialogOpen(false);
      fetchAssistants();
    } catch (error: any) {
      console.error('Error saving assistant:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assistantId: string) => {
    const { error } = await supabase
      .from('assistants')
      .delete()
      .eq('id', assistantId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Assistente excluída"
      });
      fetchAssistants();
    }
  };

  const copyInviteLink = (token: string) => {
    if (!token) {
      toast({
        title: "Erro",
        description: "Token de convite inválido ou pendente.",
        variant: "destructive"
      });
      return;
    }
    const link = `${window.location.origin}/assistente/convite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast({
      title: "Link copiado!",
      description: "Envie para a assistente criar sua conta"
    });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#050505]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/agenda">
                <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-none text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white flex items-center justify-center rounded-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  <Users className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-white tracking-wide">
                    Equipe
                  </h1>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">
                    Gerenciamento
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2 bg-white text-black hover:bg-gray-200 rounded-none border border-transparent font-semibold uppercase tracking-wider text-xs px-6">
              <Plus className="h-4 w-4" />
              Nova Assistente
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-[#0A0A0A] border-white/5 rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl tracking-wide text-white">Minhas Assistentes</CardTitle>
            <CardDescription className="text-gray-500 font-mono text-xs uppercase tracking-wider">
              Gerencie suas assistentes e envie convites para elas acessarem a agenda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAssistants ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-none h-6 w-6 border-b-2 border-white"></div>
              </div>
            ) : assistants.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 bg-white/[0.02]">
                <Users className="h-12 w-12 mx-auto text-gray-700 mb-4" />
                <p className="text-gray-400 mb-6 font-light">
                  Nenhuma assistente cadastrada
                </p>
                <Button onClick={() => handleOpenDialog()} variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black rounded-none uppercase text-xs tracking-widest">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira
                </Button>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-white/5 border border-white/5">
                {assistants.map(assistant => (
                  <div
                    key={assistant.id}
                    className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-lg text-white group-hover:text-white/90 transition-colors uppercase tracking-wide font-serif">{assistant.name}</h3>
                        {assistant.is_registered ? (
                          <Badge variant="outline" className="rounded-none border-green-900/50 text-green-500 bg-green-500/10 text-[10px] uppercase tracking-wider px-2 py-0.5">
                            Registrada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none border-yellow-900/50 text-yellow-500 bg-yellow-500/10 text-[10px] uppercase tracking-wider px-2 py-0.5">
                            Pendente
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-6 mt-3 text-sm text-gray-400">
                        {assistant.email && (
                          <span className="flex items-center gap-2 hover:text-white transition-colors">
                            <Mail className="h-3.5 w-3.5" />
                            {assistant.email}
                          </span>
                        )}
                        {assistant.phone && (
                          <span className="flex items-center gap-2 hover:text-white transition-colors">
                            <Phone className="h-3.5 w-3.5" />
                            {assistant.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!assistant.is_registered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(assistant.invite_token)}
                          className="gap-2 rounded-none border-white/10 hover:bg-white hover:text-black hover:border-white transition-all text-xs uppercase tracking-wider bg-transparent text-gray-300"
                        >
                          {copiedToken === assistant.invite_token ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copiar Link
                        </Button>
                      )}
                      <div className="flex bg-white/5 border border-white/5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(assistant)}
                          className="rounded-none hover:bg-white/10 hover:text-white text-gray-400 h-9 w-9"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <div className="w-px bg-white/5"></div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(assistant.id)}
                          className="rounded-none hover:bg-red-500/10 hover:text-red-400 text-gray-500 h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-none bg-[#0A0A0A] border border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif tracking-wide">
              {editingAssistant ? 'Editar Assistente' : 'Nova Assistente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-gray-400">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NOME COMPLETO"
                required
                className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-gray-400">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL@EXEMPLO.COM"
                className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-gray-400">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-white/5 border-white/10 rounded-none text-white focus:border-white/50 focus:ring-0 placeholder:text-gray-700"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-none border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/30 uppercase text-xs tracking-wider"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="rounded-none bg-white text-black hover:bg-gray-200 border-none uppercase text-xs tracking-wider font-semibold px-6">
                {saving ? 'Salvando...' : editingAssistant ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
