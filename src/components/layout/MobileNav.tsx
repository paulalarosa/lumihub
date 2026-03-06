import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const menuItems = [
  { label: 'RECURSOS', href: '/recursos' },
  { label: 'PLANOS', href: '/planos' },
  { label: 'BLOG', href: '/blog' },
  { label: 'CONTATO', href: '/contato' },
]

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleNavigate = (href: string) => {
    setIsOpen(false)
    navigate(href)
  }

  const overlayContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] md:hidden flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#050505] border border-white/20 flex items-center justify-center">
                <span className="font-mono font-bold text-lg text-white">
                  K
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 w-12 h-12 flex items-center justify-center text-white hover:bg-white/5 rounded-full transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="text-white text-3xl font-light hover:text-gray-400 transition-colors text-center w-full focus:outline-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.4,
                  ease: 'easeOut',
                }}
              >
                {item.label}
              </motion.button>
            ))}

            <motion.button
              onClick={() => handleNavigate('/cadastro')}
              className="mt-12 px-8 py-4 bg-white text-black font-mono font-bold text-[10px] tracking-widest uppercase hover:bg-white/90 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              ACESSO KONTROL
            </motion.button>

            <motion.div
              className="flex gap-4 mt-8 font-mono text-[10px] tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <button className="text-white border-b border-white/50 pb-1">
                PTBR
              </button>
              <button className="text-gray-600 hover:text-gray-400 transition-colors pb-1">
                ENUS
              </button>
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 w-12 h-12 flex items-center justify-center text-white hover:bg-white/5 rounded-full transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {createPortal(overlayContent, document.body)}
    </>
  )
}
