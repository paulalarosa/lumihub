import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/textarea'
import { Star, CheckCircle, Camera, AlertTriangle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReviewCriteria {
  punctuality: number
  technique: number
  professionalism: number
  final_result: number
}

const CRITERIA_LABELS: Record<keyof ReviewCriteria, string> = {
  punctuality: 'Pontualidade',
  technique: 'Técnica',
  professionalism: 'Profissionalismo',
  final_result: 'Resultado Final',
}

export default function LeaveReview() {
  const { token } = useParams<{ token: string }>()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [criteria, setCriteria] = useState<ReviewCriteria>({
    punctuality: 0,
    technique: 0,
    professionalism: 0,
    final_result: 0,
  })
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)

  const {
    data: requestData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['review-request', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_requests')
        .select(
          `
          *,
          project:projects(
            *,
            client:wedding_clients(*),
            artist:makeup_artists(*)
          )
        `,
        )
        .eq('review_token', token!)
        .eq('status', 'pending')
        .single()

      if (error) throw error
      return data
    },
    enabled: !!token,
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!requestData) return

      const photoUrls: string[] = []
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop()
        const fileName = `reviews/${requestData.project_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('signed-contracts')
          .upload(fileName, photo)

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('signed-contracts')
            .getPublicUrl(fileName)
          photoUrls.push(urlData.publicUrl)
        }
      }

      const { error } = await supabase.from('reviews').insert({
        project_id: requestData.project_id,
        client_id: requestData.project?.client_id || null,
        makeup_artist_id: requestData.project?.artist?.id,
        rating,
        punctuality: criteria.punctuality || null,
        technique: criteria.technique || null,
        professionalism: criteria.professionalism || null,
        final_result: criteria.final_result || null,
        comment: comment || null,
        photos: photoUrls,
        review_token: token,
      })

      if (error) throw error

      await supabase
        .from('review_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestData.id)
    },
    onSuccess: () => {
      setSubmitted(true)
      toast.success('Avaliação enviada com sucesso!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao enviar avaliação')
    },
  })

  const handlePhotoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (photos.length + files.length > 5) {
        toast.error('Máximo de 5 fotos')
        return
      }
      setPhotos((prev) => [...prev, ...files])
    },
    [photos.length],
  )

  const removePhoto = useCallback((idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Carregando avaliação...</p>
        </div>
      </div>
    )
  }

  if (queryError || !requestData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-red-500/50 rounded-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
          <p className="text-neutral-400">
            Este link de avaliação é inválido ou já foi utilizado.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Obrigado!</h1>
          <p className="text-neutral-400">
            Sua avaliação foi enviada e será publicada em breve.
          </p>
        </div>
      </div>
    )
  }

  const artistName =
    (requestData.project as Record<string, unknown>)?.artist &&
    typeof (requestData.project as Record<string, unknown>).artist === 'object'
      ? (
          (requestData.project as Record<string, unknown>).artist as Record<
            string,
            string
          >
        )?.name
      : 'nossa equipe'

  return (
    <div className="min-h-screen bg-neutral-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Como foi sua experiência?
          </h1>
          <p className="text-neutral-400">Com {artistName}</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 space-y-8">
          <div>
            <label className="block text-lg font-semibold text-white mb-4 text-center">
              Avaliação Geral *
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-12 h-12',
                      (hoveredRating || rating) >= star
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-neutral-600',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">
              Avalie os seguintes aspectos:
            </h3>

            {(
              Object.entries(CRITERIA_LABELS) as [
                keyof ReviewCriteria,
                string,
              ][]
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-neutral-400">{label}</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setCriteria((prev) => ({ ...prev, [key]: star }))
                      }
                    >
                      <Star
                        className={cn(
                          'w-5 h-5',
                          criteria[key] >= star
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-neutral-600',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Conte-nos sobre sua experiência
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="O que você mais gostou? Como foi o atendimento?"
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Fotos (opcional)
            </label>
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-neutral-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                  <Camera className="w-8 h-8 text-neutral-500 mb-2" />
                  <span className="text-xs text-neutral-500">Adicionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-2">Máximo de 5 fotos</p>
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={rating === 0 || submitMutation.isPending}
            className="w-full bg-white text-black hover:bg-neutral-200 font-semibold"
            size="lg"
          >
            {submitMutation.isPending ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-neutral-600 text-xs font-mono uppercase tracking-wider">
            Khaos Kontrol — Sistema de Avaliações
          </p>
        </div>
      </div>
    </div>
  )
}
