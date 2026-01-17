import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Check, ArrowRight, Terminal, User } from "lucide-react";
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
      title: "ACCESS_GRANTED",
      subtitle: "RESTRICTED ENVIRONMENT. AUTHORIZED PERSONNEL ONLY.",
      icon: Terminal,
    },
    {
      title: "SECURE_CHANNEL",
      subtitle: "ESTABLISHING ENCRYPTED CONNECTION WITH HOST.",
      icon: User,
    }
  ];

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("INVALID TOKEN");
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
          setError("INVITE NOT FOUND OR EXPIRED");
          setLoading(false);
          return;
        }

        if (assistantData.is_registered) {
          setError("INVITE ALREADY REDEEMED. PLEASE LOGIN.");
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
          professional_name: profileData?.full_name || "UNKNOWN_HOST"
        });

        if (assistantData.email) {
          setEmail(assistantData.email);
        }
      } catch (err) {
        setError("VALIDATION_ERROR");
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
      toast.error("PASSWORDS DO NOT MATCH");
      return;
    }

    if (password.length < 6) {
      toast.error("PASSWORD MUST BE 6+ CHARS");
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

        toast.success("ACCOUNT CREATED. WELCOME.");
        navigate("/assistente");
      }
    } catch (err: any) {
      toast.error(err.message || "CREATION FAILED");
    } finally {
      setSubmitting(false);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 font-mono">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest">VALIDATING_HANDSHAKE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 font-mono">
        <Card className="w-full max-w-md bg-black border border-white/20 rounded-none">
          <CardHeader className="text-center border-b border-white/10 pb-6">
            <CardTitle className="text-red-500 font-mono uppercase tracking-widest">ERROR: {error}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-6">
            <Button onClick={() => navigate("/auth")} variant="outline" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono uppercase text-xs">
              MIGRATE TO LOGIN
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 selection:bg-white selection:text-black font-mono">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex justify-start mb-12 border-b border-white/20 pb-4">
          <div className="flex space-x-1">
            {onboardingSteps.map((_, index) => (
              <motion.div
                key={index}
                className={`h-1 w-12 rounded-none ${index <= currentStep ? 'bg-white' : 'bg-white/20'
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-left"
            >
              <div className="border-l-2 border-white pl-8 mb-12">
                <div className="mb-6">
                  {(() => {
                    const Icon = onboardingSteps[currentStep].icon;
                    return <Icon className="h-8 w-8 text-white" />;
                  })()}
                </div>

                <h1 className="text-4xl font-bold mb-4 font-serif uppercase tracking-tighter">
                  {onboardingSteps[currentStep].title}
                </h1>
                <p className="text-white/60 font-mono text-sm uppercase tracking-widest">
                  {onboardingSteps[currentStep].subtitle}
                </p>
              </div>

              {currentStep === 0 && assistant && (
                <div className="bg-white/5 border border-white/10 p-6 mb-8 rounded-none">
                  <p className="text-xs text-white/50 uppercase tracking-widest mb-2">INVITED_BY</p>
                  <p className="text-xl font-serif text-white">{assistant.professional_name}</p>
                </div>
              )}

              <Button
                onClick={nextStep}
                className="w-full md:w-auto px-8 h-12 bg-white text-black hover:bg-white/80 rounded-none font-mono text-xs uppercase tracking-widest"
              >
                INITIALIZE_PROTOCOL <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            // Registration Form
            <motion.div
              key="registration"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border border-white/20 bg-black p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Terminal className="w-24 h-24 text-white" />
                </div>

                <div className="relative z-10">
                  <div className="mb-8 border-b border-white/10 pb-6">
                    <h2 className="text-2xl font-serif uppercase text-white mb-2">CREATE_IDENTITY</h2>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-none animate-pulse"></span>
                      <p className="text-xs font-mono uppercase tracking-widest text-white/60">
                        INVITE_CODE: {token?.substring(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-mono text-xs uppercase">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="OPERATOR@LUMI.COM"
                        required
                        className="h-12 bg-black border-white/20 rounded-none focus:border-white text-white font-mono text-xs uppercase placeholder:text-white/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="font-mono text-xs uppercase">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="******"
                          required
                          className="h-12 bg-black border-white/20 rounded-none focus:border-white text-white font-mono text-xs uppercase placeholder:text-white/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="font-mono text-xs uppercase">Confirm</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="******"
                          required
                          className="h-12 bg-black border-white/20 rounded-none focus:border-white text-white font-mono text-xs uppercase placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <Button
                        type="submit"
                        className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            PROCESSING...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            ESTABLISH_UPLINK
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-6 text-center">
                    <Button
                      variant="link"
                      onClick={prevStep}
                      className="text-white/40 hover:text-white font-mono text-[10px] uppercase tracking-widest"
                    >
                      ← ABORT
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AssistantInvite;
