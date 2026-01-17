import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, MousePointer, Clock, TrendingUp, Eye, RefreshCw, Users, DollarSign, TrendingDown, Download, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#00e5ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'];

export default function AdminAnalytics() {
    const [events, setEvents] = useState<any[]>([]);
    const [charts, setCharts] = useState({ revenue: [], clients: [] });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalRevenue: 0,
        newLeads: 0,
        conversionRate: 0
    });

    const { fetchDashboardStats } = useAnalytics();

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        const data = await fetchDashboardStats();

        if (data) {
            setEvents(data.events);
            setStats(data.stats);
            setCharts(data.charts || { revenue: [], clients: [] });
        }
        setLoading(false);
    };

    // Process data for charts
    const eventsByCategory = events.reduce((acc: any, e) => {
        const cat = e.category || e.type || 'other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const categoryData = Object.entries(eventsByCategory).map(([name, value]) => ({ name, value }));

    const pageViewData = events
        .filter(e => e.type === 'page_view')
        .reduce((acc: any, e) => {
            const path = e.page_path || '/';
            acc[path] = (acc[path] || 0) + 1;
            return acc;
        }, {});

    const pageData = Object.entries(pageViewData)
        .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }))
        .slice(0, 10);

    const handleExportExcel = () => {
        if (!stats?.charts?.revenue) return;
        // Transform data for Excel
        const dataToExport = stats.charts.revenue.map(item => ({
            Mês: item.name,
            Receita: item.value
        }));
        exportFinancialExcel(dataToExport, "Relatorio_Financeiro_Lumi");
    };

    const isPositive = (value: number) => value > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">Analytics</h2>
                    <p className="text-white/40">Visão geral do desempenho do sistema</p>
                </div>
                {/* Global Date Range Picker could go here */}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Clients */}
                <Card className="bg-black border border-white/20 p-6 rounded-none hover:bg-white hover:text-black hover:border-white transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/10 rounded-none border border-white/10 group-hover:bg-black group-hover:border-black">
                            <Users className="h-6 w-6 text-white group-hover:text-white" />
                        </div>
                        {isPositive(stats?.growth_client_percentage) ? (
                            <div className="flex items-center text-white text-xs font-mono uppercase tracking-widet border border-white/20 px-2 py-1 bg-white/5 group-hover:bg-black group-hover:text-white group-hover:border-black">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {stats?.growth_client_percentage}%
                            </div>
                        ) : (
                            <div className="flex items-center text-white/70 text-xs font-mono uppercase tracking-widest border border-white/20 px-2 py-1 bg-white/5 group-hover:bg-black group-hover:text-white group-hover:border-black">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {Math.abs(stats?.growth_client_percentage || 0)}%
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.2em] group-hover:text-black/60">Total Clientes</p>
                    <h3 className="text-3xl font-bold text-white mt-1 font-serif group-hover:text-black">{stats?.total_clients}</h3>
                    <p className="text-gray-500 text-xs mt-2 font-mono group-hover:text-black/60">Novos este mês: {stats?.new_clients_month}</p>
                </Card>

                {/* Monthly Revenue */}
                <Card className="bg-black border border-white/20 p-6 rounded-none hover:bg-white hover:text-black hover:border-white transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/10 rounded-none border border-white/10 group-hover:bg-black group-hover:border-black">
                            <DollarSign className="h-6 w-6 text-white group-hover:text-white" />
                        </div>
                        {isPositive(stats?.growth_revenue_percentage) ? (
                            <div className="flex items-center text-white text-xs font-mono uppercase tracking-widest border border-white/20 px-2 py-1 bg-white/5 group-hover:bg-black group-hover:text-white group-hover:border-black">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {stats?.growth_revenue_percentage}%
                            </div>
                        ) : (
                            <div className="flex items-center text-white/70 text-xs font-mono uppercase tracking-widest border border-white/20 px-2 py-1 bg-white/5 group-hover:bg-black group-hover:text-white group-hover:border-black">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {Math.abs(stats?.growth_revenue_percentage || 0)}%
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.2em] group-hover:text-black/60">Receita Mensal</p>
                    <h3 className="text-3xl font-bold text-white mt-1 font-serif group-hover:text-black">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.monthly_revenue || 0)}
                    </h3>
                    <p className="text-gray-500 text-xs mt-2 font-mono group-hover:text-black/60">Anterior: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.previous_month_revenue || 0)}</p>
                </Card>

                {/* Events Count */}
                <Card className="bg-black border border-white/20 p-6 rounded-none hover:bg-white hover:text-black hover:border-white transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/10 rounded-none border border-white/10 group-hover:bg-black group-hover:border-black">
                            <Calendar className="h-6 w-6 text-white group-hover:text-white" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.2em] group-hover:text-black/60">Eventos Realizados</p>
                    <h3 className="text-3xl font-bold text-white mt-1 font-serif group-hover:text-black">{stats?.total_events}</h3>
                    <p className="text-gray-500 text-xs mt-2 font-mono group-hover:text-black/60">Total histórico</p>
                </Card>

                {/* Avg Ticket */}
                <Card className="bg-black border border-white/20 p-6 rounded-none hover:bg-white hover:text-black hover:border-white transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/10 rounded-none border border-white/10 group-hover:bg-black group-hover:border-black">
                            <PieChartIcon className="h-6 w-6 text-white group-hover:text-white" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.2em] group-hover:text-black/60">Ticket Médio</p>
                    <h3 className="text-3xl font-bold text-white mt-1 font-serif group-hover:text-black">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((stats?.monthly_revenue || 0) / (stats?.new_clients_month || 1))}
                    </h3>
                    <p className="text-gray-500 text-xs mt-2 font-mono group-hover:text-black/60">Estimado</p>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <Card className="bg-black border border-white/20 p-6 rounded-none">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider">Receita no Tempo</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            className="bg-transparent border border-white/20 text-white hover:bg-white hover:text-black rounded-none text-[10px] uppercase tracking-widest font-mono"
                        >
                            <Download className="mr-2 h-3 w-3" />
                            Exportar Excel
                        </Button>
                    </div>
                    <div className="h-[300px] font-mono text-xs">
                        {stats?.charts?.revenue && stats.charts.revenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.charts.revenue}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#666"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `R$${value / 1000}k`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffffff', borderRadius: '0px' }}
                                        itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                                        formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                        labelStyle={{ color: '#888', textTransform: 'uppercase', fontSize: '10px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#FFFFFF"
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-none">
                                <DollarSign className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm font-mono uppercase">Sem dados financeiros</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="bg-black border border-white/20 rounded-none">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-white font-serif uppercase tracking-wider text-lg">Crescimento</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {charts.clients.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={charts.clients}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ background: '#000000', border: '1px solid #ffffff', borderRadius: '0px' }}
                                        labelStyle={{ color: '#888', textTransform: 'uppercase', fontSize: '10px' }}
                                    />
                                    <Bar dataKey="value" fill="#ffffff" radius={[0, 0, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[250px] text-white/50">
                                <Users className="w-10 h-10 mb-2 opacity-20" />
                                <p className="font-mono text-xs uppercase">Sem dados de clientes</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Usage Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black border border-white/20 rounded-none">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-white font-serif uppercase tracking-wider text-lg">Páginas Mais Visitadas</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {pageData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={pageData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                    <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} width={100} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ background: '#000000', border: '1px solid #ffffff', borderRadius: '0px' }}
                                    />
                                    <Bar dataKey="value" fill="#888888" radius={[0, 0, 0, 0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-white/50 text-center py-10 font-mono text-xs uppercase">Sem dados</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-black border border-white/20 rounded-none">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-white font-serif uppercase tracking-wider text-lg">Categorias</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                        stroke="#000000"
                                        strokeWidth={2}
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ffffff' : '#444444'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#000000', border: '1px solid #ffffff', borderRadius: '0px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-white/50 text-center py-10 font-mono text-xs uppercase">Sem dados</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Events */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Eventos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {events.slice(-20).reverse().map((event, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs">
                                        {event.category || event.type}
                                    </span>
                                    <span className="text-white/80">{event.action || event.page_path || '-'}</span>
                                </div>
                                <span className="text-white/40 text-xs">
                                    {new Date(event.timestamp).toLocaleTimeString('pt-BR')}
                                </span>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <p className="text-white/50 text-center py-6">Nenhum evento registrado ainda</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
