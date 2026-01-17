import {
    Calendar,
    Home,
    Settings,
    User,
    LogOut,
    Users,
    Briefcase,
    CreditCard,
    Sparkles,
    FileSignature,
    Megaphone,
    HelpCircle,
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

// Menu items.
const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Agenda",
        url: "/agenda",
        icon: Calendar,
    },
    {
        title: "Clientes", // "Clients"
        url: "/clientes",
        icon: Users,
    },
    {
        title: "Projetos", // "Projects"
        url: "/projetos",
        icon: Briefcase,
    },
    {
        title: "Marketing",
        url: "/marketing",
        icon: Megaphone,
    },
    {
        title: "Contratos",
        url: "/contratos",
        icon: FileSignature,
    },
    {
        title: "Financeiro", // "Financial"
        url: "/dashboard/financial",
        icon: CreditCard,
    },
    {
        title: "Serviços",
        url: "/servicos",
        icon: Sparkles,
    },
    {
        title: "Configurações", // "Settings"
        url: "/configuracoes",
        icon: Settings,
    },
]

export function AppSidebar({ onStartTour }: { onStartTour?: () => void }) {
    const { user, signOut, isAdmin: authIsAdmin } = useAuth();
    // Force admin for specific user as backup
    const isAdmin = authIsAdmin || user?.email === 'prenata@gmail.com';
    const location = useLocation();
    const { isMobile } = useSidebar();

    // Highlight active
    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <Sidebar className="border-r border-white/20 bg-black">
            <SidebarHeader className="border-b border-white/20 p-4 bg-black">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 flex items-center justify-center border border-white bg-black">
                        <span className="text-white font-serif font-bold text-lg">L</span>
                    </div>
                    <span className="font-serif text-xl font-bold text-white tracking-tight">
                        LumiHub
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-black">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-white/40 font-mono text-[10px] uppercase tracking-widest">Menu Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        className="data-[active=true]:bg-white data-[active=true]:text-black data-[active=true]:border-r-0 hover:bg-white/10 hover:text-white transition-all text-gray-400 rounded-none border-l-2 border-transparent data-[active=true]:border-transparent"
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
                        <SidebarGroupLabel className="text-white/40 px-2 text-[10px] font-mono font-semibold uppercase tracking-widest mb-2">Administração</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive('/admin')}
                                        className="text-white data-[active=true]:bg-white data-[active=true]:text-black hover:bg-white/10 hover:text-white transition-all rounded-none"
                                    >
                                        <Link to="/admin">
                                            <ShieldCheck className="h-4 w-4" />
                                            <span className="font-mono text-xs uppercase tracking-wider">Central Admin</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                <SidebarGroup className="mt-auto pb-4">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={onStartTour}
                                    className="text-gray-400 hover:text-white hover:bg-white/5 transition-all w-full justify-start rounded-none"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                    <span className="font-mono text-xs uppercase tracking-wider">Ajuda / Tutorial</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>

            <SidebarFooter className="border-t border-white/20 p-4 bg-black">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <Avatar className="h-8 w-8 border border-white/20 rounded-none">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-black text-white font-mono rounded-none">U</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-white truncate font-serif">{user?.user_metadata?.full_name || 'Usuário'}</span>
                        <span className="text-[10px] text-white/40 truncate font-mono">{user?.email}</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10 rounded-none uppercase text-xs tracking-wider font-mono border border-transparent hover:border-white/20"
                    onClick={signOut}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                </Button>
            </SidebarFooter>
        </Sidebar>
    )
}
