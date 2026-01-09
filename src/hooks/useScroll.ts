import { useEffect, useState } from 'react';
import { useMotionValue, useTransform, MotionValue } from 'framer-motion';

export const useScroll = () => {
  const scrollY = useMotionValue(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      scrollY.set(window.scrollY);
      setIsScrolling(true);

      // Reset scrolling flag after scroll ends
      setTimeout(() => setIsScrolling(false), 150);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  return { scrollY, isScrolling };
};

/**
 * useParallax: Create parallax effects based on scroll
 * @param scrollY - Motion value from useScroll
 * @param range - [start, end] scroll range
 * @param offset - [start, end] transform range (e.g., [0, 100])
 */
export const useParallax = (scrollY: MotionValue<number>, range: [number, number], offset: [number, number]) => {
  return useTransform(scrollY, range, offset);
};
