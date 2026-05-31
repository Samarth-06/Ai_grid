const ITEMS = [
  '⚡ Rerouted 18kW Industrial→Battery',
  '🌿 CO₂ saved: 2.3kg',
  '✅ Hospital node: 99.4% stable',
  '⚠️ Demand spike detected → compensating via Wind farm',
  '🔋 Battery charged to 64%',
  '☀️ Solar dispatch +9kW',
  '🔀 Substation A rebalanced',
]

export default function Ticker() {
  const row = [...ITEMS, ...ITEMS]
  return (
    <div className="overflow-hidden border-y border-white/10 bg-white/[0.03] py-3" aria-label="Live agent decision ticker">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-6">
        {row.map((t, i) => (
          <span key={i} className="text-sm font-medium text-white/70">
            {t}
            <span className="ml-10 text-teal/40">|</span>
          </span>
        ))}
      </div>
    </div>
  )
}