import { EDGES } from '@/lib/simulation'
import type { GridNode } from '@/types/models'
import { usesReducedMotion } from '@/lib/utils'

function loadColor(node: GridNode) {
  if (node.critical && node.load >= 85) return '#E84855'
  if (node.load >= 80) return '#E84855'
  if (node.load >= 65) return '#F4A623'
  return '#00C9A7'
}

export default function GridTopology({
  nodes,
  onSelect,
}: {
  nodes: GridNode[]
  onSelect: (n: GridNode) => void
}) {
  const reduce = usesReducedMotion()
  const byId = (id: string) => nodes.find((n) => n.id === id)!

  return (
    <svg viewBox="0 0 720 560" className="h-full w-full" role="group" aria-label="Grid topology with seven nodes">
      <defs>
        <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.05)" />
        </pattern>
      </defs>
      <rect width="720" height="560" fill="url(#dots)" />

      {EDGES.map((e) => {
        const a = byId(e.from)
        const b = byId(e.to)
        return (
          <g key={e.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,201,167,0.25)" strokeWidth={1.6} />
            {!reduce && (
              <circle r={3.2} fill="#00C9A7">
                <animateMotion dur="2.4s" repeatCount="indefinite" path={`M${a.x},${a.y} L${b.x},${b.y}`} />
              </circle>
            )}
          </g>
        )
      })}

      {nodes.map((n) => {
        const r = 16 + (n.load / 100) * 16
        const color = loadColor(n)
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            className="cursor-pointer focus-ring"
            tabIndex={0}
            role="button"
            aria-label={`${n.name}, load ${n.load} percent. Open details.`}
            onClick={() => onSelect(n)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault()
                onSelect(n)
              }
            }}
          >
            {n.critical && <circle r={r + 8} fill="none" stroke="#E84855" strokeWidth={1.5} strokeDasharray="4 4" />}
            <circle r={r} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2}>
              {!reduce && <animate attributeName="r" values={`${r};${r + 3};${r}`} dur="2.2s" repeatCount="indefinite" />}
            </circle>
            <text textAnchor="middle" dy="-2" fontSize="11" fontWeight="700" fill="#fff">
              {n.short}
            </text>
            <text textAnchor="middle" dy="12" fontSize="10" fill={color}>
              {n.load}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}