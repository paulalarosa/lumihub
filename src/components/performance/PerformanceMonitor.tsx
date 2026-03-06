import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const PerformanceMonitor = ({
  enabled = false,
}: {
  enabled?: boolean
}) => {
  const [fps, setFps] = useState(60)
  const [memory, setMemory] = useState(0)

  useEffect(() => {
    if (!enabled) return

    let lastTime = performance.now()
    let frames = 0
    let animationId: number

    const measureFPS = () => {
      frames++
      const currentTime = performance.now()

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)))
        frames = 0
        lastTime = currentTime

        // Measure memory (if available)
        if ((performance as any).memory) {
          const memoryMB = (performance as any).memory.usedJSHeapSize / 1048576
          setMemory(Math.round(memoryMB))
        }
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => cancelAnimationFrame(animationId)
  }, [enabled])

  if (!enabled) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 z-50 p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg font-mono text-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${fps >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-white">FPS: {fps}</span>
          </div>
          {memory > 0 && (
            <div className="text-white/60">Memory: {memory}MB</div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
