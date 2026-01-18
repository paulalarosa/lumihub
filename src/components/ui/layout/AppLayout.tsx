import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/layout/AppSidebar";
import { BottomNav } from "@/components/ui/layout/BottomNav";
import { Outlet } from "react-router-dom";
import { TrialBanner } from "@/components/features/subscription/TrialBanner";
import { PageTransition } from "../animation/PageTransition";
import { NotificationBell } from "./NotificationBell";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function AppLayout() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setProfile(data);
                }
            } catch (error) {
                console.error("Error fetching profile for layout:", error);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleOnboardingComplete = () => {
        // Optimistically update profile to hide wizard immediately
        setProfile((prev: any) => ({ ...prev, onboarding_completed: true }));
        // Reload to ensure fresh state everywhere
        window.location.reload();
    };

    // SYSTEM INITIALIZATION CHECK - Handled by ProtectedRoute now
    // if (user && !loadingProfile && profile && profile.onboarding_completed === false) {
    //    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
    // }

    return (
        <SidebarProvider>
            {/* Desktop Sidebar (Left) */}
            <AppSidebar />

            {/* Main Content Area */}
            <SidebarInset className="bg-background min-h-screen mb-[60px] md:mb-0 transition-colors duration-300">
                <div className="sticky top-0 z-50 w-full flex flex-col bg-background/80 backdrop-blur-xl border-b border-border">
                    <TrialBanner />

                    {/* App Header (Desktop & Mobile combined logic where possible, or just Desktop) */}
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                        <div className="flex items-center gap-4 md:hidden">
                            <SidebarTrigger className="-ml-1 bg-black border border-white/20 rounded-none h-10 w-10 text-white hover:bg-white hover:text-black transition-colors" />
                            <span className="font-serif text-lg font-bold text-white tracking-tight">LumiHub</span>
                        </div>

                        {/* Spacer for Desktop to align right */}
                        <div className="hidden md:flex flex-1" />

                        {/* Global Actions (Notifications, etc) */}
                        <div className="flex items-center gap-3">
                            <ModeToggle />
                            <NotificationBell />
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 w-full max-w-7xl mx-auto">
                    {/* AnimatePresence currently requires access to location key which is managed by Routes in App.tsx. 
                        Ideally, we wrap the Outlet here if we want simple transition. 
                        For route-specific keying, we'd do it in App.tsx. 
                        However, wrapping Outlet usually works for mount animations. 
                     */}
                    {/* We import PageTransition first */}
                    <PageTransition>
                        <Outlet />
                    </PageTransition>
                </div>
            </SidebarInset>

            {/* Mobile Bottom Navigation (Fixed) */}
            <BottomNav />

        </SidebarProvider>
    );
}
