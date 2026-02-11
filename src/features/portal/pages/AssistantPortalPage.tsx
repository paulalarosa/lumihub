
import { parseISO, format } from "date-fns";
import {
    Loader2, Terminal, MapPin, Clock, CreditCard,
    CalendarIcon, Mail, CheckSquare, Building2,
    ShieldAlert, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import AssistantAgenda from "../components/AssistantAgenda";
import AssistantTasks from "../components/AssistantTasks";
import PremiumFeatureModal from "../components/PremiumFeatureModal";
import { useAssistantPortal } from "../hooks/useAssistantPortal";

const AssistantPortalPage = () => {
    const p = useAssistantPortal();

    if (p.authLoading || p.isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (!p.user || p.assistantsList.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-6">
                <div className="max-w-md w-full border border-white/20 p-12 text-center bg-black">
                    <ShieldAlert className="h-12 w-12 mx-auto text-white/50 mb-6" />
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-2">ACCESS_DENIED</h2>
                    <p className="text-white/60 mb-8 font-mono text-xs uppercase tracking-widest leading-relaxed">Nenhum contrato ativo encontrado para este e-mail.</p>
                    <Button variant="outline" onClick={p.handleLogout} className="rounded-none w-full border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest h-12">TERMINATE_SESSION</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-white selection:text-black pb-24">
            <header className="fixed top-0 left-0 right-0 bg-[#050505] border-b border-neutral-800 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-serif text-white tracking-wide">
                            KONTROL <span className="text-neutral-600 text-sm font-sans italic">/ {p.currentAssistantName}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {p.activeAssistants.length > 0 && (
                            <div className="hidden md:block w-48">
                                <Select value={p.selectedAssistantId} onValueChange={p.setSelectedAssistantId}>
                                    <SelectTrigger className="h-8 rounded-none bg-neutral-900 border-neutral-800 text-[10px] uppercase tracking-wider text-white"><SelectValue placeholder="FILTRAR POR..." /></SelectTrigger>
                                    <SelectContent className="bg-black border-neutral-800 rounded-none text-white">
                                        <SelectItem value="all" className="text-[10px] uppercase tracking-wider">VISÃO GERAL (TODOS)</SelectItem>
                                        {p.activeAssistants.map(a => (
                                            <SelectItem key={a.id} value={a.id} className="text-[10px] uppercase tracking-wider">{p.employersMap[a.user_id] || "Unknown Client"}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={p.handleLogout} className="rounded-none text-neutral-500 hover:text-white hover:bg-transparent font-mono text-[10px] uppercase tracking-widest h-auto p-0">[ LEAVE ]</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-24">
                {p.pendingInvites.length > 0 && p.activeTab !== 'convites' && (
                    <div className="mb-8 border border-yellow-900/50 bg-yellow-900/10 p-4 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-yellow-500 uppercase tracking-widest">{p.pendingInvites.length} {p.pendingInvites.length === 1 ? 'Novo Convite' : 'Novos Convites'}</span>
                        </div>
                        <Button size="sm" variant="link" className="text-yellow-500 underline decoration-yellow-500/50 text-xs uppercase cursor-pointer" onClick={() => p.setActiveTab('convites')}>Ver Agora</Button>
                    </div>
                )}

                {p.activeTab === 'dashboard' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] text-neutral-600 uppercase tracking-[0.3em] mb-2">/// CONTEXT: {p.selectedAssistantId === 'all' ? 'GLOBAL' : (p.activeAssistants.find(a => a.id === p.selectedAssistantId) ? p.employersMap[p.activeAssistants.find(a => a.id === p.selectedAssistantId)!.user_id] : 'TARGET')} </p>
                                <h1 className="text-5xl font-serif text-white tracking-widest uppercase">{format(new Date(), "HH:mm")}</h1>
                            </div>
                        </div>

                        <section>
                            <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
                                <h2 className="text-xs text-white font-bold uppercase tracking-[0.2em] flex items-center gap-2"><Activity className="h-3 w-3" /> NEXT_MISSION</h2>
                                {p.nextEvent && <span className="text-[9px] text-white bg-neutral-900 border border-neutral-800 px-2 py-1 uppercase tracking-widest">CONFIRMED</span>}
                            </div>
                            {p.nextEvent ? (
                                <Card className="bg-black text-white border border-neutral-800 rounded-none overflow-hidden relative group hover:border-neutral-600 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><MapPin className="h-32 w-32 translate-x-10 -translate-y-10" /></div>
                                    <CardContent className="p-8 relative z-10">
                                        <div className="space-y-8">
                                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 border-b border-white/10 pb-6">
                                                <div>
                                                    <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-1">PROJECT / CLIENT</p>
                                                    <h3 className="text-lg font-bold tracking-wide">{p.nextEvent.projects?.name || 'PRIVATE_EVENT'}</h3>
                                                    <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">{p.nextEvent.title}</p>
                                                </div>
                                                <div className="text-left md:text-right">
                                                    <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-1">DATE</p>
                                                    <p className="text-lg font-serif">{format(parseISO(p.nextEvent.event_date), "dd . MM . yyyy")}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-2">CALL_TIME</p>
                                                    <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-white" /><span className="text-2xl font-light">{p.nextEvent.start_time?.substring(0, 5) || "TBA"}</span></div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] mb-2">LOCATION</p>
                                                    <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-white" /><span className="text-sm font-bold uppercase truncate max-w-[150px]">{p.nextEvent.location || "TBA"}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="border border-neutral-800 bg-neutral-900/20 p-12 text-center rounded-none">
                                    <p className="text-neutral-500 font-mono text-xs uppercase tracking-[0.2em]">NO_PENDING_MISSIONS</p>
                                    <p className="text-[9px] text-neutral-700 font-mono uppercase mt-2">STANDBY_MODE_ENGAGED</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {p.activeTab === 'convites' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                            <h2 className="text-xl font-serif text-white tracking-wide">Convites Pendentes</h2>
                            <span className="text-xs font-mono text-neutral-500">{p.pendingInvites.length} REQUESTS</span>
                        </div>
                        {p.pendingInvites.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-neutral-800 bg-white/5">
                                <CheckSquare className="h-12 w-12 mx-auto text-neutral-600 mb-4" />
                                <p className="text-neutral-400 font-mono text-xs uppercase tracking-widest">Wow, so quiet.</p>
                                <p className="text-[10px] text-neutral-600 uppercase mt-2">All caught up.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {p.pendingInvites.map(invite => (
                                    <Card key={invite.id} className="bg-neutral-900 border border-neutral-800 rounded-none hover:border-white/30 transition-all">
                                        <CardContent className="p-8 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-white text-black flex items-center justify-center rounded-none"><Building2 className="h-6 w-6" /></div>
                                                <div>
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Maquiadora</p>
                                                    <h3 className="font-serif text-lg text-white">{p.employersMap[invite.user_id] || "Artista KONTROL"}</h3>
                                                </div>
                                            </div>
                                            <div className="pt-6 border-t border-neutral-800">
                                                <Button onClick={() => p.handleAcceptInvite(invite.id)} className="w-full bg-white text-black hover:bg-neutral-200 rounded-none font-bold uppercase tracking-widest text-xs h-10">Aceitar Unificação</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {p.activeTab === 'agenda' && (
                    <AssistantAgenda events={p.events} currentMonth={p.currentMonth} onMonthChange={p.setCurrentMonth} />
                )}

                {p.activeTab === 'tarefas' && (
                    <AssistantTasks tasks={[]} onTaskUpdate={() => { }} />
                )}

                {p.activeTab === 'financeiro' && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 border border-neutral-800 bg-neutral-900/10 p-12">
                        <div className="w-16 h-16 border border-neutral-800 flex items-center justify-center bg-black"><CreditCard className="h-6 w-6 text-white" /></div>
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">ACCESS_RESTRICTED</h3>
                            <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest max-w-xs mx-auto">Full financial breakdowns are reserved for Pro Organization Accounts.</p>
                        </div>
                        <Button onClick={() => { p.setSelectedFeature("Financeiro"); p.setPremiumModalOpen(true); }} className="rounded-none bg-white text-black font-bold text-xs uppercase tracking-[0.2em] h-12 px-8 hover:bg-neutral-200">Unlock Pro Access</Button>
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-neutral-800 z-50 pb-safe">
                <div className="grid grid-cols-5 h-20">
                    {([
                        { tab: 'dashboard' as const, icon: Terminal, label: 'HOME' },
                        { tab: 'agenda' as const, icon: CalendarIcon, label: 'PLAN' },
                        { tab: 'convites' as const, icon: Mail, label: 'INVITES' },
                        { tab: 'tarefas' as const, icon: CheckSquare, label: 'OPS' },
                        { tab: 'financeiro' as const, icon: CreditCard, label: 'FIN' },
                    ]).map(({ tab, icon: Icon, label }) => (
                        <button key={tab} onClick={() => p.setActiveTab(tab)} className={`flex flex-col items-center justify-center gap-2 relative group ${p.activeTab === tab ? 'text-white' : 'text-neutral-600'}`}>
                            <Icon className="h-5 w-5" />
                            <span className="text-[8px] font-mono uppercase tracking-[0.2em]">{label}</span>
                            {tab === 'convites' && p.pendingInvites.length > 0 && <span className="absolute top-2 right-4 w-2 h-2 rounded-none bg-yellow-500" />}
                            {p.activeTab === tab && <div className="absolute top-0 left-0 right-0 h-[2px] bg-white"></div>}
                        </button>
                    ))}
                </div>
            </nav>

            <PremiumFeatureModal open={p.premiumModalOpen} onOpenChange={p.setPremiumModalOpen} featureName={p.selectedFeature} professionalName="KONTROL" professionalPhone="" />
        </div>
    );
};

export default AssistantPortalPage;
