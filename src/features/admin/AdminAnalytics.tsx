import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Download, BarChart3, PieChart as PieIcon, Activity, Eye } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAdminAnalytics } from './hooks/useAdminAnalytics';

const COLORS = ['#ffffff', '#a1a1aa', '#52525b', '#27272a', '#18181b'];

export default function AdminAnalytics() {
    const { charts, loading, stats, categoryData, pageData, handleExportExcel, isPositive } = useAdminAnalytics();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif text-white">Analytics & Growth</h2>
                    <p className="text-white/50 text-sm font-mono uppercase tracking-widest mt-1">Performance Intelligence</p>
                </div>
                <Button onClick={handleExportExcel} variant="outline" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest">
                    <Download className="w-4 h-4 mr-2" />Exportar
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 bg-white/5 rounded-none" />)}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Faturamento Mensal', value: `R$ ${stats.monthly_revenue.toLocaleString('pt-BR')}`, growth: stats.growth_revenue_percentage, icon: BarChart3 },
                            { label: 'Total Clientes', value: stats.total_clients, growth: stats.growth_client_percentage, icon: PieIcon },
                            { label: 'Novos Leads (Mês)', value: stats.new_clients_month, growth: null, icon: Activity },
                            { label: 'Taxa de Conversão', value: `${stats.conversionRate.toFixed(1)}%`, growth: null, icon: Eye }
                        ].map((metric, i) => (
                            <Card key={i} className="bg-black border border-white/10 rounded-none hover:border-white/30 transition-colors">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <metric.icon className="w-4 h-4 text-white/40" />
                                        {metric.growth !== null && (
                                            <span className={`text-xs font-mono flex items-center gap-1 ${isPositive(metric.growth) ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPositive(metric.growth) ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {Math.abs(metric.growth).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-mono text-white">{metric.value}</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{metric.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-black border border-white/10 rounded-none">
                            <CardHeader><CardTitle className="text-white font-mono text-sm uppercase tracking-widest">Receita Mensal</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={charts.revenue}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                                            <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} />
                                            <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: 12 }} />
                                            <Area type="monotone" dataKey="value" stroke="#fff" fill="rgba(255,255,255,0.1)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black border border-white/10 rounded-none">
                            <CardHeader><CardTitle className="text-white font-mono text-sm uppercase tracking-widest">Origem dos Clientes</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={charts.clients} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                                                {charts.clients.map((_e, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black border border-white/10 rounded-none">
                            <CardHeader><CardTitle className="text-white font-mono text-sm uppercase tracking-widest">Eventos por Categoria</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                                            <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} />
                                            <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: 12 }} />
                                            <Bar dataKey="value" fill="#fff" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black border border-white/10 rounded-none">
                            <CardHeader><CardTitle className="text-white font-mono text-sm uppercase tracking-widest">Páginas Mais Visitadas</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={pageData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                                            <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 10 }} />
                                            <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: 12 }} />
                                            <Line type="monotone" dataKey="value" stroke="#a1a1aa" strokeWidth={2} dot={{ fill: '#fff' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
