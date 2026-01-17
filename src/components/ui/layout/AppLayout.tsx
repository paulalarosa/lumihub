import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/layout/AppSidebar";
import { BottomNav } from "@/components/ui/layout/BottomNav";
import { Outlet } from "react-router-dom";
import { TrialBanner } from "@/components/features/subscription/TrialBanner";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { useState } from "react";
import { PageTransition } from "../animation/PageTransition";
import { NotificationBell } from "./NotificationBell";

export default function AppLayout() {
    const [runTour, setRunTour] = useState(false);

    return (
        <SidebarProvider>
            {/* Desktop Sidebar (Left) */}
            <AppSidebar onStartTour={() => setRunTour(true)} />

            {/* Main Content Area */}
            <SidebarInset className="bg-[#050505] min-h-screen mb-[60px] md:mb-0">
                <div className="sticky top-0 z-50 w-full flex flex-col bg-black/80 backdrop-blur-xl border-b border-white/5">
                    <TrialBanner />

                    {/* App Header (Desktop & Mobile combined logic where possible, or just Desktop) */}
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                        <div className="flex items-center gap-2 md:hidden">
                            <SidebarTrigger className="-ml-1 text-white" />
                            <span className="font-serif text-lg font-bold text-white">LumiHub</span>
                        </div>

                        {/* Spacer for Desktop to align right */}
                        <div className="hidden md:flex flex-1" />

                        {/* Global Actions (Notifications, etc) */}
                        <div className="flex items-center gap-3">
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

            <OnboardingTour runManual={runTour} onManualClose={() => setRunTour(false)} />
        </SidebarProvider>
    );
}
