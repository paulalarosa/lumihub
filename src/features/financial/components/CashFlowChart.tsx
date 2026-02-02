
import { Card, CardContent } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface CashFlowChartProps {
    data: any[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
    return (
        <Card className="bg-black border border-white/20 rounded-none">
            <CardContent className="p-6">
                <h3 className="text-lg text-white mb-6 font-mono uppercase tracking-widest">FLUXO DE CAIXA (6 MESES)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} stroke="#fff" />
                            <XAxis
                                dataKey="month"
                                stroke="#666"
                                tick={{ fill: '#666', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#666"
                                tick={{ fill: '#666', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `K${(value / 1000).toFixed(0)}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #fff', borderRadius: '0px', color: '#fff', fontFamily: 'JetBrains Mono' }}
                                cursor={{ fill: '#ffffff10' }}
                            />
                            <Bar dataKey="income" name="RECEITA" fill="#ffffff" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="expense" name="DESPESA" fill="#333333" radius={[0, 0, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
