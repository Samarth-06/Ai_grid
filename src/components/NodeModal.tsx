import { motion } from 'framer-motion'
import type { AgentDecision, GridNode } from '@/types/models'
import Sparkline from './Sparkline'

export default function NodeModal({
  node,
  decisions,
  onClose,
}: {
  node: GridNode
  decisions: AgentDecision[]
  onClose: () => void
}) {
  const related = decisions.filter((d) => d.nodeId === node.id).slice(0, 3)
  const latest = related[0]
  const spark = Array.from({ length: 24 }, (_, i) =>
    Math.max(10, node.load + Math.sin(i / 2) * 14 + (Math.random() - 0.5) * 8),
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${node.name} details`}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-full max-w-lg rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">{node.name}</h3>
            <p className="text-sm text-white/55">Current load {node.load}%{node.critical ? ' · Critical node' : ''}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 focus-ring" aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="mt-5 glass rounded-xl p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">24h load</p>
          <Sparkline data={spark} width={440} height={56} />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">Recent agent decisions</p>
          <ul className="space-y-2">
            {related.length === 0 && <li className="text-sm text-white/40">No recent decisions for this node.</li>}
            {related.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                <span>{d.icon} {d.action}</span>
                <span className="font-mono text-xs text-teal">{d.confidence}%</span>
              </li>
            ))}
          </ul>
        </div>

        {latest && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">Top SHAP features (latest)</p>
            <div className="space-y-2">
              {latest.shap.map((s) => (
                <div key={s.feature} className="flex items-center gap-3">
                  <span className="w-40 truncate text-xs text-white/60">{s.feature}</span>
                  <div className="h-2 flex-1 rounded bg-white/5">
                    <div
                      className="h-2 rounded bg-teal"
                      style={{ width: `${Math.min(100, Math.abs(s.value) * 140)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-xs text-white/55">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}