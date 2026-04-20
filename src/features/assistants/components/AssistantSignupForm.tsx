import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/ui/page-loader'

import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/utils/error-handler'
import { sanitizeUserInput } from '@/lib/security'

interface AssistantSignupFormProps {
  token: string
}

export const AssistantSignupForm = ({
  token: _token,
}: AssistantSignupFormProps) => {
  const { toast } = useToast()
  const _navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(false)
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const cleanName = sanitizeUserInput(fullName)
        const cleanPhone = sanitizeUserInput(phone)

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
            },
          },
        })
        if (error) throw error
        toast({ title: 'Conta criada! Verifique seu email ou prossiga.' })
      }
    } catch (error) {
      const { title, description } = getErrorMessage(
        error,
        'Erro de autenticação',
      )
      toast({
        title,
        description,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg bg-card shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isLogin ? 'Acessar Portal da Assistente' : 'Criar Conta de Assistente'}
      </h2>
      <p className="text-center text-muted-foreground mb-6 text-sm">
        Entre ou cadastre-se para aceitar o convite.
      </p>
      <form onSubmit={handleAuth} className="space-y-4">
        {!isLogin && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <LoadingSpinner className="mr-2" />}

          {isLogin ? 'Entrar' : 'Cadastrar e Aceitar'}
        </Button>

        <div className="text-center text-sm pt-2">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </form>
    </div>
  )
}

