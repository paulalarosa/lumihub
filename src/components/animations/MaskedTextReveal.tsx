import { motion } from "framer-motion";

interface MaskedTextRevealProps {
    text: string;
    className?: string;
    delay?: number;
}

export const MaskedTextReveal = ({ text, className, delay = 0 }: MaskedTextRevealProps) => {
    // Split text into words or Keep as single block if we want line by line
    // For "O BACKSTAGE DO SEU IMPÉRIO", we might want 2 lines as per current design.
    // This component will handle a single line/string.

    return (
        <div className="overflow-hidden">
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{
                    duration: 1.2,
                    ease: [0.16, 1, 0.3, 1], // easeOutQuart approximation or custom "industrial" ease
                    delay: delay
                }}
                className={className}
            >
                {text}
            </motion.div>
        </div>
    );
};
