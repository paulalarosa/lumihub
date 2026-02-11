
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, ExternalLink } from 'lucide-react';

interface Briefing {
    id: string;
    questions: Record<string, unknown>[];
    answers: Record<string, any>;
    is_submitted: boolean;
}

interface ProjectBriefingProps {
    briefing: Briefing | null;
    createDefaultBriefing: () => void;
    copyPortalLink: () => void;
}

export const ProjectBriefing = ({
    briefing,
    createDefaultBriefing,
    copyPortalLink
}: ProjectBriefingProps) => {
    return (
        <Card className="bg-black border border-white/20 rounded-none">
            <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white font-serif uppercase tracking-wide">BRIEFING_DATA</CardTitle>
                <CardDescription className="text-white/40 font-mono text-xs uppercase tracking-widest">CLIENT_INPUTS</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                {!briefing ? (
                    <div className="text-center py-12 border border-white/10 border-dashed bg-white/5">
                        <ClipboardList className="h-12 w-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40 mb-4 font-mono text-xs uppercase tracking-widest">
                            NO_BRIEFING_INITIATED
                        </p>
                        <Button onClick={createDefaultBriefing} className="bg-white text-black hover:bg-white/90 rounded-none font-mono text-xs uppercase tracking-widest">
                            <Plus className="h-4 w-4 mr-2" />
                            Initialize_Briefing
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className={`rounded-none font-mono text-[9px] uppercase tracking-widest px-3 py-1 ${briefing.is_submitted ? 'bg-white text-black border-white' : 'text-white/50 border-white/30'
                                }`}>
                                {briefing.is_submitted ? 'STATUS: COMPLETED' : 'STATUS: WAITING'}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={copyPortalLink} className="rounded-none border-white/20 text-white hover:bg-white hover:text-black font-mono text-xs uppercase">
                                <ExternalLink className="h-3 w-3 mr-2" />
                                Send_to_client
                            </Button>
                        </div>

                        <div className="space-y-4 mt-6">
                            {(briefing.questions as Array<{ id: string; question: string }>).map((q) => (
                                <div key={q.id} className="p-4 border border-white/10 bg-white/5">
                                    <p className="font-mono text-xs text-white/60 mb-2 uppercase tracking-wide">Q. {q.question}</p>
                                    <p className="font-serif text-white pl-4 border-l border-white/20">
                                        {briefing.answers[q.id] || '---'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
