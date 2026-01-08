import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus, CheckCircle, Sparkles, Crown, Star, ArrowRight, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AssistantInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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

  const onboardingSteps = [
    {
      title: "Bem-vinda ao Time VIP",
      subtitle: "Você foi convidada para fazer parte de uma equipe exclusiva",
      icon: Crown,
      color: "from-yellow-400 to-orange-500"
    },
    {
      title: "Crie sua Conta Premium",
      subtitle: "Acesse ferramentas exclusivas para profissionais",
      icon: Star,
      color: "from-purple-400 to-pink-500"
    },
    {
      title: "Comece sua Jornada",
      subtitle: "Descubra oportunidades incríveis esperando por você",
      icon: Sparkles,
      color: "from-blue-400 to-cyan-500"
    }
  ];

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

  const renderCurrentIcon = () => {
    const IconComponent = onboardingSteps[currentStep].icon;
    return <IconComponent className="h-10 w-10 text-white" />;
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validando seu convite VIP...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {onboardingSteps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 w-12 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep < onboardingSteps.length - 1 ? (
            // Onboarding Steps
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Card className="max-w-md mx-auto border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-12 pb-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className={`mx-auto w-20 h-20 bg-gradient-to-br ${onboardingSteps[currentStep].color} rounded-full flex items-center justify-center mb-6 shadow-lg`}
                  >
                    {renderCurrentIcon()}
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold mb-2"
                  >
                    {onboardingSteps[currentStep].title}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground mb-8"
                  >
                    {onboardingSteps[currentStep].subtitle}
                  </motion.p>

                  {currentStep === 0 && assistant && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-primary/10 rounded-lg p-4 mb-6"
                    >
                      <p className="text-sm text-primary font-medium mb-1">Convidada por:</p>
                      <p className="font-semibold">{assistant.professional_name}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Prepare-se para uma jornada incrível! ✨
                      </p>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      onClick={nextStep}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg"
                      size="lg"
                    >
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // Registration Form
            <motion.div
              key="registration"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="max-w-md mx-auto border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Heart className="h-8 w-8 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <CardTitle className="text-2xl">Bem-vinda, {assistant?.name}!</CardTitle>
                    <CardDescription className="mt-2">
                      Você foi convidada por <strong className="text-primary">{assistant?.professional_name}</strong> para fazer parte do time VIP.
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="h-12"
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
                        className="h-12"
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
                        className="h-12"
                      />
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="pt-4"
                    >
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando conta...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Entrar no Portal VIP
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 text-center"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevStep}
                      className="text-muted-foreground hover:text-primary"
                    >
                      ← Voltar
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AssistantInvite;
