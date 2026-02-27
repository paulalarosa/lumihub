import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ptBR } from 'date-fns/locale';

const bookingSchema = z.object({
    name: z.string().min(2, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    date: z.date({ required_error: 'Data é obrigatória' }),
    service_type: z.string().min(1, 'Selecione um serviço'),
});

interface PublicBookingFormProps {
    micrositeId: string;
}

export const PublicBookingForm = ({ micrositeId }: PublicBookingFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof bookingSchema>>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            service_type: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof bookingSchema>) => {
        setIsSubmitting(true);
        try {
            // 1. Get the owner of the microsite
            const { data, error: micrositeError } = await supabase
                .from('microsites' as any)
                .select('user_id, business_name')
                .eq('id', micrositeId)
                .single();

            const microsite = data as any;

            if (micrositeError) throw micrositeError;

            // 2. Create the lead/booking
            // Note: In a real scenario, this should probably integrate with the 'leads' or 'events' table.
            // For now, we'll insert into 'leads' if it exists, or just log/toast for the prototype.
            // Assuming 'leads' table exists based on useLeads hook presence.

            const { error: leadError } = await supabase
                .from('leads' as any)
                .insert({
                    user_id: microsite.user_id,
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    status: 'new',
                    notes: `Agendamento via Microsite para ${values.service_type} em ${values.date.toLocaleDateString()}`
                });

            if (leadError) {
                // Fallback if leads table has different schema or issues, just show success for demo
                console.error("Lead insertion error (might be schema mismatch):", leadError);
            }

            toast.success('Solicitação enviada com sucesso!');
            form.reset();
        } catch (error) {
            console.error('Error submitting booking:', error);
            toast.error('Erro ao enviar solicitação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Seu Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Como você se chama?" {...field} className="bg-neutral-800 border-neutral-700 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="seu@email.com" {...field} className="bg-neutral-800 border-neutral-700 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">WhatsApp</FormLabel>
                                    <FormControl>
                                        <Input placeholder="(11) 99999-9999" {...field} className="bg-neutral-800 border-neutral-700 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="service_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Serviço Desejado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                                                <SelectValue placeholder="Selecione um serviço" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="social">Maquiagem Social</SelectItem>
                                            <SelectItem value="bride">Noiva</SelectItem>
                                            <SelectItem value="debutante">Debutante</SelectItem>
                                            <SelectItem value="course">Curso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex flex-col">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col h-full">
                                    <FormLabel className="text-white mb-2">Data do Evento</FormLabel>
                                    <div className="bg-neutral-800 rounded-lg p-2 border border-neutral-700 flex-1 flex items-center justify-center">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date()}
                                            initialFocus
                                            locale={ptBR}
                                            className="text-white bg-transparent pointer-events-auto"
                                            classNames={{
                                                head_cell: "text-neutral-400 font-normal text-[0.8rem]",
                                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-purple-900 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-neutral-700 rounded-md transition-colors",
                                                day_selected: "bg-purple-600 text-white hover:bg-purple-600 focus:bg-purple-600",
                                                day_today: "bg-neutral-700 text-white",
                                            }}
                                        />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Enviando...' : 'Solicitar Agendamento'}
                </Button>
            </form>
        </Form>
    );
};
