import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ConfirmationNotificationProps {
  message: string
  isVisible: boolean
  onComplete: () => void
}

const ConfirmationNotification = ({
  message,
  isVisible,
  onComplete,
}: ConfirmationNotificationProps) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onComplete, 300)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.3 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 20,
            },
          }}
          exit={{
            opacity: 0,
            y: -50,
            scale: 0.8,
            transition: { duration: 0.3 },
          }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <motion.div
            initial={{ boxShadow: '0 0 0 rgba(34, 197, 94, 0)' }}
            animate={{
              boxShadow: [
                '0 0 0 0px rgba(34, 197, 94, 0.7)',
                '0 0 0 10px rgba(34, 197, 94, 0)',
                '0 0 0 20px rgba(34, 197, 94, 0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 min-w-max"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: 2,
                repeatDelay: 1,
              }}
            >
              <CheckCircle className="h-6 w-6" />
            </motion.div>

            <span className="font-semibold text-lg">{message}</span>

            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmationNotification
