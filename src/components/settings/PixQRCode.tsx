import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Copy, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';

interface PixQRCodeProps {
  pixKey: string | null;
  businessName?: string | null;
}

export default function PixQRCode({ pixKey, businessName }: PixQRCodeProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  const generateQRCode = async () => {
    if (!pixKey || !canvasRef.current) {
      toast({
        title: 'Erro',
        description: 'Chave PIX não configurada',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Gerar QR Code com informações de chave PIX
      // Formato simplificado - em produção seria o brcode padrão
      const qrData = `00020126580014br.gov.bcb.brcode01051.0.0${pixKey}`;
      
      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      toast({
        title: 'QR Code gerado',
        description: 'Pronto para compartilhar ou baixar',
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o QR Code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = `qr-pix-${businessName || 'negocio'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'QR Code baixado',
      description: 'Arquivo salvo em sua máquina',
    });
  };

  const copyPixKey = async () => {
    if (!pixKey) return;

    try {
      await navigator.clipboard.writeText(pixKey);
      toast({
        title: 'Copiado!',
        description: 'Chave PIX copiada para área de transferência',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (pixKey) {
      generateQRCode();
    }
  }, [pixKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📲 QR Code PIX
          </CardTitle>
          <CardDescription>
            Compartilhe este QR Code para receber pagamentos instantâneos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pixKey ? (
            <>
              {/* QR Code Display */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center p-8 bg-white rounded-xl shadow-md"
              >
                <canvas ref={canvasRef} />
              </motion.div>

              {/* Actions */}
              <div className="flex gap-3 flex-col sm:flex-row">
                <Button
                  onClick={downloadQRCode}
                  disabled={loading}
                  variant="default"
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar QR Code
                </Button>
                <Button
                  onClick={copyPixKey}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Chave PIX
                </Button>
              </div>

              {/* Chave Display */}
              <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                <p className="text-xs text-muted-foreground mb-2">Sua chave PIX:</p>
                <p className="font-mono text-sm break-all text-foreground">{pixKey}</p>
              </div>

              {/* Tips */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">💡 Dicas de uso:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Compartilhe o QR Code no seu Instagram ou WhatsApp</li>
                  <li>Imprima para seu local de atendimento</li>
                  <li>Use em grupos ou redes sociais</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Configure uma chave PIX primeiro para gerar o QR Code
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
