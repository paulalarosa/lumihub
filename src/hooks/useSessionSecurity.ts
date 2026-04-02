import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { sessionTimeout } from '@/lib/security'

export function useSessionSecurity() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    const cleanup = sessionTimeout(
      () => {
        signOut()
        navigate('/login')
      },
      30 * 60 * 1000,
    )

    return cleanup
  }, [user, signOut, navigate])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) return
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}
