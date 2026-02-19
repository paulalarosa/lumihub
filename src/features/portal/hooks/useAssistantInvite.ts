import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Terminal, User } from 'lucide-react'

export const onboardingSteps = [
  {
    title: 'ACCESS_GRANTED',
    subtitle: 'RESTRICTED ENVIRONMENT. AUTHORIZED PERSONNEL ONLY.',
    icon: Terminal,
  },
  {
    title: 'SECURE_CHANNEL',
    subtitle: 'ESTABLISHING ENCRYPTED CONNECTION WITH HOST.',
    icon: User,
  },
]

export function useAssistantInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [assistant, setAssistant] = useState<{
    id: string
    name: string
    email: string | null
    is_registered: boolean
    professional_name?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('INVALID TOKEN')
        setLoading(false)
        return
      }

      try {
        const { data: assistantData, error: assistantError } = await supabase
          .from('assistants')
          .select('id, name, email, is_registered, user_id')
          .eq('invite_token', token)
          .single()

        if (assistantError || !assistantData) {
          setError('INVITE NOT FOUND OR EXPIRED')
          setLoading(false)
          return
        }

        if (assistantData.is_registered) {
          setError('INVITE ALREADY REDEEMED. PLEASE LOGIN.')
          setLoading(false)
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', assistantData.user_id)
          .single()

        setAssistant({
          ...assistantData,
          professional_name: profileData?.full_name || 'UNKNOWN_HOST',
        })

        if (assistantData.email) {
          setEmail(assistantData.email)
        }
      } catch (_err) {
        setError('VALIDATION_ERROR')
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!assistant) return

    if (password !== confirmPassword) {
      toast.error('PASSWORDS DO NOT MATCH')
      return
    }

    if (password.length < 6) {
      toast.error('PASSWORD MUST BE 6+ CHARS')
      return
    }

    setSubmitting(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: assistant.name,
            is_assistant: true,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: updateError } = await supabase
          .from('assistants')
          .update({
            assistant_user_id: authData.user.id,
            is_registered: true,
            email: email,
          })
          .eq('id', assistant.id)

        if (updateError) throw updateError

        toast.success('ACCOUNT CREATED. WELCOME.')
        navigate('/portal-assistente')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'CREATION FAILED'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return {
    token,
    loading,
    submitting,
    currentStep,
    assistant,
    error,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    handleSubmit,
    nextStep,
    prevStep,
    navigate,
  }
}
