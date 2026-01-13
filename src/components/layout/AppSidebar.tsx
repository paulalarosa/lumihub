import {
    Calendar,
    Home,
    Settings,
    User,
    LogOut,
    Users,
    Briefcase,
    CreditCard,
    Sparkles
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

export function AppSidebar() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const { isMobile } = useSidebar();

    // Highlight active
    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <Sidebar className="border-r border-white/10 bg-[#050505]/95 backdrop-blur-xl">
            <SidebarHeader className="border-b border-white/10 p-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e5ff] to-[#7000ff] flex items-center justify-center">
                        <span className="text-white font-bold text-lg">L</span>
                    </div>
                    <span className="font-serif text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        LumiHub
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-white/50">Menu Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                        className="data-[active=true]:bg-[#00e5ff]/10 data-[active=true]:text-[#00e5ff] hover:bg-white/5 hover:text-white transition-all text-gray-400"
                                    >
                                        <Link to={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-white truncate">{user?.user_metadata?.full_name || 'Usuário'}</span>
                        <span className="text-xs text-white/50 truncate">{user?.email}</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={signOut}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                </Button>
            </SidebarFooter>
        </Sidebar>
    )
}
