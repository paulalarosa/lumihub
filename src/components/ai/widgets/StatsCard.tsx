import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface StatsCardProps {
    data: {
        revenue: number;
        events: number;
        clients?: number;
    };
}

export const StatsCard = ({ data }: StatsCardProps) => {
    return (
        <div className="bg-zinc-950/50 border border-white/10 rounded-none p-4 space-y-3 backdrop-blur-sm">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold">Metrics Stream</h4>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[8px] font-mono uppercase text-zinc-500">Revenue</p>
                        <p className="text-sm font-bold text-white font-mono">
                            R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[8px] font-mono uppercase text-zinc-500">Operations</p>
                        <p className="text-sm font-bold text-white font-mono">{data.events}</p>
                    </div>
                </div>

                {data.clients && (
                    <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-white/5">
                        <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[8px] font-mono uppercase text-zinc-500">Active Ecosystem</p>
                            <p className="text-sm font-bold text-white font-mono">{data.clients} Leads/Clients</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
