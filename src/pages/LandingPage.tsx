import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Globe from '@/components/Globe'
import Ticker from '@/components/Ticker'
import StatCounter from '@/components/StatCounter'

const STEPS = [
  { n: '01', title: 'Ingest & Forecast', desc: 'Live sensor streams and weather feeds predict demand 22 minutes ahead across every node.' },
  { n: '02', title: 'Decide with RL', desc: 'A PPO reinforcement agent chooses reroutes, throttles and storage actions to balance load and cut carbon.' },
  { n: '03', title: 'Explain & Act', desc: 'Every action is verified for stability, explained with SHAP, then applied to the grid in real time.' },
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="order-2 lg:order-1">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-6xl font-extrabold leading-none tracking-tight sm:text-7xl lg:text-[96px]"
            >
              GridMind
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-md text-lg text-white/70"
            >
              AI that stops electricity becoming the world&apos;s most expensive waste.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/demo"
                className="rounded-xl bg-teal px-6 py-3 font-semibold text-navy transition-shadow hover:shadow-[0_0_28px_rgba(0,201,167,0.55)] focus-ring"
              >
                Watch the AI in action
              </Link>
              <Link
                to="/analytics"
                className="glass rounded-xl px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-ring"
              >
                View performance
              </Link>
            </motion.div>
          </div>
          <div className="order-1 lg:order-2">
            <Globe />
          </div>
        </div>
      </section>

      <Ticker />

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">The stakes for the grid</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCounter prefix="$" value={2.1} decimals={1} suffix="T" label="Annual grid energy waste" />
          <StatCounter value={47} suffix="M" label="Tonnes avoidable CO₂ in Kazakhstan" />
          <StatCounter value={11.3} decimals={1} suffix="%" label="Carbon reduction achieved" />
          <StatCounter prefix="< " value={2} suffix="%" label="Brownout frequency" />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">How GridMind works</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-7">
              <div className="text-4xl font-extrabold text-teal">{s.n}</div>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm text-white/60">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">See the agent balance a live grid</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Step into the simulation: inject demand spikes, solar dropouts and storms, and watch the reinforcement agent
            respond in seconds.
          </p>
          <Link
            to="/demo"
            className="mt-8 inline-block rounded-xl bg-teal px-8 py-4 text-lg font-semibold text-navy transition-shadow hover:shadow-[0_0_32px_rgba(0,201,167,0.6)] focus-ring"
          >
            Watch the AI in action
          </Link>
        </div>
      </section>
    </div>
  )
}