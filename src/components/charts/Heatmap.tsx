import { useState } from 'react'

const NODES = ['Solar', 'Wind', 'Sub-A', 'Hospital', 'Industrial', 'Residential', 'Battery']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function intensity(node: number, hour: number) {
  const base = Math.sin((hour / 24) * Math.PI * 2 + node) * 0.4 + 0.5
  return Math.max(0, Math.min(1, base + (((node * 7 + hour) % 5) / 10)))
}

function color(v: number) {
  if (v > 0.8) return '#E84855'
  if (v > 0.6) return '#F4A623'
  if (v > 0.35) return '#00C9A7'
  return 'rgba(0,201,167,0.25)'
}

export default function Heatmap() {
  const [hover, setHover] = useState<{ node: string; hour: number; v: number } | null>(null)
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          {NODES.map((n, ni) => (
            <div key={n} className="flex items-center gap-1">
              <span className="w-20 shrink-0 text-right text-[11px] text-white/55">{n}</span>
              <div className="flex gap-0.5">
                {HOURS.map((h) => {
                  const v = intensity(ni, h)
                  return (
                    <button
                      key={h}
                      onMouseEnter={() => setHover({ node: n, hour: h, v })}
                      onMouseLeave={() => setHover(null)}
                      className="h-5 w-3.5 rounded-sm focus-ring"
                      style={{ background: color(v) }}
                      aria-label={`${n} at ${h}:00, load ${Math.round(v * 100)}%`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
          <div className="ml-20 mt-1 flex gap-0.5">
            {HOURS.map((h) => (
              <span key={h} className="w-3.5 text-center text-[8px] text-white/30">
                {h % 6 === 0 ? h : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 h-5 text-xs text-white/55">
        {hover ? `${hover.node} · ${hover.hour}:00 — ${Math.round(hover.v * 100)}% load` : 'Hover a cell for details'}
      </div>
    </div>
  )
}