import Sparkline from './Sparkline'

export default function KpiCard({
  label,
  value,
  trend,
  data,
  desc,
}: {
  label: string
  value: string
  trend: number
  data: number[]
  desc: string
}) {
  const up = trend >= 0
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-white/45">{label}</div>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-extrabold">{value}</span>
        <span className={`text-xs font-semibold ${up ? 'text-narrator' : 'text-critical'}`}>
          {up ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      </div>
      <div className="mt-2">
        <Sparkline data={data} color={up ? '#22C55E' : '#E84855'} width={180} height={36} />
      </div>
      <p className="mt-2 text-xs text-white/50">{desc}</p>
    </div>
  )
}