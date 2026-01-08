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
    const { data, error } = await supabase
      .from('assistants')
      .select('*')
      .order('name');

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

    const assistantData = {
      user_id: user.id,
      name,
      email: email || null,
      phone: phone || null
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/agenda">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="font-poppins font-bold text-xl text-foreground">
                  Assistentes
                </span>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Assistente
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Minhas Assistentes</CardTitle>
            <CardDescription>
              Gerencie suas assistentes e envie convites para elas acessarem a agenda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAssistants ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : assistants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhuma assistente cadastrada
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Assistente
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assistants.map(assistant => (
                  <div
                    key={assistant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{assistant.name}</h3>
                        {assistant.is_registered ? (
                          <Badge variant="default" className="text-xs">
                            Registrada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Pendente
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        {assistant.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {assistant.email}
                          </span>
                        )}
                        {assistant.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {assistant.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!assistant.is_registered && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(assistant.invite_token)}
                          className="gap-2"
                        >
                          {copiedToken === assistant.invite_token ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          Copiar Convite
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(assistant)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(assistant.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAssistant ? 'Editar Assistente' : 'Nova Assistente'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da assistente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingAssistant ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
