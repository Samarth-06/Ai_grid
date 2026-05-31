import { Handle, Position } from 'reactflow'

export type AgentNodeData = {
  title: string
  color: string
  metrics: { label: string; value: string }[]
  large?: boolean
}

const colorMap: Record<string, string> = {
  ingest: '#3B82F6',
  forecast: '#8B5CF6',
  teal: '#00C9A7',
  gray: '#9CA3AF',
  amber: '#F4A623',
  narrator: '#22C55E',
}

export default function AgentNode({ data }: { data: AgentNodeData }) {
  const c = colorMap[data.color] ?? '#00C9A7'
  return (
    <div
      className="rounded-2xl border p-4 backdrop-blur-xl"
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderColor: `${c}66`,
        boxShadow: `0 0 24px ${c}22`,
        width: data.large ? 220 : 190,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: c }} />
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
        <span className="text-xs font-bold tracking-wide text-white">{data.title}</span>
      </div>
      <div className="space-y-1">
        {data.metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between text-[11px]">
            <span className="text-white/45">{m.label}</span>
            <span className="font-mono font-medium text-white/85">{m.value}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: c }} />
    </div>
  )
}