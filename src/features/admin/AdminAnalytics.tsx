import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, MousePointer, Clock, TrendingUp, Eye, RefreshCw } from 'lucide-react';
import { analyticsService } from '@/services/analytics.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#00e5ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'];

export default function AdminAnalytics() {
    const [events, setEvents] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = () => {
        const storedEvents = analyticsService.getStoredEvents();
        setEvents(storedEvents);
        setSummary(analyticsService.getSessionSummary());
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

    const ctaClicks = events.filter(e => e.category === 'cta_click').length;
    const conversions = events.filter(e => e.type === 'conversion').length;
    const pageViews = events.filter(e => e.type === 'page_view').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif text-white">Analytics Dashboard</h2>
                <Button variant="outline" size="sm" onClick={loadAnalytics} className="text-white border-white/20">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">Total de Eventos</CardTitle>
                        <BarChart3 className="h-4 w-4 text-cyan-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{events.length}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">Page Views</CardTitle>
                        <Eye className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{pageViews}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">Cliques em CTAs</CardTitle>
                        <MousePointer className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{ctaClicks}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">Conversões</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{conversions}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Páginas Mais Visitadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pageData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={pageData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                                    <YAxis stroke="#666" />
                                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                                    <Bar dataKey="value" fill="#00e5ff" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-white/50 text-center py-10">Nenhum dado ainda</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Eventos por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-white/50 text-center py-10">Nenhum dado ainda</p>
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
