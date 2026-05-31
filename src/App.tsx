import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import DemoPage from './pages/DemoPage'
import FlowPage from './pages/FlowPage'
import AnalyticsPage from './pages/AnalyticsPage'
import XaiPage from './pages/XaiPage'
import IntegrationsPage from './pages/IntegrationsPage'
import { usesReducedMotion } from './lib/utils'

function PageWrap({ children }: { children: React.ReactNode }) {
  const reduce = usesReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? undefined : { opacity: 0, x: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col bg-navy text-white">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrap><LandingPage /></PageWrap>} />
            <Route path="/demo" element={<PageWrap><DemoPage /></PageWrap>} />
            <Route path="/flow" element={<PageWrap><FlowPage /></PageWrap>} />
            <Route path="/analytics" element={<PageWrap><AnalyticsPage /></PageWrap>} />
            <Route path="/xai" element={<PageWrap><XaiPage /></PageWrap>} />
            <Route path="/integrations" element={<PageWrap><IntegrationsPage /></PageWrap>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}