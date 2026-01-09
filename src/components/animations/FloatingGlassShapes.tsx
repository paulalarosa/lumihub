import { motion } from 'framer-motion';

export const FloatingGlassShapes = () => {
  const shapes = [
    { id: 1, size: 300, top: '10%', right: '5%', duration: 6, delay: 0 },
    { id: 2, size: 200, top: '50%', left: '8%', duration: 8, delay: 1 },
    { id: 3, size: 250, bottom: '10%', right: '15%', duration: 7, delay: 0.5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute rounded-full opacity-10 blur-3xl"
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            right: shape.right,
            left: shape.left,
            bottom: shape.bottom,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0))',
            boxShadow: '0 0 80px rgba(255,255,255,0.4), inset -2px -2px 20px rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          }}
          animate={{
            y: [0, 30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
