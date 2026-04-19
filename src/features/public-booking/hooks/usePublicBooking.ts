import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { logger } from '@/services/logger'
import { formatDate } from '@/lib/date-utils'
import { publicBookingApi } from '../api/publicBookingApi'
import { buildTimeSlots } from '../lib/timeSlots'
import { RateLimitError } from '@/lib/rateLimit'
import type { Service, TimeSlot } from '../types'

export const usePublicBooking = (
  slug: string | undefined,
  refParam: string | null,
) => {
  const { toast } = useToast()
  const { trackBooking, trackConversion } = useAnalytics()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['public-booking', 'profile', slug],
    queryFn: () => {
      if (!slug) throw new Error('Missing slug')
      return publicBookingApi.getProfileBySlug(slug)
    },
    enabled: !!slug,
    retry: false,
  })

  const servicesQuery = useQuery({
    queryKey: ['public-booking', 'services', profileQuery.data?.id],
    queryFn: () => {
      if (!profileQuery.data) return []
      return publicBookingApi.getServicesForProfile(profileQuery.data.id)
    },
    enabled: !!profileQuery.data,
  })

  useEffect(() => {
    if (profileQuery.isError) {
      toast({ title: 'Perfil não encontrado', variant: 'destructive' })
    }
  }, [profileQuery.isError, toast])

  useEffect(() => {
    if (!selectedDate || !profileQuery.data || !selectedService || !slug) return

    let cancelled = false
    setLoadingSlots(true)

    ;(async () => {
      try {
        const dateStr = formatDate(selectedDate, 'yyyy-MM-dd')
        const events = await publicBookingApi.getDayAvailability(slug, dateStr)
        if (cancelled) return

        const slots = buildTimeSlots({
          date: selectedDate,
          serviceDurationMinutes: selectedService.duration_minutes,
          dayEvents: events,
        })
        setTimeSlots(slots)
      } catch (error) {
        logger.error(error, 'usePublicBooking.timeSlots', { showToast: false })
        if (!cancelled) {
          toast({ title: 'Erro ao gerar horários', variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedDate, profileQuery.data, selectedService, slug, toast])

  const handleBookingSubmit = async () => {
    if (!clientName || !clientPhone) {
      toast({ title: 'Preencha seus dados', variant: 'destructive' })
      return
    }

    if (!profileQuery.data || !selectedService || !selectedDate || !selectedTime) {
      toast({ title: 'Dados incompletos', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      await publicBookingApi.createBooking({
        profile: profileQuery.data,
        service: selectedService,
        date: formatDate(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        clientName,
        clientPhone,
        refParam,
      })
      trackBooking('completed', selectedService.id, selectedService.price)
      trackConversion({
        conversion_id: 'public_booking_completed',
        value: selectedService.price,
        currency: 'BRL',
      })
      setStep(4)
    } catch (error) {
      if (error instanceof RateLimitError) {
        const seconds = Math.ceil(error.retryAfterMs / 1000)
        toast({
          title: 'Muitas tentativas',
          description: `Aguarde ${seconds}s antes de tentar novamente.`,
          variant: 'destructive',
        })
      } else {
        logger.error(error, 'usePublicBooking.handleBookingSubmit', { showToast: false })
        toast({ title: 'Erro ao realizar agendamento', variant: 'destructive' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    profile: profileQuery.data ?? null,
    services: servicesQuery.data ?? [],
    loading: profileQuery.isLoading || servicesQuery.isLoading,
    step,
    setStep,
    selectedService,
    setSelectedService,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    submitting,
    timeSlots,
    loadingSlots,
    handleBookingSubmit,
  }
}
