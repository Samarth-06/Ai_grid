import { motion } from 'framer-motion'

type Status = 'Connected' | 'Available' | 'Coming Soon'
type Integration = { name: string; icon: string; status: Status; desc: string }

const INTEGRATIONS: Integration[] = [
  { name: 'KEGOC API', icon: '🔌', status: 'Connected', desc: "Kazakhstan's national grid operator — live load and dispatch data." },
  { name: 'OpenWeatherMap', icon: '🌦️', status: 'Connected', desc: 'Weather & irradiance feeds powering demand forecasts.' },
  { name: 'MQTT / IoT Sensors', icon: '📡', status: 'Connected', desc: 'Real-time telemetry from substation and node sensors.' },
  { name: 'Grafana', icon: '📊', status: 'Available', desc: 'Push GridMind metrics into your Grafana dashboards.' },
  { name: 'Slack Alerts', icon: '💬', status: 'Available', desc: 'Get critical grid alerts and agent actions in Slack.' },
  { name: 'Google Sheets Export', icon: '📑', status: 'Available', desc: 'Export decision logs and KPIs to a shared sheet.' },
  { name: 'PostgreSQL', icon: '🐘', status: 'Connected', desc: 'Persist decision history and time-series data.' },
  { name: 'Prometheus Metrics', icon: '🔥', status: 'Coming Soon', desc: 'Scrape agent and grid metrics for monitoring.' },
]

const badge: Record<Status, string> = {
  Connected: 'border-teal/40 bg-teal/10 text-teal',
  Available: 'border-white/20 bg-white/5 text-white/70',
  'Coming Soon': 'border-amber/40 bg-amber/10 text-amber',
}

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">Connect GridMind</h1>
        <p className="mt-1 text-white/55">Plug into your grid systems, monitoring stack and data destinations.</p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((it) => {
          const connected = it.status === 'Connected'
          return (
            <div key={it.name} className="relative">
              {connected && (
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl border-2 border-teal/40"
                  animate={{ opacity: [0.25, 0.7, 0.25] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
              )}
              <div className="glass relative flex h-full flex-col rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-2xl">{it.icon}</span>
                    <span className="font-semibold">{it.name}</span>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge[it.status]}`}>
                    {it.status}
                  </span>
                </div>
                <p className="mt-4 flex-1 text-sm text-white/55">{it.desc}</p>
                <button
                  disabled={it.status === 'Coming Soon'}
                  className={`mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-shadow focus-ring ${
                    connected
                      ? 'glass text-white hover:bg-white/10'
                      : it.status === 'Available'
                        ? 'bg-teal text-navy hover:shadow-[0_0_20px_rgba(0,201,167,0.5)]'
                        : 'cursor-not-allowed bg-white/5 text-white/30'
                  }`}
                >
                  {connected ? 'Manage' : it.status === 'Available' ? 'Connect' : 'Notify me'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}