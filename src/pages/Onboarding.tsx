import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get-auth-url',
          redirect_uri: window.location.origin + '/auth/callback'
        }
      });

      if (error) {
        console.error('Error getting auth URL:', error);
        toast.error('Erro ao conectar com Google Calendar');
        setIsConnecting(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('URL de autenticação não recebida');
        setIsConnecting(false);
      }
    } catch (err) {
      console.error('Connection error:', err);
      toast.error('Erro de conexão');
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold">
              Ative seu Assistente
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Conecte seu Google Calendar para sincronizar automaticamente seus eventos 
              e permitir que o assistente gerencie sua agenda.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Sincronização automática</p>
                  <p className="text-xs text-muted-foreground">
                    Seus eventos serão sincronizados em tempo real
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Gestão inteligente</p>
                  <p className="text-xs text-muted-foreground">
                    O assistente pode criar e editar eventos para você
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Lembretes personalizados</p>
                  <p className="text-xs text-muted-foreground">
                    Receba notificações dos seus compromissos
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleConnectGoogleCalendar}
                disabled={isConnecting}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-5 w-5" />
                    Conectar Google Calendar
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Pular por agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground pt-2">
              Você pode conectar o Google Calendar mais tarde nas configurações.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
