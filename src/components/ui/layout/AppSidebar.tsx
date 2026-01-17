import {
    Calendar,
    Home,
    Settings,
    LogOut,
    Users,
    Briefcase,
    CreditCard,
    Sparkles,
    FileSignature,
    Megaphone,
    ShieldCheck
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function AppSidebar() {
    const { user, signOut, isAdmin: authIsAdmin } = useAuth();
    // Force admin for specific user as backup
    const isAdmin = authIsAdmin || user?.email === 'prenata@gmail.com';
    const location = useLocation();
    const { t } = useLanguage();

    // Menu items.
    const items = [
        {
            title: t("sidebar_dashboard"),
            url: "/dashboard",
            icon: Home,
        },
        {
            title: t("sidebar_agenda"),
            url: "/agenda",
            icon: Calendar,
        },
        {
            title: t("sidebar_clients"),
            url: "/clientes",
            icon: Users,
        },
        {
            title: t("sidebar_projects"),
            url: "/projetos",
            icon: Briefcase,
        },
        {
            title: t("sidebar_marketing"),
            url: "/marketing",
            icon: Megaphone,
        },
        {
            title: t("sidebar_contracts"),
            url: "/contratos",
            icon: FileSignature,
        },
        {
            title: t("sidebar_financial"),
            url: "/dashboard/financial",
            icon: CreditCard,
        },
        {
            title: t("sidebar_services"),
            url: "/servicos",
            icon: Sparkles,
        },
        {
            title: t("sidebar_settings"),
            url: "/configuracoes",
            icon: Settings,
        },
    ]

    // Highlight active
    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <Sidebar className="border-r border-border bg-background">
            <SidebarHeader className="border-b border-border p-4 bg-background">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 flex items-center justify-center border border-foreground bg-background">
                        <span className="text-foreground font-serif font-bold text-lg">L</span>
                    </div>
                    <span className="font-serif text-xl font-bold text-foreground tracking-tight">
                        LumiHub
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-background">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">{t("sidebar_menu_main")}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        className="data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:border-r-0 hover:bg-accent hover:text-accent-foreground transition-all text-muted-foreground rounded-none border-l-2 border-transparent data-[active=true]:border-transparent"
                                    >
                                        <Link to={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span className="font-mono text-xs uppercase tracking-wider">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin Section - Only visible for admins */}
                {isAdmin && (
                    <SidebarGroup className="mt-auto">
                        <SidebarGroupLabel className="text-muted-foreground px-2 text-[10px] font-mono font-semibold uppercase tracking-widest mb-2">{t("sidebar_menu_admin")}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive('/admin')}
                                        className="text-foreground data-[active=true]:bg-foreground data-[active=true]:text-background hover:bg-accent hover:text-accent-foreground transition-all rounded-none"
                                    >
                                        <Link to="/admin">
                                            <ShieldCheck className="h-4 w-4" />
                                            <span className="font-mono text-xs uppercase tracking-wider">{t("sidebar_admin")}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}


                <SidebarGroup className="mt-auto pb-4">
                    <SidebarGroupContent>
                        {/* Help link removed for new onboarding system */}
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>

            <SidebarFooter className="border-t border-border p-4 bg-background">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <Avatar className="h-8 w-8 border border-border rounded-none">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-background text-foreground font-mono rounded-none">U</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-foreground truncate font-serif">{user?.user_metadata?.full_name || 'User'}</span>
                        <span className="text-[10px] text-muted-foreground truncate font-mono">{user?.email}</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent rounded-none uppercase text-xs tracking-wider font-mono border border-transparent hover:border-border"
                    onClick={signOut}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("sidebar_logout")}
                </Button>
            </SidebarFooter>
        </Sidebar>
    )
}
