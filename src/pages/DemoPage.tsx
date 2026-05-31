import { useState } from 'react'
import { useSimulation } from '@/hooks/useSimulation'
import GridTopology from '@/components/GridTopology'
import DecisionLog from '@/components/DecisionLog'
import MetricsRow from '@/components/MetricsRow'
import NodeModal from '@/components/NodeModal'
import { EVENT_PRESETS } from '@/lib/simulation'
import type { GridNode } from '@/types/models'

export default function DemoPage() {
  const { decisions, nodes, metrics, injectEvent } = useSimulation()
  const [selected, setSelected] = useState<GridNode | null>(null)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">Live Simulation</h1>
        <p className="mt-1 text-white/55">Interactive grid topology with a reinforcement agent balancing load in real time.</p>
      </header>

      <div className="mb-6">
        <MetricsRow metrics={metrics} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-3">
            <div className="aspect-[720/560] w-full">
              <GridTopology nodes={nodes} onSelect={setSelected} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EVENT_PRESETS.map((e) => (
              <button
                key={e.key}
                onClick={() => injectEvent(e.action)}
                className="glass rounded-xl px-3 py-3 text-sm font-medium transition-shadow hover:shadow-[0_0_20px_rgba(0,201,167,0.35)] focus-ring"
              >
                <span className="mr-1.5">{e.icon}</span>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[560px] lg:col-span-2">
          <DecisionLog decisions={decisions} />
        </div>
      </div>

      {selected && <NodeModal node={selected} decisions={decisions} onClose={() => setSelected(null)} />}
    </div>
  )
}