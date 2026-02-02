
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Edit2, Trash2, Check, Copy, Users } from "lucide-react";
import { Assistant } from "../hooks/useAssistants";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AssistantListProps {
    assistants: Assistant[];
    onEdit: (assistant: Assistant) => void;
    onDelete: (id: string) => void;
    isLoading: boolean;
}

export function AssistantList({ assistants, onEdit, onDelete, isLoading }: AssistantListProps) {
    const { toast } = useToast();
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const copyInviteLink = (token: string) => {
        if (!token) {
            toast({
                title: "Erro",
                description: "Token de convite inválido ou pendente.",
                variant: "destructive"
            });
            return;
        }
        const link = `${window.location.origin}/assistente/convite/${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        toast({
            title: "Link copiado!",
            description: "Envie para a assistente criar sua conta"
        });
        setTimeout(() => setCopiedToken(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-none h-6 w-6 border-b-2 border-white"></div>
            </div>
        );
    }

    if (assistants.length === 0) {
        return (
            <div className="text-center py-20 border border-dashed border-white/10 bg-white/[0.02]">
                <Users className="h-12 w-12 mx-auto text-gray-700 mb-4" />
                <p className="text-gray-400 mb-6 font-light">
                    Nenhuma assistente cadastrada
                </p>
                {/* Trigger open dialog via parent if needed, but here we just show empty state */}
            </div>
        );
    }

    return (
        <div className="space-y-0 divide-y divide-white/5 border border-white/5">
            {assistants.map(assistant => (
                <div
                    key={assistant.id}
                    className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h3 className="font-medium text-lg text-white group-hover:text-white/90 transition-colors uppercase tracking-wide font-serif">{assistant.name}</h3>
                            {assistant.is_registered ? (
                                <Badge variant="outline" className="rounded-none border-green-900/50 text-green-500 bg-green-500/10 text-[10px] uppercase tracking-wider px-2 py-0.5">
                                    Registrada
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="rounded-none border-yellow-900/50 text-yellow-500 bg-yellow-500/10 text-[10px] uppercase tracking-wider px-2 py-0.5">
                                    Pendente
                                </Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-6 mt-3 text-sm text-gray-400">
                            {assistant.email && (
                                <span className="flex items-center gap-2 hover:text-white transition-colors">
                                    <Mail className="h-3.5 w-3.5" />
                                    {assistant.email}
                                </span>
                            )}
                            {assistant.phone && (
                                <span className="flex items-center gap-2 hover:text-white transition-colors">
                                    <Phone className="h-3.5 w-3.5" />
                                    {assistant.phone}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!assistant.is_registered && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyInviteLink(assistant.invite_token)}
                                className="gap-2 rounded-none border-white/10 hover:bg-white hover:text-black hover:border-white transition-all text-xs uppercase tracking-wider bg-transparent text-gray-300"
                            >
                                {copiedToken === assistant.invite_token ? (
                                    <Check className="h-3 w-3" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                                Copiar Link
                            </Button>
                        )}
                        <div className="flex bg-white/5 border border-white/5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(assistant)}
                                className="rounded-none hover:bg-white/10 hover:text-white text-gray-400 h-9 w-9"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <div className="w-px bg-white/5"></div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(assistant.id)}
                                className="rounded-none hover:bg-red-500/10 hover:text-red-400 text-gray-500 h-9 w-9"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
