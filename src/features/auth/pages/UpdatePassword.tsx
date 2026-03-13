import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/ui/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/utils/error-handler'

export default function UpdatePassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      const { title, description } = getErrorMessage(
        error,
        'Erro ao atualizar senha',
      )
      toast({
        title,
        description,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
      })
      navigate('/dashboard')
    }
    setIsSubmitting(false)
  }

  return (
    <AuthLayout title="Nova Senha" subtitle="Crie uma nova senha segura">
      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-gray-200"
          >
            Nova Senha
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            className="bg-[#1A1A1A] border-white/10 text-white h-12 rounded-none focus:ring-white focus:border-white placeholder:text-gray-600 font-mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-white text-black hover:bg-white/90 font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Salvar Nova Senha'
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
