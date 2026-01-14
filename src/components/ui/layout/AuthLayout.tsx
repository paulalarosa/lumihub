import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-[#050505] selection:bg-[#00e5ff]/30 selection:text-[#00e5ff]">
            {/* Left Side - Editorial Image (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050505]/80 z-10" />
                <div className="absolute inset-0 bg-black/20 z-10" />

                {/* Editorial Image */}
                <img
                    src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1935&auto=format&fit=crop"
                    alt="Beauty Editorial"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                {/* Content Overlay */}
                <div className="relative z-20 flex flex-col justify-between h-full p-16 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00e5ff]/20 to-transparent border border-[#00e5ff]/30 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <span className="text-xl font-serif font-bold text-white">L</span>
                        </div>
                        <span className="font-serif text-xl tracking-wide">Lumi</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <blockquote className="font-serif text-4xl leading-tight font-light italic">
                            "Gerencie seu império de beleza com a inteligência que ele merece."
                        </blockquote>
                        <p className="text-white/60 font-light">
                            Junte-se a milhares de profissionais que elevaram o nível de seus negócios.
                        </p>
                    </div>

                    <div className="flex gap-4 text-sm text-white/40 font-light">
                        <span>© 2024 Lumi</span>
                        <span>•</span>
                        <span>Privacidade</span>
                        <span>•</span>
                        <span>Termos</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Content */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#00e5ff]/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8 relative z-10"
                >
                    <div className="text-center space-y-2 lg:text-left">
                        <h1 className="text-3xl lg:text-4xl font-serif font-light text-white tracking-tight">
                            {title}
                        </h1>
                        <p className="text-[#C0C0C0] font-light">
                            {subtitle}
                        </p>
                    </div>

                    {children}
                </motion.div>
            </div>
        </div>
    );
}
