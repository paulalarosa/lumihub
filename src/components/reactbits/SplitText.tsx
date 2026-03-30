import React from 'react'
import { motion, Variants } from 'framer-motion'

export interface SplitTextProps {
  text: string
  className?: string
  delay?: number // ms
  duration?: number // s
  ease?: string | number[] // framer-motion transition ease
  splitType?: 'chars' | 'words' | 'lines'
  from?: Record<string, any>
  to?: Record<string, any>
  threshold?: number
  rootMargin?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  textAlign?: React.CSSProperties['textAlign']
  onLetterAnimationComplete?: () => void
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 0.5,
  ease = 'easeOut',
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  tag = 'p',
  textAlign = 'center',
  onLetterAnimationComplete,
}) => {
  const Tag = motion[tag] as any

  const variants: Variants = {
    hidden: from,
    visible: (i: number) => ({
      ...to,
      transition: {
        delay: (i * delay) / 1000,
        duration: duration,
        ease: ease,
      },
    }),
  }

  const renderContent = () => {
    if (splitType === 'words') {
      return text.split(' ').map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap">
          <motion.span
            custom={i}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: threshold }}
            onAnimationComplete={
              i === text.split(' ').length - 1
                ? onLetterAnimationComplete
                : undefined
            }
            className="inline-block"
          >
            {word}
          </motion.span>
          <span className="inline-block">&nbsp;</span>
        </span>
      ))
    }

    if (splitType === 'chars') {
      return text.split('').map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: threshold }}
          onAnimationComplete={
            i === text.length - 1 ? onLetterAnimationComplete : undefined
          }
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))
    }

    // Default to 'lines' if not handled or splitType === 'lines'
    // Simple line split by \n for now as actual layout-based line splitting is very complex in React
    return text.split('\n').map((line, i) => (
      <motion.span
        key={i}
        custom={i}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: threshold }}
        className="block"
      >
        {line}
      </motion.span>
    ))
  }

  return (
    <Tag
      className={`inline-block overflow-hidden ${className}`}
      style={{ textAlign, width: '100%' }}
    >
      {renderContent()}
    </Tag>
  )
}

export default SplitText
