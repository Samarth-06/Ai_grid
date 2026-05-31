import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = Array.from({ length: 40 }, (_, i) => {
  const t = i / 39
  const reward = 284 * (1 - Math.exp(-t * 4)) + (Math.random() - 0.5) * 8
  return { step: `${(i * 25).toString()}k`, reward: Math.max(0, Math.round(reward)) }
})

export default function RewardCurve() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="step" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} interval={6} />
        <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#0A0F2C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} labelStyle={{ color: '#fff' }} />
        <Line type="monotone" dataKey="reward" stroke="#F4A623" strokeWidth={2} dot={false} animationDuration={1600} />
      </LineChart>
    </ResponsiveContainer>
  )
}