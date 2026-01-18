import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, isBefore, startOfDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Loader2,
    MapPin,
    Clock,
    ChevronRight,
    CheckCircle2,
    Calendar as CalendarIcon,
    User,
    Sparkles,
    MessageCircle,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Profile {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    slug: string;
    business_address: string | null;
    full_name: string | null;
}

interface Service {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration_minutes: number;
}

interface TimeSlot {
    time: string;
    available: boolean;
}

export default function PublicBooking() {
    const { slug } = useParams<{ slug: string }>();
    const { toast } = useToast();
    const [searchParams] = useState(new URLSearchParams(window.location.search));
    const refParam = searchParams.get('ref');

    // State
    const [profile, setProfile] = useState<Profile | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking State
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Service, 2: Date/Time, 3: Info, 4: Success
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

    // Initial Fetch - Runs once when slug changes
    useEffect(() => {
        if (slug) {
            fetchProfileAndServices();
        }
    }, [slug]);

    const fetchProfileAndServices = async () => {
        try {
            setLoading(true);
            // 1. Fetch Profile by Slug
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, bio')
                .eq('id', slug)
                .maybeSingle();

            if (profileError || !profileData) {
                throw new Error("Perfil não encontrado");
            }

            setProfile({
                id: profileData.id,
                name: profileData.full_name || 'Profissional',
                full_name: profileData.full_name,
                avatar_url: profileData.avatar_url,
                bio: profileData.bio,
                slug: slug || '',
                business_address: null
            });

            // 2. Fetch Services for this profile
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('id, name, description, price, duration_minutes')
                .eq('user_id', profileData.id);

            if (servicesError) throw servicesError;

            // Map to expected Service type
            setServices((servicesData || []).map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                price: s.price || 0,
                duration_minutes: s.duration_minutes || 60
            })));

        } catch (error) {
            console.error("Error fetching public profile:", error);
            toast({ title: "Perfil não encontrado", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Generate Time Slots when Date changes
    useEffect(() => {
        if (selectedDate && profile && selectedService) {
            generateTimeSlots();
        }
    }, [selectedDate, profile, selectedService]);

    const generateTimeSlots = async () => {
        if (!selectedDate || !profile || !selectedService) return;

        setLoadingSlots(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            // Fetch busy slots using Secure RPC
            const { data: eventsData, error } = await supabase
                .rpc('get_day_availability' as any, {
                    target_slug: slug,
                    query_date: dateStr
                });

            const events = eventsData as any[] || [];

            if (error) throw error;

            // Define working hours (Mock: 09:00 to 18:00) - In real app, fetch from settings
            const startHour = 9;
            const endHour = 18;
            const serviceDuration = selectedService.duration_minutes;
            const slots: TimeSlot[] = [];

            for (let hour = startHour; hour < endHour; hour++) {
                for (let min = 0; min < 60; min += 30) { // 30 min intervals
                    const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

                    // Check collision
                    const slotStart = parse(time, 'HH:mm', new Date());
                    const slotEnd = addMinutes(slotStart, serviceDuration);

                    let isBlocked = false;

                    // Check against existing events
                    if (events) {
                        for (const event of events) {
                            const eventStart = parse(event.start_time, 'HH:mm', new Date());
                            // Handle event end time properly
                            let eventEnd;
                            if (event.end_time) {
                                eventEnd = parse(event.end_time, 'HH:mm', new Date());
                            } else {
                                eventEnd = addMinutes(eventStart, event.duration_minutes || 60);
                            }

                            // Simple collision detection
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

                    // Check if it's in the past (today)
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

            // 1. Try to find or create client to track the lead source
            try {
                // Determine tags
                const tags: string[] = [];
                if (refParam) tags.push(`ref:${refParam}`);
                tags.push('origem:agendamento_online');

                // Try to find existing client by phone (if RLS allows select, often it doesn't for public)
                // Assuming we might fail here, so we wrap in try/catch.
                // NOTE: In a real secure app, this should be an RPC 'create_booking_and_client'.
                // Proceeding with best-effort client creation.

                // We will try to insert. If conflict (phone unique key?), we ideally update. 
                // But typically client phone is not unique in many simple schemas, OR RLS blocks access.
                // Let's attempt to insert a new client.
                const { data: newClient, error: clientError } = await supabase
                    .from('wedding_clients')
                    .insert({
                        name: clientName,
                        phone: clientPhone,
                        user_id: profile.id, // Assign to the professional
                        tags: tags,
                        last_contacted_at: new Date().toISOString(),
                        origin: 'site_booking'
                    })
                    .select()
                    .single();

                if (!clientError && newClient) {
                    clientId = newClient.id;
                } else {
                    // console.log('Could not create client record (likely perms):', clientError);
                }
            } catch (err) {
                // console.log('Client creation skipped:', err);
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
                    total_value: selectedService.price, // Populate new column
                    client_id: clientId // If we managed to create/find it
                });

            if (error) throw error;

            setStep(4); // Success

        } catch (error) {
            console.error("Booking error:", error);
            toast({ title: "Erro ao realizar agendamento", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <Loader2 className="h-8 w-8 animate-spin text-[#00e5ff]" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-4">
                <AlertCircle className="h-12 w-12 text-gray-500 mb-4" />
                <h1 className="text-2xl font-serif">Perfil não encontrado</h1>
                <p className="text-gray-400 mt-2">O link pode estar incorreto ou expirado.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-[#C0C0C0] pb-24 font-sans selection:bg-[#00e5ff]/30 selection:text-[#00e5ff]">

            {/* 1. Header Profile */}
            <div className="relative bg-[#111] pb-12 pt-8 px-6 rounded-b-[40px] border-b border-white/5 shadow-2xl overflow-hidden">
                {/* Ambient Bg */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00e5ff]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-[#00e5ff] to-transparent mb-4 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-black border-4 border-black">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                                    <span className="text-2xl font-serif">{profile.name[0]}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <h1 className="text-2xl font-serif text-white mb-2">{profile.name}</h1>
                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{profile.bio || "Especialista em realçar sua beleza natural."}</p>

                    {profile.business_address && (
                        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
                            <MapPin className="h-3 w-3" />
                            {profile.business_address}
                        </div>
                    )}
                </div>
            </div>

            <div className="container max-w-md mx-auto px-4 -mt-6 relative z-20 space-y-6">

                <AnimatePresence mode="wait">
                    {/* STEP 1: SELECT SERVICE */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-lg font-medium text-white">Escolha um serviço</h2>
                                <span className="text-xs text-[#00e5ff] font-medium bg-[#00e5ff]/10 px-2 py-0.5 rounded-full">Passo 1/3</span>
                            </div>

                            <div className="grid gap-3">
                                {services.length === 0 ? (
                                    <Card className="bg-[#1A1A1A]/90 backdrop-blur border-white/10 p-6 text-center">
                                        <p className="text-gray-400">Nenhum serviço disponível no momento.</p>
                                    </Card>
                                ) : (
                                    services.map(service => (
                                        <Card
                                            key={service.id}
                                            className="bg-[#1A1A1A]/90 backdrop-blur border-white/10 hover:border-[#00e5ff]/50 transition-all cursor-pointer group active:scale-[0.98]"
                                            onClick={() => {
                                                setSelectedService(service);
                                                setStep(2);
                                            }}
                                        >
                                            <div className="p-4 flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-white font-medium group-hover:text-[#00e5ff] transition-colors">{service.name}</h3>
                                                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-3">
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {service.duration_minutes} min</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                        <span>R$ {service.price.toFixed(2)}</span>
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-[#00e5ff]" />
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: SELECT DATE & TIME */}
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between px-2">
                                <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                                    Cancel
                                </button>
                                <span className="text-xs text-[#00e5ff] font-medium bg-[#00e5ff]/10 px-2 py-0.5 rounded-full">Passo 2/3</span>
                            </div>

                            <div className="bg-[#1A1A1A]/90 backdrop-blur rounded-2xl border border-white/10 p-4">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    locale={ptBR}
                                    disabled={{ before: new Date() }}
                                    className="bg-transparent text-white w-full flex justify-center pointer-events-auto"
                                    classNames={{
                                        head_cell: "text-gray-500 font-normal text-[0.8rem]",
                                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#00e5ff]/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md text-gray-300",
                                        day_selected: "bg-[#00e5ff] text-black hover:bg-[#00e5ff] hover:text-black focus:bg-[#00e5ff] focus:text-black",
                                        day_today: "bg-white/5 text-white",
                                    }}
                                />
                            </div>

                            {selectedDate && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                                    <h3 className="text-white font-medium px-2">Horários Disponíveis</h3>
                                    {loadingSlots ? (
                                        <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-[#00e5ff]" /></div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2">
                                            {timeSlots.map(({ time, available }) => (
                                                <button
                                                    key={time}
                                                    disabled={!available}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`
                                                 py-2 px-1 rounded-lg text-sm font-medium transition-all
                                                 ${!available ? 'opacity-30 cursor-not-allowed bg-white/5 text-gray-500 line-through' :
                                                            selectedTime === time ? 'bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]' :
                                                                'bg-white/5 text-white hover:bg-white/10 border border-white/5'}
                                             `}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedTime && (
                                <Button
                                    className="w-full bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-semibold h-12 rounded-xl mt-4"
                                    onClick={() => setStep(3)}
                                >
                                    Continuar
                                </Button>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 3: INFO */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between px-2">
                                <button onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                                    Voltar
                                </button>
                                <span className="text-xs text-[#00e5ff] font-medium bg-[#00e5ff]/10 px-2 py-0.5 rounded-full">Passo 3/3</span>
                            </div>

                            <Card className="bg-[#1A1A1A]/90 backdrop-blur border-white/10 p-6 space-y-4">
                                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <CalendarIcon className="h-5 w-5 text-[#00e5ff]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{selectedService?.name}</h3>
                                        <p className="text-sm text-gray-400">
                                            {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: ptBR })} • {selectedTime}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-gray-300">Seu Nome</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="name"
                                                placeholder="Digite seu nome completo"
                                                className="pl-10 bg-black/40 border-white/10 text-white h-11"
                                                value={clientName}
                                                onChange={e => setClientName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-gray-300">Seu WhatsApp</Label>
                                        <div className="relative">
                                            <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="phone"
                                                placeholder="(00) 00000-0000"
                                                className="pl-10 bg-black/40 border-white/10 text-white h-11"
                                                value={clientPhone}
                                                onChange={e => setClientPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-[#00e5ff] hover:bg-[#00e5ff]/80 text-black font-semibold h-12 rounded-xl mt-2"
                                    onClick={handleBookingSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Agendamento"}
                                </Button>
                            </Card>
                        </motion.div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-10 space-y-6"
                        >
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-serif text-white">Agendamento Realizado!</h2>
                                <p className="text-gray-400 max-w-xs mx-auto">
                                    Seu horário foi reservado com sucesso.
                                </p>
                            </div>

                            <Card className="bg-[#1A1A1A]/90 backdrop-blur border-white/10 p-6 max-w-xs mx-auto text-left space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Serviço</span>
                                    <span className="text-white font-medium text-right">{selectedService?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Data</span>
                                    <span className="text-white font-medium text-right">
                                        {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Horário</span>
                                    <span className="text-white font-medium text-right">{selectedTime}</span>
                                </div>
                            </Card>

                            {/* Optional: WhatsApp Button to notify the professional manually if needed, or just close */}
                            <div className="pt-4">
                                <p className="text-sm text-gray-500 mb-4">Você receberá uma confirmação em breve.</p>

                                {/* If we had the PRO's phone number here, we could add a "Talk to Pro" button */}
                            </div>

                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
