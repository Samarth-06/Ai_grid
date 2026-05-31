import { useEffect, useRef, useState, useCallback } from 'react'
import { generateDecision, NODES } from '@/lib/simulation'
import type { AgentDecision, GridMetrics, GridNode } from '@/types/models'

export function useSimulation() {
  const [decisions, setDecisions] = useState<AgentDecision[]>([])
  const [nodes, setNodes] = useState<GridNode[]>(() => NODES.map((n) => ({ ...n })))
  const [metrics, setMetrics] = useState<GridMetrics>({
    stability: 98.6,
    co2Saved: 142.7,
    reward: 284,
    activeNodes: 7,
  })
  const timer = useRef<number | null>(null)

  const applyDecision = useCallback((dec: AgentDecision) => {
    setDecisions((prev) => [dec, ...prev].slice(0, 50))
    setMetrics((m) => ({
      stability: Math.min(99.9, Math.max(94, m.stability + (Math.random() - 0.45) * 0.6)),
      co2Saved: parseFloat((m.co2Saved + dec.co2Delta).toFixed(1)),
      reward: m.reward + Math.round((Math.random() - 0.4) * 4),
      activeNodes: 7,
    }))
    if (dec.nodeId) {
      setNodes((ns) =>
        ns.map((n) =>
          n.id === dec.nodeId
            ? { ...n, load: Math.min(100, Math.max(15, Math.round(n.load + (Math.random() - 0.5) * 22))) }
            : n,
        ),
      )
    }
  }, [])

  const injectEvent = useCallback(
    (action: { action: string; icon: string; nodeId: string }) => {
      window.setTimeout(() => {
        applyDecision(generateDecision(action))
      }, 600 + Math.random() * 900)
    },
    [applyDecision],
  )

  useEffect(() => {
    // seed
    applyDecision(generateDecision())
    timer.current = window.setInterval(() => {
      applyDecision(generateDecision())
    }, 2000)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { decisions, nodes, metrics, injectEvent }
}