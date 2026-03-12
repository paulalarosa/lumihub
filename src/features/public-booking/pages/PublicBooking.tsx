import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ActionButton } from '@/components/ui/action-buttons'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, toZonedTime } from '@/lib/date-utils'
// format and ptBR removed
import {
  Loader2,
  MapPin,
  Clock,
  ChevronRight,
  CheckCircle2,
  Calendar as CalendarIcon,
  User,
  MessageCircle,
  AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePublicBooking } from '@/features/public-booking/hooks/usePublicBooking'

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useState(new URLSearchParams(window.location.search))
  const refParam = searchParams.get('ref')

  const {
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
    handleBookingSubmit,
  } = usePublicBooking(slug, refParam)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00e5ff]" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-4">
        <AlertCircle className="h-12 w-12 text-gray-500 mb-4" />
        <h1 className="text-2xl font-serif">Perfil não encontrado</h1>
        <p className="text-gray-400 mt-2">
          O link pode estar incorreto ou expirado.
        </p>
      </div>
    )
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
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                  <span className="text-2xl font-serif">{profile.name[0]}</span>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-serif text-white mb-2">
            {profile.name}
          </h1>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            {profile.bio || 'Especialista em realçar sua beleza natural.'}
          </p>

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
                <h2 className="text-lg font-medium text-white">
                  Escolha um serviço
                </h2>
                <span className="text-xs text-[#00e5ff] font-medium bg-[#00e5ff]/10 px-2 py-0.5 rounded-full">
                  Passo 1/3
                </span>
              </div>

              <div className="grid gap-3">
                {services.length === 0 ? (
                  <Card className="bg-[#1A1A1A]/90 backdrop-blur border-white/10 p-6 text-center">
                    <p className="text-gray-400">
                      Nenhum serviço disponível no momento.
                    </p>
                  </Card>
                ) : (
                  services.map((service) => (
                    <Card
                      key={service.id}
                      className="bg-[#1A1A1A]/90 backdrop-blur border-white/10 hover:border-[#00e5ff]/50 transition-all cursor-pointer group active:scale-[0.98]"
                      onClick={() => {
                        setSelectedService(service)
                        setStep(2)
                      }}
                    >
                      <div className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-medium group-hover:text-[#00e5ff] transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{' '}
                              {service.duration_minutes} min
                            </span>
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
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  Cancel
                </button>
                <span className="text-xs text-[#00e5ff] font-medium bg-[#00e5ff]/10 px-2 py-0.5 rounded-full">
                  Passo 2/3
                </span>
              </div>

              <div className="bg-[#1A1A1A]/90 backdrop-blur rounded-2xl border border-white/10 p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={{ before: toZonedTime(new Date()) }}
                  className="bg-transparent text-white w-full flex justify-center pointer-events-auto"
                  classNames={{
                    head_cell: 'text-gray-500 font-normal text-[0.8rem]',
                    cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#00e5ff]/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md text-gray-300',
                    day_selected:
                      'bg-[#00e5ff] text-black hover:bg-[#00e5ff] hover:text-black focus:bg-[#00e5ff] focus:text-black',
                    day_today: 'bg-white/5 text-white',
                  }}
                />
              </div>

              {selectedDate && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-white font-medium px-2">
                    Horários Disponíveis
                  </h3>
                  {loadingSlots ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-[#00e5ff]" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map(({ time, available }) => (
                        <button
                          key={time}
                          disabled={!available}
                          onClick={() => setSelectedTime(time)}
                          className={`
                                                 py-2 px-1 rounded-lg text-sm font-medium transition-all
                                                 ${
                                                   !available
                                                     ? 'opacity-30 cursor-not-allowed bg-white/5 text-gray-500 line-through'
                                                     : selectedTime === time
                                                       ? 'bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                                                       : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
                                                 }
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
                <ActionButton
                  fullWidth
                  className="h-12 rounded-xl mt-4"
                  onClick={() => setStep(3)}
                >
                  Continuar
                </ActionButton>
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
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  Voltar
                </button>
                <span className="text-xs text-[#00e5ff] font-medium bg-[#00e5ff]/10 px-2 py-0.5 rounded-full">
                  Passo 3/3
                </span>
              </div>

              <Card className="bg-[#1A1A1A]/90 backdrop-blur border-white/10 p-6 space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-white/10">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-[#00e5ff]" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {selectedService?.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {selectedDate && formatDate(selectedDate, "d 'de' MMMM")}{' '}
                      • {selectedTime}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">
                      Seu Nome
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="name"
                        placeholder="Digite seu nome completo"
                        className="pl-10 bg-black/40 border-white/10 text-white h-11"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">
                      Seu WhatsApp
                    </Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="phone"
                        placeholder="(00) 00000-0000"
                        className="pl-10 bg-black/40 border-white/10 text-white h-11"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <ActionButton
                  fullWidth
                  className="h-12 rounded-xl mt-2"
                  onClick={handleBookingSubmit}
                  loading={submitting}
                >
                  Confirmar Agendamento
                </ActionButton>
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
                <h2 className="text-2xl font-serif text-white">
                  Agendamento Realizado!
                </h2>
                <p className="text-gray-400 max-w-xs mx-auto">
                  Seu horário foi reservado com sucesso.
                </p>
              </div>

              <Card className="bg-[#1A1A1A]/90 backdrop-blur border-white/10 p-6 max-w-xs mx-auto text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Serviço</span>
                  <span className="text-white font-medium text-right">
                    {selectedService?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Data</span>
                  <span className="text-white font-medium text-right">
                    {selectedDate && formatDate(selectedDate, "d 'de' MMMM")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Horário</span>
                  <span className="text-white font-medium text-right">
                    {selectedTime}
                  </span>
                </div>
              </Card>

              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-4">
                  Você receberá uma confirmação em breve.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
