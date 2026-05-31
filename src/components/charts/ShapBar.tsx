import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = [
  { feature: 'Demand forecast', importance: 0.31 },
  { feature: 'Hospital criticality', importance: 0.24 },
  { feature: 'Battery SoC', importance: 0.18 },
  { feature: 'Solar irradiance', importance: 0.13 },
  { feature: 'Grid frequency Δ', importance: 0.09 },
  { feature: 'Time of day', importance: 0.05 },
].sort((a, b) => b.importance - a.importance)

export default function ShapBar() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 30, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="feature" stroke="rgba(255,255,255,0.55)" width={130} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#0A0F2C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} labelStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="importance" fill="#00C9A7" radius={[0, 6, 6, 0]} animationDuration={1400} />
      </BarChart>
    </ResponsiveContainer>
  )
}