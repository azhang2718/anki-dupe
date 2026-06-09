import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import { X } from '@phosphor-icons/react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: 'sm' | 'md' | 'lg'
}

const widthClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

// Emil: modals keep transform-origin: center (not origin-aware like popovers).
// Enter from scale(0.95) not scale(0) — nothing appears from nothing.
// Custom easing: cubic-bezier(0.23, 1, 0.32, 1) for snappy, physical feel.
// Exit is faster than enter (asymmetric timing).
export default function Modal({ open, onClose, title, children, width = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${widthClasses[width]} bg-white rounded-lg shadow-modal p-6`}
            initial={{ opacity: 0, scale: 0.95, y: 'calc(-50% + 8px)' }}
            animate={{ opacity: 1, scale: 1,    y: '-50%' }}
            exit={{    opacity: 0, scale: 0.97,  y: 'calc(-50% + 4px)' }}
            transition={{
              enter: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
              exit:  { duration: 0.14, ease: [0.23, 1, 0.32, 1] },
              default: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
            }}
          >
            {title && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-700">{title}</h2>
                <button
                  onClick={onClose}
                  className="no-drag p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-surface-medium transition-colors duration-150"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
