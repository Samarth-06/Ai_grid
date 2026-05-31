import type { ShapFeature } from '@/types/models'

export default function ShapWaterfall({ shap }: { shap: ShapFeature[] }) {
  let cumulative = 50
  const rows = shap.map((s) => {
    const start = cumulative
    cumulative += s.value * 30
    return { ...s, start, end: cumulative }
  })
  const maxX = 100

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const left = Math.min(r.start, r.end)
        const width = Math.abs(r.end - r.start)
        const positive = r.value >= 0
        return (
          <div key={r.feature} className="flex items-center gap-3">
            <span className="w-44 truncate text-xs text-white/60">{r.feature}</span>
            <div className="relative h-5 flex-1 rounded bg-white/5">
              <div
                className="absolute h-5 rounded"
                style={{
                  left: `${(left / maxX) * 100}%`,
                  width: `${(width / maxX) * 100}%`,
                  background: positive ? '#00C9A7' : '#E84855',
                }}
              />
            </div>
            <span className={`w-12 text-right font-mono text-xs ${positive ? 'text-teal' : 'text-critical'}`}>
              {r.value > 0 ? '+' : ''}{r.value}
            </span>
          </div>
        )
      })}
      <div className="flex items-center gap-3 border-t border-white/10 pt-2">
        <span className="w-44 text-xs font-semibold text-white/80">Decision confidence</span>
        <div className="relative h-5 flex-1 rounded bg-white/5">
          <div className="absolute h-5 rounded bg-amber" style={{ width: `${Math.min(100, cumulative)}%` }} />
        </div>
        <span className="w-12 text-right font-mono text-xs text-amber">{Math.round(cumulative)}%</span>
      </div>
    </div>
  )
}