import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

export interface NotificationItem {
    id: string;
    type: 'event' | 'payment' | 'commission';
    title: string;
    description: string;
    date?: string;
    read: boolean;
    link?: string;
}

export const useNotifications = (userId: string | undefined) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            setLoading(true);
            const newNotifications: NotificationItem[] = [];

            try {
                // 1. Upcoming Events (Next 7 days)
                const today = new Date();
                const nextWeek = addDays(today, 7);

                const { data: upcomingEvents } = await supabase
                    .from('events')
                    .select('id, title, event_date, event_type')
                    .gte('event_date', today.toISOString())
                    .lte('event_date', nextWeek.toISOString())
                    .order('event_date', { ascending: true });

                if (upcomingEvents) {
                    upcomingEvents.forEach(event => {
                        newNotifications.push({
                            id: `evt-${event.id}`,
                            type: 'event',
                            title: 'Evento Próximo',
                            description: `${event.title} - ${new Date(event.event_date).toLocaleDateString('pt-BR')}`,
                            date: event.event_date,
                            read: false,
                            link: '/agenda'
                        });
                    });
                }

                // 2. Pending Payments (Invoices)
                const { data: pendingInvoices } = await supabase
                    .from('invoices')
                    .select(`
            id, amount, due_date, status,
            projects (
              id,
              name,
              clients (name)
            )
          `)
                    .eq('status', 'pending');

                if (pendingInvoices) {
                    pendingInvoices.forEach((inv: any) => {
                        const clientName = inv.projects?.clients?.name || 'Cliente';
                        newNotifications.push({
                            id: `pay-${inv.id}`,
                            type: 'payment',
                            title: 'Pagamento Pendente',
                            description: `${clientName} - R$ ${inv.amount}`,
                            date: inv.due_date,
                            read: false,
                            link: '/financeiro'
                        });
                    });
                }

                // 3. Unpaid Commissions (Events with commission > 0 in current month)
                // Since we don't have a specific "paid" status for commissions, we'll just show recent ones
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
                const { data: commissionEvents } = await supabase
                    .from('events')
                    .select('id, title, assistant_commission, event_date')
                    .gt('assistant_commission', 0)
                    .gte('event_date', startOfMonth);

                if (commissionEvents) {
                    commissionEvents.forEach(evt => {
                        newNotifications.push({
                            id: `com-${evt.id}`,
                            type: 'commission',
                            title: 'Comissão de Equipe',
                            description: `Confirmar pgto: ${evt.title} (R$ ${evt.assistant_commission})`,
                            date: evt.event_date,
                            read: false, // In reality, check local storage
                            link: '/admin/financials'
                        });
                    });
                }

                // Filter out read notifications from LocalStorage
                const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                const filtered = newNotifications.filter(n => !readIds.includes(n.id));

                setNotifications(filtered);
                setUnreadCount(filtered.length);

            } catch (error) {
                console.error("Error fetching notifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [userId]);

    const markAsRead = (id: string) => {
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        if (!readIds.includes(id)) {
            const newReadIds = [...readIds, id];
            localStorage.setItem('read_notifications', JSON.stringify(newReadIds));

            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => prev - 1);
        }
    };

    return { notifications, loading, unreadCount, markAsRead };
};
