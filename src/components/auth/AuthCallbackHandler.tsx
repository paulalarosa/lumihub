import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AuthCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(searchParams.get('error_description') || 'Erro na autenticação');
      return;
    }

    if (code && state) {
      handleOAuthCallback(code, state);
    } else if (!code) {
      // No code, might be a regular auth callback, redirect to dashboard
      setTimeout(() => navigate('/dashboard'), 1000);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'callback',
          code,
          state,
          redirect_uri: window.location.origin + '/auth/callback'
        }
      });

      if (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Erro ao processar autenticação');
        return;
      }

      if (data?.success) {
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setStatus('error');
        setErrorMessage(data?.error || 'Erro desconhecido');
      }
    } catch (err) {
      console.error('OAuth callback error:', err);
      setStatus('error');
      setErrorMessage('Erro de conexão');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          {status === 'processing' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <CardTitle>Processando...</CardTitle>
              <CardDescription>
                Aguarde enquanto conectamos sua conta
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-green-600">Conectado com sucesso!</CardTitle>
              <CardDescription>
                Seu Google Calendar foi conectado. Redirecionando...
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Erro na conexão</CardTitle>
              <CardDescription>
                {errorMessage}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        {status === 'error' && (
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/onboarding')} 
              className="w-full"
            >
              Tentar novamente
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
            >
              Ir para o Dashboard
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AuthCallbackHandler;
