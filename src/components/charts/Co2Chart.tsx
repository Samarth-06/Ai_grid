import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = Array.from({ length: 30 }, (_, i) => {
  const baseline = 1200 + Math.sin(i / 4) * 90 + i * 4
  const gridmind = baseline * (0.84 - i * 0.004)
  return { day: `D${i + 1}`, baseline: Math.round(baseline), gridmind: Math.round(gridmind) }
})

export default function Co2Chart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="savings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#22C55E" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} interval={4} />
        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#0A0F2C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
          labelStyle={{ color: '#fff' }}
        />
        <Area type="monotone" dataKey="baseline" stroke="#E84855" strokeWidth={2} fill="url(#savings)" fillOpacity={0} animationDuration={1400} />
        <Area type="monotone" dataKey="gridmind" stroke="#00C9A7" strokeWidth={2} fill="url(#savings)" animationDuration={1400} />
      </AreaChart>
    </ResponsiveContainer>
  )
}