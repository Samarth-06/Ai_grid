import { useEffect, useRef, useState } from 'react'
import { useSimulation } from '@/hooks/useSimulation'
import ShapWaterfall from '@/components/ShapWaterfall'
import type { AgentDecision } from '@/types/models'
import { cn } from '@/lib/utils'

type ChatMsg = { role: 'operator' | 'gridmind'; text: string }

function buildExplanation(d: AgentDecision): string {
  const top = d.shap[0]
  return `I chose to ${d.action.toLowerCase()} with ${d.confidence}% confidence. The dominant factor was "${top.feature}" (${top.value > 0 ? '+' : ''}${top.value}), which pushed toward this action. This rebalancing avoids an estimated ${d.co2Delta}kg of CO₂ while keeping critical loads within safe margins.`
}

export default function XaiPage() {
  const { decisions } = useSimulation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const streamRef = useRef<number | null>(null)

  useEffect(() => {
    if (!selectedId && decisions.length) setSelectedId(decisions[0].id)
  }, [decisions, selectedId])

  const selected = decisions.find((d) => d.id === selectedId) ?? decisions[0]

  useEffect(() => {
    if (!selected) return
    if (streamRef.current) window.clearInterval(streamRef.current)
    const full = buildExplanation(selected)
    let i = 0
    setStreaming('')
    setChat([])
    streamRef.current = window.setInterval(() => {
      i += 3
      setStreaming(full.slice(0, i))
      if (i >= full.length && streamRef.current) {
        window.clearInterval(streamRef.current)
      }
    }, 20)
    return () => {
      if (streamRef.current) window.clearInterval(streamRef.current)
    }
  }, [selectedId, selected])

  const ask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selected) return
    const q = input.trim()
    setChat((c) => [...c, { role: 'operator', text: q }])
    setInput('')
    window.setTimeout(() => {
      const top = selected.shap[0]
      const ans = `The action "${selected.action}" was primarily driven by ${top.feature}. If that feature had been lower, the agent would likely have deferred to battery discharge instead. Net carbon impact: −${selected.co2Delta}kg.`
      setChat((c) => [...c, { role: 'gridmind', text: ans }])
    }, 500)
  }

  if (!selected) {
    return <div className="px-6 py-20 text-center text-white/50">Loading decisions…</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">Explainability Hub</h1>
        <p className="mt-1 text-white/55">Inspect every agent decision, its SHAP breakdown, and ask follow-up questions.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Decision history */}
        <div className="lg:col-span-2">
          <div className="glass max-h-[640px] overflow-y-auto rounded-2xl p-3">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/45">Decision history</p>
            <ul className="space-y-2">
              {decisions.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedId(d.id)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition-colors focus-ring',
                      d.id === selectedId ? 'border-teal/50 bg-teal/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                    )}
                  >
                    <div className="flex items-center justify-between text-[11px] text-white/40">
                      <span className="font-mono">{new Date(d.timestamp).toLocaleTimeString()}</span>
                      <span className="rounded-full bg-teal/15 px-2 py-0.5 font-semibold text-teal">{d.confidence}%</span>
                    </div>
                    <div className="mt-1 text-sm">{d.icon} {d.action}</div>
                    <div className="mt-2 space-y-1">
                      {d.shap.map((s) => (
                        <div key={s.feature} className="flex items-center gap-2">
                          <span className="h-1.5 rounded bg-teal" style={{ width: `${Math.abs(s.value) * 80}px` }} />
                          <span className="text-[10px] text-white/40">{s.feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-[11px] text-amber">CO₂ −{d.co2Delta}kg</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Deep dive */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">{selected.icon} {selected.action}</h2>
            <p className="mt-1 text-xs text-white/45">SHAP waterfall — contribution of each feature to the decision</p>
            <div className="mt-4">
              <ShapWaterfall shap={selected.shap} />
            </div>

            <div className="mt-6 rounded-xl border-l-2 border-teal bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">GridMind explanation</p>
              <p className="mt-2 text-sm text-white/80">{streaming}<span className="animate-pulseDot">▍</span></p>
            </div>

            <div className="mt-4 space-y-3">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[85%] rounded-xl px-4 py-2.5 text-sm',
                    m.role === 'operator' ? 'ml-auto bg-teal/15 text-white' : 'border-l-2 border-narrator bg-white/[0.03]',
                  )}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={ask} className="mt-4 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this decision…"
                aria-label="Ask a follow-up question about this decision"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus-ring"
              />
              <button
                type="submit"
                className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-navy hover:shadow-[0_0_20px_rgba(0,201,167,0.5)] focus-ring"
              >
                Ask
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}