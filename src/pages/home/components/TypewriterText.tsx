import { motion } from 'framer-motion'

export const TypewriterText = ({
  text,
  delayOffset = 0,
}: {
  text: string
  delayOffset?: number
}) => {
  return (
    <>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delayOffset + index * 0.04, duration: 0.1 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </>
  )
}
