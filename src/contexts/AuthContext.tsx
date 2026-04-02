import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { Logger } from '@/services/logger'
import { handleError } from '@/lib/error-handling'

import { AuthContext } from '@/contexts/AuthContextDefinition'
import { setSentryUser, clearSentryUser } from '@/lib/sentry'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const _location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>('professional')

  const lastUserId = useRef<string | null>(null)

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        return 'professional'
      }

      const safeData = data as { role?: string }
      return safeData?.role || 'professional'
    } catch (err) {
      handleError(err, 'AuthContext:fetchRole')
      return 'professional'
    }
  }

  const signIn = useCallback(
    (email: string, pass: string) =>
      supabase.auth.signInWithPassword({ email, password: pass }),
    [],
  )

  const signOut = useCallback(async () => {
    if (user) {
      Logger.action('USER_SIGN_OUT', user.id, 'auth.users', user.id)
    }
    setLoading(true)
    await supabase.auth.signOut()

    setRole(null)
    setUser(null)
    setSession(null)
    lastUserId.current = null
    setLoading(false)
  }, [user])

  const getRedirectUrl = () => {
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return `${window.location.origin}/auth/callback`
    }

    const domain = window.location.hostname.endsWith('khaoskontrol.com.br')
      ? 'https://khaoskontrol.com.br'
      : window.location.origin

    return `${domain}/auth/callback`
  }

  const signInWithGoogle = useCallback(
    () =>
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
          scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      }),
    [],
  )

  const signUp = useCallback(
    (email: string, pass: string, fullName?: string, businessName?: string) =>
      supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
          },
        },
      }),
    [],
  )

  const isAdmin = role === 'studio' || role === 'admin'

  useEffect(() => {
    let mounted = true

    const handleSession = async (currentSession: Session | null) => {
      if (!mounted) return

      const currentId = currentSession?.user?.id ?? null

      if (currentId === lastUserId.current) {
        setSession(currentSession)
        if (loading) setLoading(false)
        return
      }

      setLoading(true)
      lastUserId.current = currentId

      if (currentSession?.user) {
        Logger.action(
          'USER_SIGN_IN',
          currentSession.user.id,
          'auth.users',
          currentSession.user.id,
        )

        setSession(currentSession)
        setUser(currentSession.user)

        const userRole = await fetchRole(currentSession.user.id)

        if (mounted) {
          setRole(userRole)
          setSentryUser({
            id: currentSession.user.id,
            email: currentSession.user.email,
            role: userRole,
          })
          setLoading(false)
        }
      } else {
        setSession(null)
        setUser(null)
        setRole(null)
        clearSentryUser()

        if (mounted) {
          setLoading(false)
        }
      }
    }

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          if (error.message.includes('Invalid Refresh Token')) {
            signOut()
            navigate('/login')
            return
          }
        }
        handleSession(session)
      })
      .catch((err) => {
        handleError(err, 'AuthContext:getSession')
        signOut()
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event as string) === 'TOKEN_REFRESH_ERROR') {
        await signOut()
        navigate('/login')
        return
      }

      handleSession(session)

      if (event === 'SIGNED_IN' && session) {
        if (
          window.location.hash &&
          window.location.hash.includes('access_token')
        ) {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search,
          )
        }

        if (
          window.location.pathname === '/login' ||
          window.location.pathname === '/auth/login' ||
          window.location.pathname === '/register'
        ) {
          navigate('/dashboard')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        signIn,
        signOut,
        signInWithGoogle,
        signUp,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
