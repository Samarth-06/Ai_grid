import { useMemo, useState, useCallback } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { AnimatePresence } from 'framer-motion'
import AgentNode, { type AgentNodeData } from '@/components/flow/AgentNode'
import Inspector from '@/components/flow/Inspector'
import { useSimulation } from '@/hooks/useSimulation'

const nodeTypes = { agent: AgentNode }

export default function FlowPage() {
  const { decisions } = useSimulation()
  const [selected, setSelected] = useState<string | null>(null)
  const [showLabels, setShowLabels] = useState(true)

  const latest = decisions[0]

  const nodes: Node<AgentNodeData>[] = useMemo(
    () => [
      { id: 'ingest', type: 'agent', position: { x: 0, y: 40 }, data: { title: 'DATA INGESTION', color: 'ingest', metrics: [{ label: 'sensors', value: '128' }, { label: 'last update', value: '0.4s ago' }] } },
      { id: 'forecaster', type: 'agent', position: { x: 280, y: 40 }, data: { title: 'FORECASTER', color: 'forecast', metrics: [{ label: 'prediction', value: '487 kW' }, { label: 'horizon', value: '22 min' }] } },
      { id: 'ppo', type: 'agent', position: { x: 580, y: 160 }, data: { title: 'PPO AGENT', color: 'teal', large: true, metrics: [{ label: 'action', value: latest ? latest.action.slice(0, 14) + '…' : 'idle' }, { label: 'confidence', value: latest ? `${latest.confidence}%` : '—' }, { label: 'reward', value: '284' }] } },
      { id: 'simulator', type: 'agent', position: { x: 880, y: 40 }, data: { title: 'GRID SIMULATOR', color: 'gray', metrics: [{ label: 'nodes', value: '7' }, { label: 'edges', value: '7' }, { label: 'timestep', value: '50ms' }] } },
      { id: 'shap', type: 'agent', position: { x: 880, y: 280 }, data: { title: 'SHAP EXPLAINER', color: 'amber', metrics: [{ label: 'top feature', value: 'demand' }, { label: 'latency', value: '38ms' }] } },
      { id: 'narrator', type: 'agent', position: { x: 580, y: 380 }, data: { title: 'LLM NARRATOR', color: 'narrator', metrics: [{ label: 'status', value: 'generating…' }] } },
    ],
    [latest],
  )

  const edges: Edge[] = useMemo(
    () => [
      { id: 'a', source: 'ingest', target: 'forecaster', animated: true, label: showLabels ? 'sensor stream' : undefined, style: { stroke: '#3B82F6' }, labelStyle: { fill: '#fff', fontSize: 10 }, labelBgStyle: { fill: '#0A0F2C' } },
      { id: 'b', source: 'forecaster', target: 'ppo', animated: true, label: showLabels ? 'demand forecast: 487kW' : undefined, style: { stroke: '#8B5CF6' }, labelStyle: { fill: '#fff', fontSize: 10 }, labelBgStyle: { fill: '#0A0F2C' } },
      { id: 'c', source: 'ppo', target: 'simulator', animated: true, label: showLabels ? 'action' : undefined, style: { stroke: '#00C9A7' }, labelStyle: { fill: '#fff', fontSize: 10 }, labelBgStyle: { fill: '#0A0F2C' } },
      { id: 'd', source: 'simulator', target: 'shap', animated: true, label: showLabels ? 'state delta' : undefined, style: { stroke: '#9CA3AF' }, labelStyle: { fill: '#fff', fontSize: 10 }, labelBgStyle: { fill: '#0A0F2C' } },
      { id: 'e', source: 'shap', target: 'narrator', animated: true, label: showLabels ? 'explanation' : undefined, style: { stroke: '#F4A623' }, labelStyle: { fill: '#fff', fontSize: 10 }, labelBgStyle: { fill: '#0A0F2C' } },
      { id: 'f', source: 'narrator', target: 'ppo', animated: true, label: showLabels ? 'feedback' : undefined, style: { stroke: '#22C55E' }, labelStyle: { fill: '#fff', fontSize: 10 }, labelBgStyle: { fill: '#0A0F2C' } },
    ],
    [showLabels],
  )

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => setSelected(node.id), [])

  const selNode = nodes.find((n) => n.id === selected)
  const stateForNode: Record<string, unknown> = selNode
    ? { id: selNode.id, title: selNode.data.title, ...Object.fromEntries(selNode.data.metrics.map((m) => [m.label, m.value])) }
    : {}

  return (
    <div className="relative h-[calc(100vh-64px)] w-full">
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => setShowLabels((v) => !v)}
          className="glass rounded-lg px-3 py-2 text-xs font-medium hover:bg-white/10 focus-ring"
        >
          {showLabels ? 'Hide edge labels' : 'Show edge labels'}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-navy"
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="rgba(255,255,255,0.08)" />
        <Controls className="!border-white/10 !bg-white/5 !backdrop-blur-xl" />
      </ReactFlow>

      <AnimatePresence>
        {selNode && (
          <Inspector
            title={selNode.data.title}
            state={stateForNode}
            decisions={decisions}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}