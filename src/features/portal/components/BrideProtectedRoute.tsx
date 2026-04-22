import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'

interface ValidateBrideTokenResult {
  valid: boolean
  client_id: string
  client_name: string
}

export default function BrideProtectedRoute() {
  const { clientId } = useParams()
  const [isValid, setIsValid] = useState<boolean | null>(null)

  useEffect(() => {
    async function validateSession() {
      // sessionStorage (per-tab, expires on close) — noiva acessa o portal de
      // forma esporádica, muitas vezes no celular da própria maquiadora ou em
      // dispositivo compartilhado. Persistir o token entre sessions seria
      // fricção menor, mas o risco de alguém fuçar o navegador depois supera.
      const token = sessionStorage.getItem('bride_access_token')
      const storedClientId = sessionStorage.getItem('bride_client_id')

      if (!clientId || !token || storedClientId !== clientId) {
        setIsValid(false)
        return
      }

      try {
        const { data, error } = await supabase.rpc('validate_bride_token', {
          p_token: token,
        })

        const validation = data as unknown as ValidateBrideTokenResult | null

        if (error || !validation?.valid) {
          sessionStorage.removeItem('bride_access_token')
          sessionStorage.removeItem('bride_client_id')
          setIsValid(false)
          return
        }

        if (validation.client_id !== clientId) {
          setIsValid(false)
          return
        }

        setIsValid(true)
      } catch {
        setIsValid(false)
      }
    }

    validateSession()
  }, [clientId])

  if (isValid === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
          <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-mono">
            Validando Acesso...
          </p>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return <Navigate to={`/portal/${clientId}/login`} replace />
  }

  return <Outlet />
}
