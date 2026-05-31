import type { GridMetrics } from '@/types/models'

export default function MetricsRow({ metrics }: { metrics: GridMetrics }) {
  const cards = [
    { label: 'Grid Stability', value: `${metrics.stability.toFixed(1)}%`, color: 'text-teal' },
    { label: 'CO₂ Saved Today', value: `${metrics.co2Saved.toFixed(1)}kg`, color: 'text-narrator' },
    { label: 'Agent Reward', value: `${metrics.reward}`, color: 'text-amber' },
    { label: 'Active Nodes', value: `${metrics.activeNodes}`, color: 'text-white' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="glass rounded-xl p-4">
          <div className={`text-2xl font-extrabold ${c.color}`}>{c.value}</div>
          <div className="mt-1 text-xs text-white/55">{c.label}</div>
        </div>
      ))}
    </div>
  )
}