import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, CalendarHeart, Clock, MapPin, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ValidateBrideTokenResult {
  valid: boolean
  client_id: string
  client_name: string
}

interface BrideAccessData {
  client_id: string
  bride_name: string
  wedding_date: string
  wedding_location: string
}

export default function BridePortal() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BrideAccessData | null>(null)

  useEffect(() => {
    if (!clientId) {
      setError('Link inválido.')
      setLoading(false)
      return
    }
    fetchData(clientId)
  }, [clientId])

  const fetchData = async (cId: string) => {
    try {
      const token = localStorage.getItem('bride_access_token')

      if (!token) {
        throw new Error('Sessão expirada')
      }

      const { data: validation, error: valError } = await supabase.rpc(
        'validate_bride_token',
        { p_token: token },
      )

      const typedValidation =
        validation as unknown as ValidateBrideTokenResult | null

      if (valError || !typedValidation?.valid) {
        localStorage.removeItem('bride_access_token')
        localStorage.removeItem('bride_client_id')
        throw new Error('Token inválido ou expirado')
      }

      if (typedValidation.client_id !== cId) {
        throw new Error('Acesso não autorizado')
      }

      const { data: projects } = await supabase
        .from('projects')
        .select('event_date, event_location')
        .eq('client_id', cId)
        .order('created_at', { ascending: false })
        .limit(1)

      const project = projects?.[0]

      setData({
        client_id: cId,
        bride_name: typedValidation.client_name,
        wedding_date: project?.event_date || new Date().toISOString(),
        wedding_location: project?.event_location || 'Local a definir',
      })
    } catch (_e) {
      setError('Acesso não autorizado ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
          <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-mono">
            Validando Acesso...
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <div className="max-w-md w-full border border-neutral-800 p-8 text-center bg-black">
          <div className="flex justify-center mb-6">
            <CalendarHeart className="w-12 h-12 text-neutral-700" />
          </div>
          <h1 className="text-xl font-serif text-white uppercase tracking-widest mb-4">
            Acesso Restrito
          </h1>
          <p className="text-sm text-neutral-500 font-mono mb-8">
            {error || 'Não foi possível carregar os dados.'}
          </p>
          <Button
            onClick={() => navigate(`/portal/${clientId}/login`)}
            className="w-full rounded-none bg-white text-black hover:bg-neutral-200 uppercase tracking-widest text-xs font-bold py-6"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black font-sans">
      <header className="border-b border-neutral-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <span className="font-serif italic text-xl">KONTROL Bride</span>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 border border-neutral-800 px-3 py-1 bg-black">
            Portal Exclusivo
          </span>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 md:py-20">
        <div className="flex flex-col items-center text-center mb-24">
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 mb-6">
            Casamento de
          </p>
          <h1 className="text-4xl md:text-7xl font-serif text-white uppercase tracking-wider mb-8 leading-tight">
            {data.bride_name}
          </h1>

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 text-neutral-400 font-mono text-xs uppercase tracking-widest border-t border-b border-neutral-900 py-6 px-12">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {new Date(data.wedding_date).toLocaleDateString()}
            </div>
            <div className="hidden md:block w-px h-4 bg-neutral-800" />
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {data.wedding_location}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-900 border border-neutral-900">
          <div className="bg-[#050505] p-12 aspect-square flex flex-col justify-between group hover:bg-neutral-950 transition-colors">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 block mb-2">
                01
              </span>
              <h2 className="text-2xl font-serif text-white italic">
                Cronograma
              </h2>
            </div>
            <p className="text-sm text-neutral-500 font-mono leading-relaxed max-w-xs mt-4">
              Visualize o passo a passo do seu grande dia. Detalhes
              milimetricamente planejados.
            </p>
            <div className="mt-8 flex justify-end">
              <Button
                variant="outline"
                className="rounded-none border-neutral-800 text-neutral-400 hover:text-white hover:border-white uppercase text-[10px] tracking-widest"
              >
                Ver Detalhes
              </Button>
            </div>
          </div>

          <div className="bg-[#050505] p-12 aspect-square flex flex-col justify-between group hover:bg-neutral-950 transition-colors">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 block mb-2">
                02
              </span>
              <h2 className="text-2xl font-serif text-white italic">
                Documentos
              </h2>
            </div>
            <p className="text-sm text-neutral-500 font-mono leading-relaxed max-w-xs mt-4">
              Contratos, orçamentos e guias. Tudo centralizado e seguro.
            </p>
            <div className="mt-8 flex justify-end">
              <Button
                variant="outline"
                className="rounded-none border-neutral-800 text-neutral-400 hover:text-white hover:border-white uppercase text-[10px] tracking-widest"
              >
                <Download className="w-3 h-3 mr-2" />
                Arquivos
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-800">
            Powered by Khaos Kontrol • Professional Organization
          </p>
        </div>
      </main>
    </div>
  )
}
