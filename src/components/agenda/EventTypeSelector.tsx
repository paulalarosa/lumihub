import { Tag } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { EVENT_TYPES } from './hooks/useEventForm';

interface EventTypeSelectorProps {
    currentType: string;
    onTypeChange: (type: string) => void;
}

export function EventTypeSelector({ currentType, onTypeChange }: EventTypeSelectorProps) {
    return (
        <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                <Tag className="h-4 w-4 text-white" />
                Tipo de Evento
            </Label>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {EVENT_TYPES.map(type => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => onTypeChange(type.value)}
                        className={`
              px-6 py-2.5 rounded-none text-sm font-medium transition-all duration-300 whitespace-nowrap border
              ${currentType === type.value
                                ? 'bg-white/20 text-white border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}
            `}
                    >
                        {type.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
