
import { Card, CardContent } from '@/components/ui/card';

interface ProjectStatsProps {
    completedTasks: number;
    totalTasks: number;
    totalServiceAmount: number;
    totalReceived: number;
    remainingAmount: number;
    t: (key: string) => string;
}

export const ProjectStats = ({
    completedTasks,
    totalTasks,
    totalServiceAmount,
    totalReceived,
    remainingAmount,
    t
}: ProjectStatsProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-black border border-white/20 rounded-none">
                <CardContent className="pt-6">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">{t('dashboard.tasks')}</p>
                    <p className="text-2xl font-serif text-white">{completedTasks}/{totalTasks}</p>
                </CardContent>
            </Card>
            <Card className="bg-black border border-white/20 rounded-none">
                <CardContent className="pt-6">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">{t('dashboard.total_value')}</p>
                    <p className="text-2xl font-serif text-white">{Number(totalServiceAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </CardContent>
            </Card>
            <Card className="bg-black border border-white/20 rounded-none">
                <CardContent className="pt-6">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">{t('dashboard.received')}</p>
                    <p className="text-2xl font-serif text-white">{Number(totalReceived || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </CardContent>
            </Card>
            <Card className="bg-black border border-white/20 rounded-none">
                <CardContent className="pt-6">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-1">{t('dashboard.pending')}</p>
                    <p className="text-2xl font-serif text-white/70 border-b border-white/20 inline-block">{Number(remainingAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </CardContent>
            </Card>
        </div>
    );
};
