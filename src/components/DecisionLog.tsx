import { AnimatePresence, motion } from 'framer-motion'
import type { AgentDecision } from '@/types/models'

export default function DecisionLog({ decisions }: { decisions: AgentDecision[] }) {
  return (
    <div className="glass flex h-full flex-col rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold">Agent Decision Log</h3>
        <span className="flex items-center gap-1.5 text-xs text-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulseDot" /> streaming
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
        <AnimatePresence initial={false}>
          {decisions.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg bg-white/[0.03] p-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between text-white/40">
                <span>{new Date(d.timestamp).toLocaleTimeString()}</span>
                <span className="text-teal">conf {d.confidence}%</span>
              </div>
              <div className="mt-1 text-white/85">{d.icon} {d.action}</div>
              <div className="mt-1 text-amber">CO₂ −{d.co2Delta}kg</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}