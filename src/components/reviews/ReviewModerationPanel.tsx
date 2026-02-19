import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Star, Check, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReviewRecord {
    id: string;
    rating: number;
    punctuality: number | null;
    technique: number | null;
    professionalism: number | null;
    final_result: number | null;
    comment: string | null;
    photos: string[];
    status: string;
    response: string | null;
    helpful_count: number;
    reported_count: number;
    is_featured: boolean;
    created_at: string;
    project: {
        name: string;
        client: {
            name: string;
        } | null;
    } | null;
}

interface ModerationPayload {
    reviewId: string;
    status: string;
    notes?: string;
}

export function ReviewModerationPanel() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['pending-reviews'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select('*, project:projects(name, client:wedding_clients(name))')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ReviewRecord[];
        },
    });

    const moderateMutation = useMutation({
        mutationFn: async ({ reviewId, status, notes }: ModerationPayload) => {
            const { error } = await supabase
                .from('reviews')
                .update({
                    status,
                    moderation_notes: notes || null,
                    moderated_at: new Date().toISOString(),
                    moderated_by: user?.id,
                })
                .eq('id', reviewId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
            toast.success('Review moderado');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Erro ao moderar review');
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-32 bg-neutral-800/50 rounded-lg animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                    Reviews Pendentes
                </h2>
                <span className="text-sm text-neutral-400">
                    {reviews?.length || 0} pendente(s)
                </span>
            </div>

            {(!reviews || reviews.length === 0) && (
                <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400">Nenhum review pendente</p>
                </div>
            )}

            {reviews?.map((review) => (
                <div
                    key={review.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-6"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="font-semibold text-white">
                                {review.project?.client?.name || 'Cliente'}
                            </p>
                            <p className="text-sm text-neutral-500">
                                {review.project?.name || 'Projeto'} —{' '}
                                {new Date(review.created_at).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        'w-5 h-5',
                                        review.rating >= star
                                            ? 'fill-yellow-500 text-yellow-500'
                                            : 'text-neutral-700'
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {review.comment && (
                        <p className="text-neutral-300 mb-4 text-sm leading-relaxed">
                            {review.comment}
                        </p>
                    )}

                    {review.photos && review.photos.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto">
                            {review.photos.map((url, idx) => (
                                <img
                                    key={idx}
                                    src={url}
                                    alt={`Review ${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                />
                            ))}
                        </div>
                    )}

                    {(review.punctuality || review.technique || review.professionalism || review.final_result) && (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {[
                                { label: 'Pontualidade', value: review.punctuality },
                                { label: 'Técnica', value: review.technique },
                                { label: 'Profissionalismo', value: review.professionalism },
                                { label: 'Resultado', value: review.final_result },
                            ].map((item) =>
                                item.value ? (
                                    <div
                                        key={item.label}
                                        className="bg-neutral-800 rounded p-2 text-center"
                                    >
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                            {item.label}
                                        </p>
                                        <p className="text-white font-bold">{item.value}/5</p>
                                    </div>
                                ) : null
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-neutral-800">
                        <Button
                            size="sm"
                            onClick={() =>
                                moderateMutation.mutate({
                                    reviewId: review.id,
                                    status: 'approved',
                                })
                            }
                            disabled={moderateMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Check className="w-4 h-4 mr-1" />
                            Aprovar
                        </Button>

                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                                moderateMutation.mutate({
                                    reviewId: review.id,
                                    status: 'rejected',
                                    notes: 'Rejeitado pela moderação',
                                })
                            }
                            disabled={moderateMutation.isPending}
                        >
                            <X className="w-4 h-4 mr-1" />
                            Rejeitar
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
