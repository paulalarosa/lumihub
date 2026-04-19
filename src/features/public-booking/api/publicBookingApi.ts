import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { SupabaseClient } from '@supabase/supabase-js'
import { enforceRateLimit } from '@/lib/rateLimit'
import type { Profile, Service } from '../types'

type LocalDatabase = Database & {
  public: {
    Functions: {
      get_day_availability: {
        Args: { target_slug: string; query_date: string }
        Returns: {
          start_time: string
          end_time?: string
          duration_minutes?: number
        }[]
      }
    }
  }
}

export interface DayEvent {
  start_time: string
  end_time?: string
  duration_minutes?: number
}

export interface BookingPayload {
  profile: Profile
  service: Service
  date: string
  time: string
  clientName: string
  clientPhone: string
  clientEmail?: string | null
  refParam: string | null
}

export const publicBookingApi = {
  async getProfileBySlug(slug: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, bio, business_name, address')
      .eq('id', slug)
      .maybeSingle()

    if (error || !data) throw new Error('Perfil não encontrado')

    return {
      id: data.id,
      name: data.full_name || 'Profissional',
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      slug,
      business_address: data.address || data.business_name || null,
    }
  },

  async getServicesForProfile(profileId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, price, duration_minutes')
      .eq('user_id', profileId)

    if (error) throw error

    return (data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: Number(s.price),
      duration_minutes: Number(s.duration_minutes),
    }))
  },

  async getDayAvailability(slug: string, dateStr: string): Promise<DayEvent[]> {
    const typed = supabase as unknown as SupabaseClient<LocalDatabase>
    const { data, error } = await typed.rpc('get_day_availability', {
      target_slug: slug,
      query_date: dateStr,
    })
    if (error) throw error
    return data ?? []
  },

  async createBooking(payload: BookingPayload): Promise<void> {
    const { profile, service, date, time, clientName, clientPhone, refParam, clientEmail } = payload

    enforceRateLimit(`booking:${profile.id}`, 3, 60_000)

    const tags: string[] = ['origem:agendamento_online']
    if (refParam) tags.push(`ref:${refParam}`)

    const { data: newClient } = await supabase
      .from('wedding_clients')
      .insert({
        full_name: clientName,
        name: clientName,
        phone: clientPhone,
        email: clientEmail ?? null,
        user_id: profile.id,
        tags,
        origin: 'site_booking',
      })
      .select('id')
      .maybeSingle()

    const description = `Agendamento Online\nCliente: ${clientName}\nWhatsApp: ${clientPhone}\nServiço: ${service.name}`

    const { error } = await supabase.from('events').insert({
      user_id: profile.id,
      title: `${clientName} - ${service.name}`,
      description,
      event_date: date,
      start_time: time,
      duration_minutes: service.duration_minutes,
      is_active: true,
      total_value: service.price,
      client_id: newClient?.id ?? null,
    })

    if (error) throw error

    if (clientEmail) {
      void sendBookingConfirmationEmail({
        to: clientEmail,
        clientName,
        professionalName: profile.name,
        service,
        date,
        time,
      })
    }
  },
}

async function sendBookingConfirmationEmail(input: {
  to: string
  clientName: string
  professionalName: string
  service: Service
  date: string
  time: string
}) {
  try {
    const formattedDate = new Date(input.date + 'T00:00:00').toLocaleDateString(
      'pt-BR',
      { day: '2-digit', month: 'long', year: 'numeric' },
    )
    await supabase.functions.invoke('send-booking-confirmed', {
      body: {
        to: input.to,
        client_name: input.clientName.split(' ')[0],
        professional_name: input.professionalName,
        service_name: input.service.name,
        event_date: formattedDate,
        event_time: input.time,
        duration_minutes: input.service.duration_minutes,
      },
    })
  } catch {
    /* silent — booking is already saved; email is best-effort */
  }
}
