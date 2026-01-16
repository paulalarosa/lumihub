import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ServiceDialog from "@/components/services/ServiceDialog";
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Trash2, Clock, Sparkles } from "lucide-react";
import Header from "@/components/ui/layout/Header"; // FIXED IMPORT
import { useServices } from "@/hooks/useServices";
import { ServiceItem } from "@/services/services.service";
import { Skeleton } from "@/components/ui/skeleton";

export default function Servicos() {
    const { user } = useAuth();
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
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    return (
        <div className="flex min-h-screen bg-[#050505]">
            <div className="flex-1 overflow-y-auto">
                <Header />

                <main className="p-8 max-w-7xl mx-auto space-y-8">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-serif text-white font-light">Menu de Serviços</h1>
                            <p className="text-gray-400 mt-1">Gerencie seu catálogo de serviços e preços.</p>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-white/5 border-white/10 text-white rounded-xl w-[200px] focus:w-[250px] transition-all"
                                />
                            </div>
                            <Button
                                onClick={handleNew}
                                className="bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Serviço
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <Skeleton key={i} className="h-48 w-full bg-white/5 rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <EmptyState
                            icon={Sparkles}
                            title="Seu menu está em branco"
                            description="Comece a definir o valor do seu trabalho criando seu primeiro serviço."
                            actionLabel="Criar Serviço"
                            onAction={handleNew}
                            className="bg-white/[0.02] border-dashed border-white/5"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredServices.map(service => (
                                <div
                                    key={service.id}
                                    className="group relative bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-serif text-gray-200 group-hover:text-white transition-colors">
                                            {service.name}
                                        </h3>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-cyan-400" onClick={(e) => handleEdit(service, e)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-400" onClick={(e) => handleDelete(service.id, e)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="text-3xl font-light text-cyan-400 mb-4">
                                        {(service.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>

                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                        <Clock className="h-4 w-4" />
                                        {formatDuration(service.duration_minutes || 0)}
                                    </div>

                                    {service.description && (
                                        <p className="text-gray-500 text-sm line-clamp-2">
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
