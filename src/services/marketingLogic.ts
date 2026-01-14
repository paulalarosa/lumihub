
import { supabase } from "@/integrations/supabase/client";
import { addDays, subMonths, subYears, format, getDay, getMonth } from "date-fns";

export interface MarketingTrigger {
    type: 'birthday' | 'reengagement' | 'anniversary';
    clientName: string;
    clientId: string;
    details: string; // "Aniversário em 2 dias", "Ausente há 7 meses", "1 ano de Casamento"
    date?: string;
}

export class MarketingLogic {

    static async getTriggers(organizationId: string): Promise<MarketingTrigger[]> {
        const triggers: MarketingTrigger[] = [];

        try {
            const today = new Date();
            const sevenDaysFromNow = addDays(today, 7);

            // 1. Birthdays (Next 7 days)
            // Supabase doesn't have easy "month/day" extraction in postgrest-js without SQL functions usually.
            // fetching all clients with birth_date is inefficient but ok for small scale. 
            // Better: use a rpc call or filter in memory if list is small (<1000). 
            // Assuming small scale for now.
            const { data: clients } = await supabase
                .from('clients')
                .select('id, name, birth_date')
                .eq('user_id', organizationId)
                .not('birth_date', 'is', null);

            if (clients) {
                clients.forEach(c => {
                    const bdate = new Date(c.birth_date);
                    // Match MM-DD ignoring year
                    const bMonth = bdate.getUTCMonth();
                    const bDay = bdate.getUTCDate();

                    const checkDate = new Date(today);
                    // Check next 7 days
                    for (let i = 0; i < 7; i++) {
                        const current = addDays(today, i);
                        if (current.getMonth() === bMonth && current.getDate() === bDay) {
                            triggers.push({
                                type: 'birthday',
                                clientId: c.id,
                                clientName: c.name,
                                details: i === 0 ? "Hoje!" : `Em ${i} dias (${format(current, 'dd/MM')})`,
                                date: c.birth_date
                            });
                            break;
                        }
                    }
                });
            }

            // 2. Re-engagement (> 6 months since last event)
            const sixMonthsAgo = subMonths(today, 6);
            // We need clients whose LATEST event is before sixMonthsAgo.
            // Complex query. Simplified: Get distinct client_ids from events recenter than 6 months.
            // Then find clients NOT in that list but who HAVE events older than that.
            // For MVP: Fetch all clients, check their last event. (Heavy?)
            // Alternative: Just fetch events > 6 months? 
            // Let's rely on a simpler approach: Query Clients who have NO events > 6 months ago?
            // Actually, "Ausente há mais de 6 meses" means they WERE active before.
            // Let's fetch clients and their last event date? 
            // Supabase: .select('*, events(event_date)') ... sorting...
            // Let's just fetch clients with their ONE most recent event.
            const { data: clientsWithEvents } = await supabase
                .from('clients')
                .select('id, name, events(event_date)')
                .eq('user_id', organizationId);

            if (clientsWithEvents) {
                clientsWithEvents.forEach(c => {
                    if (c.events && c.events.length > 0) {
                        // Sort to find last
                        const dates = c.events.map((e: any) => new Date(e.event_date).getTime());
                        const lastDate = new Date(Math.max(...dates));

                        if (lastDate < sixMonthsAgo) {
                            triggers.push({
                                type: 'reengagement',
                                clientId: c.id,
                                clientName: c.name,
                                details: `Última visita: ${format(lastDate, 'dd/MM/yyyy')}`
                            });
                        }
                    }
                });
            }

            // 3. Anniversaries (1 Year since 'noivas' or 'pre_wedding')
            // Query events exactly 1 year ago (+- window of few days?)
            // Prompt says: "List clients... to send a 1-year anniversary message".
            // Let's look for events between 1 year ago - 7 days and 1 year ago + 7 days? Or just upcoming?
            // "Sazonal: List clients... to send a '1-year anniversary' message". Implies upcoming anniversary?
            const oneYearAgoStart = subYears(today, 1);
            const oneYearAgoEnd = addDays(oneYearAgoStart, 7); // Window

            const { data: anniversaryEvents } = await supabase
                .from('events')
                .select('id, title, event_type, client(id, name)')
                .eq('user_id', organizationId)
                .gte('event_date', format(oneYearAgoStart, 'yyyy-MM-dd'))
                .lte('event_date', format(oneYearAgoEnd, 'yyyy-MM-dd'))
                .in('event_type', ['noivas', 'pre_wedding']);

            if (anniversaryEvents) {
                anniversaryEvents.forEach(e => {
                    if (e.client) {
                        triggers.push({
                            type: 'anniversary',
                            clientId: e.client.id, // @ts-ignore
                            clientName: e.client.name,
                            details: `1 Ano de "${e.title}"`
                        });
                    }
                });
            }

        } catch (error) {
            console.error("Marketing triggers error:", error);
        }

        return triggers;
    }
}
