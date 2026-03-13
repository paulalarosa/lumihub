import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { motion } from 'framer-motion'

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
})

const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
})

export default function Auth() {
  const navigate = useNavigate()
  const { user, signIn, signUp, loading } = useAuth()
  const { toast } = useToast()

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = loginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    })
    if (!result.success) {
      toast({
        title: 'Erro de validação',
        description: result.error.errors[0].message,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    const { error } = await signIn(loginEmail, loginPassword)

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description:
          error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos'
            : error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Bem-vinda!',
        description: 'Login realizado com sucesso',
      })
    }
    setIsSubmitting(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = signupSchema.safeParse({
      fullName: signupName,
      email: signupEmail,
      password: signupPassword,
    })

    if (!result.success) {
      toast({
        title: 'Erro de validação',
        description: result.error.errors[0].message,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    const { error } = await signUp(signupEmail, signupPassword, signupName)

    if (error) {
      let message = error.message
      if (error.message.includes('already registered')) {
        message = 'Este email já está cadastrado'
      }
      toast({
        title: 'Erro ao cadastrar',
        description: message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Seu cadastro foi realizado com sucesso',
      })
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md glass-card border-0 shadow-strong">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-glow">
                <span className="text-2xl font-serif font-bold text-white">
                  L
                </span>
              </div>
            </div>
            <CardTitle className="font-serif text-3xl">Lumi</CardTitle>
            <CardDescription className="text-base">
              Acesse sua conta ou crie uma nova para começar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full glow-hover bg-gradient-to-r from-primary to-accent text-white border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        className="pl-10"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full glow-hover bg-gradient-to-r from-primary to-accent text-white border-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Cadastrando...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
