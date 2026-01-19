import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ServiceDialog from "@/components/services/ServiceDialog";
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Clock, Sparkles, Terminal } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { ServiceItem } from "@/services/services.service";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Servicos() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { services, loading, removeService, refetch } = useServices(user?.id);
    const [searchTerm, setSearchTerm] = useState("");

    const [showDialog, setShowDialog] = useState(false);
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
        await removeService(id);
    };

    const handleEdit = (service: ServiceItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedService(service);
        setShowDialog(true);
    };

    const handleNew = () => {
        setSelectedService(null);
        setShowDialog(true);
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0 && m > 0) return `${h}H ${m}M`;
        if (h > 0) return `${h}H`;
        return `${m}MIN`;
    };

    return (
        <div className="flex min-h-screen bg-black text-white selection:bg-white selection:text-black font-mono">
            <div className="flex-1 overflow-y-auto">


                <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/20 pb-6">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-serif text-white uppercase tracking-tighter">{t('pages.services.title')}</h1>
                            <p className="text-white/50 mt-2 font-mono text-xs uppercase tracking-widest">{t('pages.services.subtitle')}</p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 md:items-center">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
                                <Input
                                    placeholder="SEARCH_PROTOCOL..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-black border border-white/20 text-white rounded-none w-full md:w-[250px] focus:w-full md:focus:w-[300px] transition-all font-mono text-xs uppercase h-10 focus:ring-0 focus:border-white placeholder:text-white/20"
                                />
                            </div>
                            <Button
                                onClick={handleNew}
                                className="bg-white text-black hover:bg-gray-200 rounded-none font-mono text-xs uppercase tracking-widest h-10 px-6"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {t('pages.services.new')}
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <Skeleton key={i} className="h-48 w-full bg-white/5 rounded-none" />
                            ))}
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="border border-dashed border-white/20 p-12 text-center">
                            <Terminal className="w-12 h-12 text-white/20 mx-auto mb-6" />
                            <h3 className="text-white font-serif uppercase text-xl tracking-wider mb-2">CATALOG_EMPTY</h3>
                            <p className="text-white/40 text-xs font-mono uppercase mb-6">NO_SERVICES_DETECTED_IN_DATABASE.</p>
                            <Button
                                onClick={handleNew}
                                variant="outline"
                                className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase tracking-widest"
                            >
                                INITIALIZE_FIRST_SERVICE
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredServices.map(service => (
                                <div
                                    key={service.id}
                                    className="group relative bg-black border border-white/20 p-6 hover:border-white transition-all duration-300"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-2 h-2 bg-white"></div>
                                    </div>

                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-xl font-serif text-white uppercase tracking-wide pr-8">
                                            {service.name}
                                        </h3>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-black border border-white p-1 z-10">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white hover:text-black rounded-none" onClick={(e) => handleEdit(service, e)}>
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white hover:text-black rounded-none" onClick={(e) => handleDelete(service.id, e)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mb-6 pb-6 border-b border-white/10 border-dashed">
                                        <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest block mb-1">PRICE_POINT</span>
                                        <p className="text-4xl font-light text-white font-serif tracking-tight">
                                            {(service.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-white/60 text-xs font-mono mb-4 uppercase">
                                        <Clock className="h-3 w-3" />
                                        DURATION: <span className="text-white">{formatDuration(service.duration_minutes || 0)}</span>
                                    </div>

                                    {service.description && (
                                        <p className="text-white/40 text-xs font-mono uppercase leading-relaxed line-clamp-3">
                                            {service.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                </main>
            </div>

            <ServiceDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                service={selectedService ? { ...selectedService, title: selectedService.name } : null}
                onSuccess={refetch}
            />
        </div>
    );
}
