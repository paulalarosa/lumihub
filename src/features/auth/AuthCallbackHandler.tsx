import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingText, setLoadingText] = useState('Processando autenticação...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(searchParams.get('error_description') || 'Erro na autenticação com Google.');
      return;
    }

    if (code) {
      handleOAuthCallback();
    } else {
      // No code, usually implies we are already authenticated or just visiting the URL.
      // Redirect to dashboard.
      setTimeout(() => navigate('/dashboard'), 1000);
    }
  }, [searchParams]);

  const handleOAuthCallback = async () => {
    try {
      setLoadingText('Validando conexão com Google...');

      // 1. Get Session
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const session = data.session;

      if (!session) {
        // Retry once after a short delay in case of race condition
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData.session) {
            await validateSession(retryData.session);
          } else {
            setStatus('error');
            setErrorMessage('Sessão não encontrada. Por favor, tente novamente.');
          }
        }, 1000);
        return;
      }

      await validateSession(session);

    } catch (err: any) {
      console.error('OAuth callback error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Erro de conexão.');
    }
  };

  const validateSession = async (session: any) => {
    // 2. Verify Token Exists
    // This ensures we actually got a provider token from the Google flow
    if (!session.provider_token && !session.provider_refresh_token) {
      console.warn('Missing provider token in session');
      setStatus('error');
      setErrorMessage('Falha na conexão: Token do Google não identificado. Tente novamente.');
      return;
    }

    // 3. Update Database (Only on Success)
    // Note: 'google_calendar_connected' column does not exist in 'profiles' schema, so we only update 'onboarding_completed'.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // We don't block login on profile update error, but we log it.
    }

    // 4. Success State
    setStatus('success');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans selection:bg-black selection:text-white relative overflow-hidden">
      {/* Background Effects - Concrete Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')] opacity-40 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03]" />

      <div className="w-full max-w-md bg-white border border-neutral-200 p-12 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] text-center relative z-10 rounded-sm">

        {status === 'processing' && (
          <div className="space-y-8">
            <div className="mx-auto w-16 h-16 bg-neutral-100 flex items-center justify-center rounded-sm">
              <Loader2 className="h-8 w-8 animate-spin text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">Syncing...</h2>
              <p className="text-neutral-500 font-medium">{loadingText}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8">
            <div className="mx-auto w-16 h-16 bg-black flex items-center justify-center rounded-sm">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">Connected</h2>
              <p className="text-neutral-500 font-medium">Google Calendar provider linked successfully.<br />Return to base.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8">
            <div className="mx-auto w-16 h-16 bg-red-50 flex items-center justify-center border border-red-100 rounded-sm">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2 tracking-tight">Connection Failed</h2>
              <p className="text-red-600/90 font-medium text-sm bg-red-50 p-4 border border-red-100 mb-8 rounded-sm">
                {errorMessage}
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate('/onboarding')}
                  className="w-full h-12 text-sm font-bold bg-black text-white hover:bg-neutral-900 hover:text-[#D4AF37] rounded-sm transition-all duration-300 shadow-sm uppercase tracking-wider"
                >
                  Retry Connection
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-12 text-neutral-400 hover:text-neutral-900 hover:bg-transparent text-xs font-semibold uppercase tracking-widest"
                >
                  Force Dashboard Entry
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackHandler;
