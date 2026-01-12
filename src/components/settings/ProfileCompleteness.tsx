import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileCompletenessProps {
  bio?: string | null;
  pixKey?: string | null;
  servicesCount?: number;
  businessName?: string | null;
  phone?: string | null;
  instagram?: string | null;
}

export default function ProfileCompleteness({
  bio,
  pixKey,
  servicesCount = 0,
  businessName,
  phone,
  instagram,
}: ProfileCompletenessProps) {
  const [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    // Calcular completude baseado em campos preenchidos
    let filled = 0;
    let total = 6;

    if (businessName?.trim()) filled++;
    if (phone?.trim()) filled++;
    if (instagram?.trim()) filled++;
    if (bio?.trim()) filled++;
    if (pixKey?.trim()) filled++;
    if (servicesCount > 0) filled++;

    setCompleteness(Math.round((filled / total) * 100));
  }, [bio, pixKey, servicesCount, businessName, phone, instagram]);

  const checklist = [
    { label: 'Nome do Negócio', done: !!businessName?.trim() },
    { label: 'Telefone/WhatsApp', done: !!phone?.trim() },
    { label: 'Instagram', done: !!instagram?.trim() },
    { label: 'Bio/Descrição', done: !!bio?.trim() },
    { label: 'Chave PIX', done: !!pixKey?.trim() },
    { label: 'Serviços Cadastrados', done: servicesCount > 0 },
  ];

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Completude do Perfil</CardTitle>
            <CardDescription>
              Quanto melhor seu perfil, mais clientes descobrem você
            </CardDescription>
          </div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-primary"
          >
            {completeness}%
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Progress value={completeness} className="h-3 rounded-full" />
        </motion.div>

        {/* Checklist */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          {checklist.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  item.done
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Tips */}
        {completeness < 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-900 dark:text-blue-200"
          >
            💡 Dica: Complete seu perfil para aumentar a confiança e visibilidade com potenciais clientes!
          </motion.div>
        )}

        {completeness === 100 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-900 dark:text-green-200"
          >
            ✨ Parabéns! Seu perfil está 100% completo!
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
