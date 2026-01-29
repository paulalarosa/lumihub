import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, isBefore, startOfDay, parse } from 'date-fns';
import { Profile, Service, TimeSlot } from '../types';

export const usePublicBooking = (slug: string | undefined, refParam: string | null) => {
    const { toast } = useToast();

    // State
    const [profile, setProfile] = useState<Profile | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking State
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Form State
    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Time Slots
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchProfileAndServices();
        }
    }, [slug]);

    useEffect(() => {
        if (selectedDate && profile && selectedService) {
            generateTimeSlots();
        }
    }, [selectedDate, profile, selectedService]);

    const fetchProfileAndServices = async () => {
        try {
            setLoading(true);
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', slug)
                .maybeSingle();

            if (profileError || !profileData) {
                throw new Error("Perfil não encontrado");
            }

            const { data: settingsData } = await supabase
                .from('professional_settings' as any)
                .select('bio, business_name')
                .eq('user_id', slug)
                .maybeSingle();

            setProfile({
                id: profileData.id,
                name: profileData.full_name || 'Profissional',
                full_name: profileData.full_name,
                avatar_url: profileData.avatar_url,
                bio: settingsData?.bio || null,
                slug: slug || '',
                business_address: settingsData?.business_name || null
            });

            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('id, name, description, price, duration_minutes')
                .eq('user_id', profileData.id);

            if (servicesError) throw servicesError;

            setServices((servicesData || []).map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                price: Number(s.price),
                duration_minutes: Number(s.duration_minutes)
            })));

        } catch (error) {
            console.error("Error fetching public profile:", error);
            toast({ title: "Perfil não encontrado", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const generateTimeSlots = async () => {
        if (!selectedDate || !profile || !selectedService) return;

        setLoadingSlots(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            // @ts-ignore - RPC not typed in auto-generated types
            const { data: eventsData, error } = await supabase
                .rpc('get_day_availability' as any, {
                    target_slug: slug,
                    query_date: dateStr
                });

            const events = (eventsData as { start_time: string; end_time?: string; duration_minutes?: number }[]) || [];

            if (error) throw error;

            const startHour = 9;
            const endHour = 18;
            const serviceDuration = selectedService.duration_minutes;
            const slots: TimeSlot[] = [];

            for (let hour = startHour; hour < endHour; hour++) {
                for (let min = 0; min < 60; min += 30) {
                    const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                    const slotStart = parse(time, 'HH:mm', new Date());
                    const slotEnd = addMinutes(slotStart, serviceDuration);
                    let isBlocked = false;

                    if (events) {
                        for (const event of events) {
                            const eventStart = parse(event.start_time, 'HH:mm', new Date());
                            let eventEnd;
                            if (event.end_time) {
                                eventEnd = parse(event.end_time, 'HH:mm', new Date());
                            } else {
                                eventEnd = addMinutes(eventStart, event.duration_minutes || 60);
                            }

                            if (
                                (slotStart >= eventStart && slotStart < eventEnd) ||
                                (slotEnd > eventStart && slotEnd <= eventEnd) ||
                                (slotStart <= eventStart && slotEnd >= eventEnd)
                            ) {
                                isBlocked = true;
                                break;
                            }
                        }
                    }

                    if (isBefore(selectedDate, startOfDay(new Date())) && isBefore(slotStart, new Date())) {
                        isBlocked = true;
                    }

                    slots.push({ time, available: !isBlocked });
                }
            }

            setTimeSlots(slots);

        } catch (error) {
            console.error("Error generating slots:", error);
            toast({ title: "Erro ao gerar horários", variant: "destructive" });
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleBookingSubmit = async () => {
        if (!clientName || !clientPhone) {
            toast({ title: "Preencha seus dados", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (!profile || !selectedService || !selectedDate || !selectedTime) throw new Error("Missing data");

            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            let clientId = null;

            try {
                const tags: string[] = [];
                if (refParam) tags.push(`ref:${refParam}`);
                tags.push('origem:agendamento_online');

                const { data: newClient, error: clientError } = await supabase
                    .from('wedding_clients')
                    .insert({
                        full_name: clientName,
                        name: clientName,
                        phone: clientPhone,
                        user_id: profile.id,
                        tags: tags,
                        origin: 'site_booking'
                    })
                    .select()
                    .single();

                if (!clientError && newClient) {
                    clientId = newClient.id;
                }
            } catch (err) {
                // Ignore client creation error
            }

            const description = `Agendamento Online\nCliente: ${clientName}\nWhatsApp: ${clientPhone}\nServiço: ${selectedService.name}`;

            const { error } = await supabase
                .from('events')
                .insert({
                    user_id: profile.id,
                    title: `${clientName} - ${selectedService.name}`,
                    description: description,
                    event_date: dateStr,
                    start_time: selectedTime,
                    duration_minutes: selectedService.duration_minutes,
                    is_active: true,
                    total_value: selectedService.price,
                    client_id: clientId
                });

            if (error) throw error;

            setStep(4);

        } catch (error) {
            console.error("Booking error:", error);
            toast({ title: "Erro ao realizar agendamento", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return {
        profile,
        services,
        loading,
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
        handleBookingSubmit
    };
};
