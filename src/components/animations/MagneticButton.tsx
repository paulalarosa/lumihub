import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { ReactNode } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  strength?: number;
  href?: string;
  target?: string;
  rel?: string;
}

export const MagneticButton = ({
  children,
  onClick,
  className = '',
  strength = 0.3,
  href,
  target,
  rel,
}: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const button = ref.current.getBoundingClientRect();
    const center = {
      x: button.left + button.width / 2,
      y: button.top + button.height / 2,
    };

    const distance = {
      x: e.clientX - center.x,
      y: e.clientY - center.y,
    };

    const magnitude = Math.sqrt(distance.x ** 2 + distance.y ** 2);
    const maxDistance = 100; // Magnetic pull range

    if (magnitude < maxDistance) {
      setPosition({
        x: distance.x * strength,
        y: distance.y * strength,
      });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const motionElement = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`cursor-pointer inline-block ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className="inline-block">
        {motionElement}
      </a>
    );
  }

  return motionElement;
};
