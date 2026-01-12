import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface PublicProfilePreviewProps {
  userId?: string;
  businessName?: string | null;
  bio?: string | null;
  servicesCount?: number;
  primaryColor?: string;
  phone?: string | null;
  instagram?: string | null;
}

export default function PublicProfilePreview({
  userId,
  businessName,
  bio,
  servicesCount = 0,
  primaryColor = '#5A7D7C',
  phone,
  instagram,
}: PublicProfilePreviewProps) {
  const { toast } = useToast();

  const publicUrl = userId ? `${window.location.origin}/p/${userId}` : '';

  const copyLink = async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: 'Link copiado!',
        description: 'Compartilhe este link com seus clientes',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Preview Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Preview Header */}
        <div
          className="h-24 w-full"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          }}
        />

        <CardContent className="p-6 -mt-12 relative">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 bg-gray-300 rounded-2xl border-4 border-background flex items-center justify-center mb-4 shadow-md"
          >
            <span className="text-3xl">📸</span>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {businessName || 'Seu Negócio'}
              </h2>
              <p className="text-sm text-muted-foreground">Profissional de beleza</p>
            </div>

            {bio && (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {bio}
              </p>
            )}

            {/* Socials */}
            <div className="flex gap-3 pt-2">
              {phone && (
                <Button variant="outline" size="sm" className="gap-2">
                  📱 WhatsApp
                </Button>
              )}
              {instagram && (
                <Button variant="outline" size="sm" className="gap-2">
                  📷 Instagram
                </Button>
              )}
            </div>

            {/* Services Badge */}
            {servicesCount > 0 && (
              <div className="pt-2">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {servicesCount} serviço{servicesCount !== 1 ? 's' : ''} disponível{servicesCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Link Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Meu Link Público
          </CardTitle>
          <CardDescription>
            Compartilhe este link para que seus clientes te encontrem facilmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-muted/50 rounded-lg border border-muted flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Link do seu perfil:</p>
              <p className="font-mono text-sm break-all text-foreground">
                {publicUrl}
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-3 flex-col sm:flex-row"
          >
            <Button onClick={copyLink} className="flex-1 gap-2">
              <Copy className="h-4 w-4" />
              Copiar Link
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                if (publicUrl) window.open(publicUrl, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Visualizar
            </Button>
          </motion.div>

          {/* Share Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2"
          >
            <p className="font-medium text-sm text-blue-900 dark:text-blue-200">
              💡 Onde compartilhar:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 ml-4 list-disc">
              <li>Bio do Instagram</li>
              <li>Status do WhatsApp</li>
              <li>Descrição do TikTok</li>
              <li>Assinatura de email</li>
              <li>Cartão de visita digital</li>
            </ul>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-3 pt-2"
          >
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground mt-1">Visitas</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground mt-1">Cliques</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">{servicesCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Serviços</p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
