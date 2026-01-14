
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RecoveryCode {
    code: string;
    created_at: string;
}

export function useMFA() {
    const { session } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkLevel = useCallback(async () => {
        if (!session) return null;
        try {
            const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (error) throw error;
            return data;
        } catch (e) {
            return null;
        }
    }, [session]);

    const listFactors = useCallback(async () => {
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            return data.all;
        } catch (e) {
            return [];
        }
    }, []);

    const enroll = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
            });
            if (error) throw error;
            return data;
        } catch (e: any) {
            setError(e.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const challenge = async (factorId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.mfa.challenge({ factorId });
            if (error) throw error;
            return data;
        } catch (e: any) {
            setError(e.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const verify = async (factorId: string, challengeId: string, code: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.mfa.verify({
                factorId,
                challengeId,
                code,
            });
            if (error) throw error;
            return data;
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const unenroll = async (factorId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.mfa.unenroll({ factorId });
            if (error) throw error;
            return true;
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        checkLevel,
        listFactors,
        enroll,
        challenge,
        verify,
        unenroll,
        isLoading,
        error,
    };
}
