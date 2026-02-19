import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { LeadDetailsDialog } from './LeadDetailsDialog';

interface LeadCardProps {
    lead: any;
}

export const LeadCard = ({ lead }: LeadCardProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <>
            <Card
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer bg-neutral-800 border-neutral-700"
                onClick={() => setIsOpen(true)}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Avatar className="w-10 h-10 border border-neutral-600">
                            <AvatarFallback className="bg-neutral-700 text-white font-medium">
                                {lead.name ? lead.name.substring(0, 2).toUpperCase() : '??'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-white text-sm truncate">{lead.name}</p>
                            {lead.event_type && (
                                <p className="text-xs text-neutral-400 truncate">{lead.event_type}</p>
                            )}
                        </div>
                    </div>

                    {/* Score Badge */}
                    <div className="flex items-center gap-1 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                        <TrendingUp className={`w-3 h-3 ${getScoreColor(lead.lead_score)}`} />
                        <span className={`text-xs font-semibold ${getScoreColor(lead.lead_score)}`}>
                            {lead.lead_score}
                        </span>
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-xs">
                    {lead.email && (
                        <div className="flex items-center gap-2 text-neutral-400">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{lead.email}</span>
                        </div>
                    )}

                    {lead.phone && (
                        <div className="flex items-center gap-2 text-neutral-400">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{lead.phone}</span>
                        </div>
                    )}

                    {lead.event_date && (
                        <div className="flex items-center gap-2 text-neutral-400">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{new Date(lead.event_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                    )}

                    {lead.estimated_budget && (
                        <div className="flex items-center gap-2 text-neutral-400">
                            <DollarSign className="w-3 h-3 flex-shrink-0" />
                            <span>R$ {Number(lead.estimated_budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                    {lead.source && (
                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-neutral-600 text-neutral-400">
                            {lead.source}
                        </Badge>
                    )}
                    {lead.status === 'active' && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Ativo" />
                    )}
                </div>
            </Card>

            {/* Details Dialog */}
            <LeadDetailsDialog
                lead={lead}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};
