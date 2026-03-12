import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/authService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/hooks/use-toast'

export const useAuthActions = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setUser, setSession, setRole, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: ({ email, pass }: { email: string; pass: string }) =>
      AuthService.signIn(email, pass),
    onSuccess: async ({ data, error }) => {
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro no login',
          description: error.message,
        })
        return
      }

      if (data.user && data.session) {
        setUser(data.user)
        setSession(data.session)
        const { data: profile } = await AuthService.getProfile(data.user.id)
        setRole(profile?.role || 'professional')

        toast({
          title: 'Login realizado',
          description: 'Bem-vindo de volta!',
        })
        navigate('/dashboard')
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: error.message,
      })
    },
  })

  const signOutMutation = useMutation({
    mutationFn: () => AuthService.signOut(),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login')
      toast({
        title: 'Sessão encerrada',
        description: 'Até logo!',
      })
    },
  })

  const signUpMutation = useMutation({
    mutationFn: ({ email, pass }: { email: string; pass: string }) =>
      AuthService.signUp(email, pass),
    onSuccess: ({ error }) => {
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro no cadastro',
          description: error.message,
        })
        return
      }
      toast({
        title: 'Cadastro realizado',
        description: 'Verifique seu e-mail para confirmar a conta.',
      })
    },
  })

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    signOut: signOutMutation.mutate,
    isSigningOut: signOutMutation.isPending,
    signUp: signUpMutation.mutate,
    isSigningUp: signUpMutation.isPending,
  }
}
