import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar, CheckCircle } from 'lucide-react';
import GoogleCalendarConnect from '@/components/integrations/GoogleCalendarConnect';
import { motion } from 'framer-motion';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasIntegration, setHasIntegration] = useState(false);

  // Check if user already has Google Calendar integration
  useEffect(() => {
    const checkIntegration = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('id, is_active')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .eq('is_active', true)
          .maybeSingle();

        if (data && !error) {
          setHasIntegration(true);
          // Redirect to dashboard after a brief moment to show success
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      } catch (error) {
        console.error('Error checking integration:', error);
      }

      setLoading(false);
    };

    checkIntegration();
  }, [user, navigate]);

  // Listen for OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state) {
        setLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          const callbackRedirectUri = `${window.location.origin}/onboarding`;
          
          // DEBUG: Log callback processing
          console.log('🔵 [Onboarding] Processando callback OAuth');
          console.log('📍 Code recebido:', code?.substring(0, 20) + '...');
          console.log('📍 State recebido:', state?.substring(0, 20) + '...');
          console.log('📍 Redirect URI para callback:', callbackRedirectUri);
          
          const response = await supabase.functions.invoke('google-calendar-auth', {
            body: { 
              code, 
              state,
              redirect_uri: callbackRedirectUri
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          console.log('📬 Edge Function Response:', response);

          if (response.error) {
            const errorMessage = response.error?.message || response.error?.msg || 'Erro ao processar callback';
            console.error('❌ Edge Function Error:', errorMessage);
            throw new Error(errorMessage);
          }

          if (response.data?.error) {
            console.error('❌ Response Data Error:', response.data.error);
            throw new Error(response.data.error);
          }

          // Integration successful
          console.log('✅ Integração com Google Calendar bem-sucedida');
          setHasIntegration(true);
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Redirect after showing success message
          setTimeout(() => navigate('/dashboard'), 1500);
        } catch (error: any) {
          console.error('❌ [Onboarding] Erro no callback:', error);
          console.error('Detalhes do erro:', error?.message || error);
          setLoading(false);
        }
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading && !hasIntegration) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  if (hasIntegration) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          >
            <CheckCircle className="h-16 w-16 text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground">
            Integração Completa!
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Seu Google Calendar foi conectado com sucesso. Redirecionando para o dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-card/95">
          <div className="p-8 md:p-12 space-y-8 text-center">
            {/* Icon */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
              className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full"
            >
              <Calendar className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </motion.div>

            {/* Title */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                Ative seu Assistente Inteligente
              </h1>
              <p className="text-lg text-muted-foreground">
                Bem-vindo ao Lumihub! 🎉
              </p>
            </motion.div>

            {/* Description */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-base text-muted-foreground leading-relaxed"
            >
              Para automatizar seus agendamentos e gerenciar seus contratos com inteligência, precisamos conectar sua agenda do Google.
            </motion.p>

            {/* Benefits */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3 py-6"
            >
              {[
                { icon: '📅', text: 'Sincronize seus eventos automaticamente' },
                { icon: '🤖', text: 'Deixe o IA gerenciar seus agendamentos' },
                { icon: '✍️', text: 'Gere contratos inteligentes' }
              ].map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-center gap-3 text-sm text-foreground"
                >
                  <span className="text-lg">{benefit.icon}</span>
                  <span>{benefit.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="pt-4"
            >
              <GoogleCalendarConnect 
                size="lg"
                fullWidth
                redirectUri={`${window.location.origin}/onboarding`}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-shadow"
              />
              {/* Debug info - shows the redirect URI being used */}
              <p className="text-xs text-muted-foreground/60 mt-3 break-all">
                🔧 Debug: Redirect URI = <span className="font-mono text-primary/70">{window.location.origin}/onboarding</span>
              </p>
            </motion.div>

            {/* Info Text */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-muted-foreground/80 pt-4"
            >
              Você será redirecionado para autorizar o acesso ao seu Google Calendar. Seus dados são 100% seguros.
            </motion.p>
          </div>
        </Card>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground/60"
        >
          <div className="flex items-center gap-1">
            <span>🔒</span>
            <span>Criptografado</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-1">
            <span>✓</span>
            <span>Verificado</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span>Instantâneo</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
