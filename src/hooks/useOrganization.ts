import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export function useOrganization() {
    const { user } = useAuth();
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (!user) {
            setOrganizationId(null);
            setLoading(false);
            return;
        }

        const fetchOrganization = async () => {
            try {
                setLoading(true);
                // Check if user is an owner or assistant
                // We need to fetch the profile to see if there is a parent_user_id
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('id, parent_user_id, role, subscription_tier')
                    .eq('id', user.id)
                    .maybeSingle();

                const profileData = profile;

                if (error) {
                    logger.error(error, {
                        message: 'Erro ao carregar organização.',
                        showToast: false
                    });
                    // Fallback to user.id as organization if profile fetch fails (safe default)
                    setOrganizationId(user.id);
                    setIsOwner(true);
                } else if (profileData?.parent_user_id) {
                    // User is an assistant, organization is the parent
                    setOrganizationId(profileData.parent_user_id);
                    setIsOwner(false);
                } else {
                    // User is the owner
                    setOrganizationId(user.id);
                    setIsOwner(true);
                }
            } catch (err) {
                logger.error(err, {
                    message: 'Erro inesperado ao carregar organização.',
                    showToast: false
                });
                setOrganizationId(user.id);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganization();
    }, [user]);

    return {
        organizationId,
        isOwner,
        loading,
        user
    };
}
