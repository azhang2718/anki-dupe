import { useLocation, useOutlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import TitleBar from './TitleBar'
import GamificationProvider from './GamificationProvider'
import PageErrorBoundary from './PageErrorBoundary'
import CosmicBackground from './ui/CosmicBackground'

function AnimatedOutlet() {
  const location = useLocation()
  const outlet = useOutlet()

  // Fade-in only (no exit animation). AnimatePresence mode="wait" can leave
  // the main area stuck at opacity:0 when navigating quickly between pages.
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="min-h-full"
    >
      <PageErrorBoundary>{outlet}</PageErrorBoundary>
    </motion.div>
  )
}

export default function Layout() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-transparent relative">
      <CosmicBackground />
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 relative">
          <AnimatedOutlet />
        </main>
      </div>
      <GamificationProvider />
    </div>
  )
}
