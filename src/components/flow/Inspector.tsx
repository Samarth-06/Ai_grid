import { motion } from 'framer-motion'
import type { AgentDecision } from '@/types/models'

export default function Inspector({
  title,
  state,
  decisions,
  onClose,
}: {
  title: string
  state: Record<string, unknown>
  decisions: AgentDecision[]
  onClose: () => void
}) {
  return (
    <motion.aside
      initial={{ x: 360 }}
      animate={{ x: 0 }}
      exit={{ x: 360 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="glass absolute right-0 top-0 z-20 flex h-full w-full max-w-sm flex-col border-l border-white/10"
      role="dialog"
      aria-label={`${title} inspector`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-bold">{title}</h3>
        <button onClick={onClose} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 focus-ring" aria-label="Close inspector">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">Agent State</p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-teal">
{JSON.stringify(state, null, 2)}
          </pre>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">Last 10 decisions</p>
          <ul className="space-y-2">
            {decisions.slice(0, 10).map((d) => (
              <li key={d.id} className="rounded-lg bg-white/[0.03] px-3 py-2 font-mono text-[11px]">
                <span className="text-white/40">{new Date(d.timestamp).toLocaleTimeString()}</span>
                <div className="text-white/80">{d.icon} {d.action}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.aside>
  )
}