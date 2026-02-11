import { Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
}

interface EventServiceSelectorProps {
    selectedServiceId: string;
    onServiceSelect: (serviceId: string) => void;
    services: Service[];
}

export function EventServiceSelector({ selectedServiceId, onServiceSelect, services }: EventServiceSelectorProps) {
    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-300">
                <Sparkles className="h-4 w-4 text-white" />
                Selecionar Serviço
            </Label>
            <Select value={selectedServiceId} onValueChange={onServiceSelect}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-none">
                    <SelectValue placeholder="Preencher com serviço..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.duration_minutes}m) - R$ {service.price}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
