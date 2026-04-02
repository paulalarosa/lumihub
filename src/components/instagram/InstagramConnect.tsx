import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Instagram, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const INSTAGRAM_APP_ID = import.meta.env.VITE_INSTAGRAM_APP_ID
const REDIRECT_URI = `${window.location.origin}/instagram/callback`

export const InstagramConnect = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: connection, isLoading } = useQuery({
    queryKey: ['instagram-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_connections')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user,
  })

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!connection?.id) return
      const { error } = await supabase
        .from('instagram_connections')
        .update({ is_connected: false })
        .eq('id', connection.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-connection'] })
      toast.success('Instagram desconectado')
    },
  })

  const handleConnect = () => {
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}&scope=instagram_basic,instagram_content_publish&response_type=code&state=${user?.id}`

    window.location.href = authUrl
  }

  if (isLoading) {
    return <div className="p-4 text-white">Carregando...</div>
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Instagram className="w-6 h-6 text-pink-500" />
          Instagram
        </CardTitle>
      </CardHeader>

      <CardContent>
        {connection?.is_connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-semibold text-white">Conectado</p>
                <p className="text-sm text-neutral-400">
                  @{connection.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-800 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {connection.followers_count?.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400 uppercase">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {connection.following_count?.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400 uppercase">Seguindo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {connection.media_count?.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400 uppercase">Posts</p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              Desconectar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-neutral-500" />
              <p className="text-neutral-400">Não conectado</p>
            </div>

            <Button
              onClick={handleConnect}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Instagram className="w-4 h-4 mr-2" />
              Conectar Instagram
            </Button>

            <div className="text-xs text-neutral-500 space-y-1 mt-4">
              <p>✓ Publicar posts e stories</p>
              <p>✓ Agendar publicações</p>
              <p>✓ Analytics de engagement</p>
              <p>✓ Hashtags inteligentes com IA</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
