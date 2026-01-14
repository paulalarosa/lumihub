import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Project {
    id: string;
    name: string;
    client_id: string;
    status: string;
    created_at: string;
}

export function useProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('name');

            if (!error && data) {
                setProjects(data);
            }
            setLoading(false);
        };

        fetchProjects();
    }, [user]);

    return { projects, loading };
}
