import { motion } from 'framer-motion'

export const GridLines = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {}
      <div className="absolute top-1/4 left-0 w-full h-[1px] origin-left">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'circOut' }}
          className="w-full h-full bg-white/10"
        />
      </div>
      <div className="absolute top-2/4 left-0 w-full h-[1px] origin-left">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.2, ease: 'circOut' }}
          className="w-full h-full bg-white/10"
        />
      </div>
      <div className="absolute top-3/4 left-0 w-full h-[1px] origin-left">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.4, ease: 'circOut' }}
          className="w-full h-full bg-white/10"
        />
      </div>

      {}
      <div className="absolute top-0 left-1/4 w-[1px] h-full origin-top">
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.1, ease: 'circOut' }}
          className="w-full h-full bg-white/10"
        />
      </div>
      <div className="absolute top-0 left-2/4 w-[1px] h-full origin-top">
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'circOut' }}
          className="w-full h-full bg-white/10"
        />
      </div>
      <div className="absolute top-0 left-3/4 w-[1px] h-full origin-top">
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.5, ease: 'circOut' }}
          className="w-full h-full bg-white/10"
        />
      </div>
    </div>
  )
}
