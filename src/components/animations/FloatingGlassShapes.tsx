import { motion } from 'framer-motion'

export const FloatingGlassShapes = () => {
  const shapes = [
    {
      id: 1,
      size: 350,
      top: '5%',
      right: '10%',
      duration: 8,
      delay: 0,
      type: 'circle',
    },
    {
      id: 2,
      size: 250,
      top: '40%',
      left: '5%',
      duration: 10,
      delay: 1,
      type: 'circle',
    },
    {
      id: 3,
      size: 300,
      bottom: '15%',
      right: '20%',
      duration: 9,
      delay: 0.5,
      type: 'circle',
    },
    {
      id: 4,
      size: 180,
      top: '60%',
      right: '5%',
      duration: 7,
      delay: 2,
      type: 'hexagon',
    },
    {
      id: 5,
      size: 220,
      bottom: '30%',
      left: '15%',
      duration: 11,
      delay: 1.5,
      type: 'circle',
    },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            right: shape.right,
            left: shape.left,
            bottom: shape.bottom,
          }}
          animate={{
            y: [0, 40, 0],
            x: [0, 25, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `
                radial-gradient(
                  ellipse at 30% 30%,
                  rgba(255, 255, 255, 0.08) 0%,
                  rgba(255, 255, 255, 0.03) 40%,
                  rgba(255, 255, 255, 0) 70%
                )
              `,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(40px)',
              boxShadow: `
                0 0 80px rgba(255, 255, 255, 0.05),
                inset 0 0 60px rgba(255, 255, 255, 0.02),
                inset -20px -20px 60px rgba(0, 0, 0, 0.1)
              `,
            }}
          />

          {}
          <div
            className="absolute top-[10%] left-[10%] w-[40%] h-[30%] rounded-full"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
              filter: 'blur(10px)',
            }}
          />
        </motion.div>
      ))}

      {}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            top: `${15 + i * 10}%`,
            left: `${10 + i * 12}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4 + i * 0.5,
            delay: i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
