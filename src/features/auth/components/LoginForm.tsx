import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

// 1. Definir o Schema com Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

// Inferir o tipo do formulário a partir do schema
type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  // isLoading removido em favor de isSubmitting nativo
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  // 2. Usar o hook useForm com o zodResolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...register('email')}
          disabled={isSubmitting} // Desabilitado enquanto envia
          className={
            errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
          }
        />
        {/* Renderizar mensagens de erro automaticamente */}
        {errors.email && (
          <span className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
            {errors.email.message}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          disabled={isSubmitting}
          className={
            errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
          }
        />
        {errors.password && (
          <span className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
            {errors.password.message}
          </span>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>
    </form>
  )
}
