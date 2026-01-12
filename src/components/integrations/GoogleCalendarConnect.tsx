import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface GoogleCalendarConnectProps {
  onSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
  redirectUri?: string;
}

export default function GoogleCalendarConnect({
  onSuccess,
  size = 'md',
  variant = 'default',
  className = '',
  showIcon = true,
  fullWidth = false,
  redirectUri = `${window.location.origin}/configuracoes`,
}: GoogleCalendarConnectProps) {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);

  const connectGoogleCalendar = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // DEBUG: Log the redirect_uri being sent
      console.log('🔵 [GoogleCalendarConnect] Iniciando conexão com Google Calendar');
      console.log('📍 Redirect URI enviado:', redirectUri);
      console.log('👤 User Session:', session?.user?.email);
      
      const response = await supabase.functions.invoke('google-calendar-auth', {
        body: { 
          redirect_uri: redirectUri
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      console.log('📬 Edge Function Response:', response);

      // Check for error at different levels
      if (response.error) {
        // Try to extract specific error message from response
        const errorMessage = response.error?.message || response.error?.msg || 'Erro ao conectar com Google Calendar';
        console.error('❌ Edge Function Error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Also check if response.data has an error
      if (response.data?.error) {
        console.error('❌ Response Data Error:', response.data.error);
        throw new Error(response.data.error);
      }

      if (response.data?.url) {
        console.log('✅ OAuth URL recebida, redirecionando...');
        window.location.href = response.data.url;
      } else {
        console.warn('⚠️ Nenhuma URL retornada pela Edge Function');
        throw new Error('Edge Function não retornou URL de autenticação');
      }
    } catch (error: any) {
      console.error('❌ [GoogleCalendarConnect] Erro completo:', error);
      
      // Extract the most specific error message possible
      let errorDescription = "Não foi possível conectar ao Google Calendar";
      
      if (error?.message) {
        errorDescription = error.message;
      } else if (typeof error === 'string') {
        errorDescription = error;
      }
      
      console.log('📝 Mensagem de erro final:', errorDescription);
      
      toast({
        title: "Erro na Conexão",
        description: errorDescription,
        variant: "destructive"
      });
      setConnecting(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <Button 
      onClick={connectGoogleCalendar} 
      disabled={connecting}
      size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
      variant={variant}
      className={`${widthClass} ${className}`}
    >
      {connecting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Conectando...
        </>
      ) : (
        <>
          {showIcon && (
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 1C5.92 1 1 5.92 1 12s4.92 11 11 11 11-4.92 11-11S18.08 1 12 1z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              <path fill="currentColor" d="M12 19c-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23v-4z"/>
              <path fill="currentColor" d="M23 12.13c0-.82-.07-1.42-.25-2.05h-10.74v3.71h6.1c-.3 1.48-1.5 2.74-2.84 3.29v2.77h4.57c2.08-1.92 3.28-4.74 3.28-8.12z"/>
            </svg>
          )}
          Conectar Google Calendar
        </>
      )}
    </Button>
  );
}
