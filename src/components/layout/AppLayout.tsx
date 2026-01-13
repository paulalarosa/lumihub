import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { Outlet } from "react-router-dom";

import { TrialBanner } from "../subscription/TrialBanner";

export default function AppLayout() {
    return (
        <SidebarProvider>
            {/* Desktop Sidebar (Left) */}
            <AppSidebar />

            {/* Main Content Area */}
            <SidebarInset className="bg-[#050505] min-h-screen mb-[60px] md:mb-0">
                <div className="sticky top-0 z-50 w-full">
                    <TrialBanner />
                </div>
                {/* Mobile Header Trigger (Optional, or consistent header) */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4 md:hidden bg-black/40 backdrop-blur-md sticky top-0 z-40">
                    {/* If we want a sidebar on mobile (Sheet), we use SidebarTrigger. 
               But user requested Bottom Nav OR Drawer. We have Bottom Nav. 
               We can keep SidebarTrigger if we want access to the Sidebar (as Drawer) for "More" options. 
               Let's keep it but maybe hide it if Bottom Nav covers everything. 
               Actually, Bottom Nav covers main items. Sidebar has Settings/Logout. 
               So we NEED the Drawer (Sidebar) on mobile for "More". 
           */}
                    <SidebarTrigger className="-ml-1 text-white" />
                    <span className="font-serif text-lg font-bold text-white">LumiHub</span>
                </header>

                {/* Page Content */}
                <div className="flex-1 w-full max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </SidebarInset>

            {/* Mobile Bottom Navigation (Fixed) */}
            <BottomNav />
        </SidebarProvider>
    );
}
