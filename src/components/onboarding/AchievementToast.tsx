import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export const AchievementNotifications = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Buscar conquistas novas
    const { data: newAchievements } = useQuery({
        queryKey: ['new-achievements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_achievements')
                .select('*, achievement:achievements(*)')
                .eq('user_id', user?.id)
                .eq('is_new', true)
                .order('unlocked_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        refetchInterval: 5000, // Check every 5s
        enabled: !!user,
    });

    // Marcar como visto
    const markSeenMutation = useMutation({
        mutationFn: async (achievementId: string) => {
            const { error } = await supabase
                .from('user_achievements')
                .update({ is_new: false, seen_at: new Date().toISOString() })
                .eq('id', achievementId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['new-achievements'] });
        },
    });

    useEffect(() => {
        if (newAchievements && newAchievements.length > 0) {
            newAchievements.forEach((achievement: any) => {
                // Confetti
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.8 },
                });

                // Toast customizado
                toast.custom(
                    (t) => (
                        <div className="bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-500 rounded-lg p-4 shadow-2xl max-w-md w-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1">
                                <button onClick={() => toast.dismiss(t)} className="text-white/50 hover:text-white">&times;</button>
                            </div>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="text-4xl">{achievement.achievement.icon}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider bg-purple-950/50 px-1.5 py-0.5 rounded">
                                            Conquista Desbloqueada
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        {achievement.achievement.name}
                                    </h3>
                                    <p className="text-sm text-purple-200 leading-snug">
                                        {achievement.achievement.description}
                                    </p>
                                    {achievement.achievement.reward_message && (
                                        <p className="text-xs text-purple-300 mt-2 italic border-t border-purple-800/50 pt-1">
                                            "{achievement.achievement.reward_message}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ),
                    {
                        duration: 6000,
                        position: 'top-center',
                    }
                );

                // Marcar como visto
                markSeenMutation.mutate(achievement.id);
            });
        }
    }, [newAchievements]);

    return null; // Componente invisível
};
