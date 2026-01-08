import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus, CheckCircle } from "lucide-react";

const AssistantInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assistant, setAssistant] = useState<{
    id: string;
    name: string;
    email: string | null;
    is_registered: boolean;
    professional_name?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token de convite inválido");
        setLoading(false);
        return;
      }

      try {
        const { data: assistantData, error: assistantError } = await supabase
          .from("assistants")
          .select("id, name, email, is_registered, user_id")
          .eq("invite_token", token)
          .single();

        if (assistantError || !assistantData) {
          setError("Convite não encontrado ou expirado");
          setLoading(false);
          return;
        }

        if (assistantData.is_registered) {
          setError("Este convite já foi utilizado. Faça login para acessar o portal.");
          setLoading(false);
          return;
        }

        // Get professional name
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", assistantData.user_id)
          .single();

        setAssistant({
          ...assistantData,
          professional_name: profileData?.full_name || "Profissional"
        });
        
        if (assistantData.email) {
          setEmail(assistantData.email);
        }
      } catch (err) {
        setError("Erro ao validar convite");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assistant) return;
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSubmitting(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: assistant.name,
            is_assistant: true
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update assistant record
        const { error: updateError } = await supabase
          .from("assistants")
          .update({
            assistant_user_id: authData.user.id,
            is_registered: true,
            email: email
          })
          .eq("id", assistant.id);

        if (updateError) throw updateError;

        toast.success("Conta criada com sucesso! Bem-vinda ao portal.");
        navigate("/assistente");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Ops!</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/auth")} variant="outline">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Bem-vinda, {assistant?.name}!</CardTitle>
            <CardDescription className="mt-2">
              Você foi convidada por <strong>{assistant?.professional_name}</strong> para ser assistente.
              Crie sua conta para acessar o portal.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Criar Conta e Acessar
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistantInvite;
