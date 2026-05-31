import KpiCard from '@/components/KpiCard'
import Co2Chart from '@/components/charts/Co2Chart'
import RewardCurve from '@/components/charts/RewardCurve'
import ShapBar from '@/components/charts/ShapBar'
import Heatmap from '@/components/charts/Heatmap'

const KPIS = [
  { label: 'CO₂ Reduction', value: '11.3%', trend: 2.4, data: [4, 6, 5, 8, 9, 11, 11.3], desc: 'vs 30-day baseline' },
  { label: 'Grid Stability', value: '98.6%', trend: 0.8, data: [96, 97, 97.5, 98, 98.2, 98.6], desc: 'uptime weighted' },
  { label: 'Avg Reward', value: '284', trend: 5.1, data: [180, 220, 245, 268, 280, 284], desc: 'PPO episode score' },
  { label: 'Brownouts', value: '1.7%', trend: -3.2, data: [4.2, 3.5, 2.8, 2.1, 1.9, 1.7], desc: 'frequency this week' },
  { label: 'Energy Saved', value: '4.2 GWh', trend: 6.0, data: [2, 2.6, 3.1, 3.6, 4.0, 4.2], desc: 'rerouted this month' },
]

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">AI Performance Dashboard</h1>
        <p className="mt-1 text-white/55">Carbon savings, stability and agent training performance at a glance.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="mt-6 glass rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-semibold">30-day CO₂: Baseline vs GridMind</h2>
        <Co2Chart />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 text-lg font-semibold">Load Heatmap (24h × 7 nodes)</h2>
          <Heatmap />
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 text-lg font-semibold">Training Reward Curve</h2>
          <RewardCurve />
        </div>
      </div>

      <div className="mt-6 glass rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-semibold">SHAP Global Feature Importance</h2>
        <ShapBar />
      </div>
    </div>
  )
}