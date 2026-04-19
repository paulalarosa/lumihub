import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AssistantInvite {
  id: string
  email: string
  full_name: string | null
  status: string
  is_registered: boolean
  invite_token: string | null
}

export function useInviteLanding() {
  const { token: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const token = pathToken || searchParams.get('token')
  const navigate = useNavigate()

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>(
    'loading',
  )
  const [inviteData, setInviteData] = useState<AssistantInvite | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    checkInvite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const checkInvite = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('assistants')
        .select('id, email, full_name, status, is_registered, invite_token')
        .eq('invite_token', token as string)
        .maybeSingle()

      if (error || !data) {
        setStatus('invalid')
        return
      }

      const safeData = data as unknown as AssistantInvite

      if (safeData.is_registered) {
        toast.error('Este convite já foi utilizado.')
        navigate('/auth')
        return
      }

      if (safeData.status !== 'pending') {
        setStatus('invalid')
        return
      }

      setInviteData(safeData)
      setStatus('valid')
    } catch (_error) {
      setStatus('invalid')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (!inviteData) return

    setLoading(true)

    try {
      const originalEmail = inviteData.email
      const sanitizedEmail = originalEmail
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
        .toLowerCase()
      const cleanFullName = formData.fullName.trim()
      const cleanPhone = formData.phone.trim()

      let userId = null

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: formData.password.trim(),
        options: {
          data: {
            full_name: cleanFullName,
            phone: cleanPhone,
            role: 'assistant',
          },
        },
      })

      if (authError) {
        if (
          authError.message.includes('already registered') ||
          authError.message.includes('User already registered') ||
          authError.status === 400
        ) {
          toast.info('Conta existente identificada!', {
            description: 'Tentando vincular com a senha informada...',
          })

          const { data: loginData, error: loginError } =
            await supabase.auth.signInWithPassword({
              email: sanitizedEmail,
              password: formData.password.trim(),
            })

          if (loginError) {
            toast.error(
              'Você já possui uma conta, mas a senha está incorreta.',
              { description: 'Use sua senha antiga para aceitar o convite.' },
            )
            setLoading(false)
            return
          }

          if (loginData.user) {
            userId = loginData.user.id
            toast.success('Login realizado! Vinculando agenda...')
          }
        } else {
          throw authError
        }
      } else if (authData.user) {
        userId = authData.user.id
      }

      if (userId) {
        const { error: updateError } = await supabase
          .from('assistants')
          .update({
            assistant_user_id: userId,
            is_registered: true,
            status: 'accepted',
            phone: cleanPhone,
            full_name: cleanFullName,
            invite_token: null,
          } as any)
          .eq('id', inviteData.id)

        if (updateError) {
          throw new Error('Falha ao vincular contrato. Tente novamente.')
        }

        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: userId,
            email: sanitizedEmail,
            full_name: cleanFullName,
            role: 'assistant',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )

        if (profileError) {
          toast.error('Erro ao criar perfil de usuário.')
        }

        toast.success('Acesso liberado com sucesso!')

        setTimeout(() => {
          navigate('/portal-assistente')
        }, 1000)
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao processar cadastro.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    status,
    inviteData,
    loading,
    formData,
    setFormData,
    handleRegister,
  }
}
