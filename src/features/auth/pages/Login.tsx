import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthLayout from '@/components/ui/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Terminal } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useLanguage } from '@/hooks/useLanguage'
import { getErrorMessage } from '@/utils/error-handler'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await signIn(email, password)

    if (error) {
      const { title, description } = getErrorMessage(
        error,
        t('login_toast_denied'),
      )
      toast({
        title,
        description,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('login_toast_granted'),
        description: t('login_toast_session'),
      })

      // Check if user is an assistant
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: assistant } = await supabase
          .from('assistants')
          .select('id')
          .eq('assistant_user_id', user.id)
          .maybeSingle()

        if (assistant) {
          navigate('/portal-assistente')
        } else {
          navigate('/dashboard')
        }
      } else {
        navigate('/dashboard')
      }
    }
    setIsSubmitting(false)
  }

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      const { title, description } = getErrorMessage(
        error,
        t('login_toast_error'),
      )
      toast({
        title,
        description,
        variant: 'destructive',
      })
    }
  }

  return (
    <AuthLayout title={t('login_title')} subtitle={t('login_subtitle')}>
      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border border-white/20 hover:bg-white hover:text-black hover:border-white rounded-none bg-black text-white font-mono uppercase tracking-widest text-xs transition-colors"
          onClick={handleGoogle}
        >
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          {t('login_google')}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-white/40 font-mono tracking-widest">
              {t('login_or')}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label
              htmlFor="email"
              className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5"
            >
              {t('login_email')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="OPERATIVA@LUMI.COM"
              className="block w-full rounded-none bg-black border-white/20 text-white focus:border-white focus:ring-0 h-11 placeholder:text-white/20 font-mono text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5"
            >
              {t('login_password')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="block w-full rounded-none bg-black border-white/20 text-white focus:border-white focus:ring-0 h-11 placeholder:text-white/20 font-mono text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest flex items-center gap-1">
                <Terminal className="h-3 w-3" /> {t('login_secure_conn')}
              </span>
              <Link
                to="/auth/forgot-password"
                className="text-[10px] text-white/50 hover:text-white transition-colors font-mono uppercase tracking-widest underline decoration-white/30 underline-offset-4"
              >
                {t('login_forgot')}
              </Link>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-white text-black hover:bg-gray-200 rounded-none font-mono uppercase tracking-widest text-xs font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            t('login_submit')
          )}
        </Button>

        <p className="text-center text-xs text-white/40 mt-6 font-mono uppercase tracking-widest">
          {t('login_no_account')}{' '}
          <Link
            to="/register"
            className="text-white hover:underline decoration-white underline-offset-4 ml-1"
          >
            {t('login_register')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
