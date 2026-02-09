import { motion } from "framer-motion";

export const MarqueeStrip = () => {
    return (
        <div className="w-full bg-black border-y border-white/20 py-3 overflow-hidden">
            <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                    repeat: Infinity,
                    duration: 20,
                    ease: "linear",
                }}
            >
                {[...Array(10)].map((_, i) => (
                    <span key={i} className="text-white font-mono text-xs tracking-widest mx-8 select-none">
                        KONTROL SYSTEM /// PROFESSIONAL CRM /// MAKEUP ARTIST OS ///
                    </span>
                ))}
            </motion.div>
        </div>
    );
};
