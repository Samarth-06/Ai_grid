import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10">
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
        <pattern id="grid-watermark" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#00C9A7" />
          <path d="M2 2 L40 40" stroke="#ffffff" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid-watermark)" />
      </svg>
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-lg font-extrabold">GridMind</span>
            </div>
            <p className="mt-3 text-sm text-white/55">
              Autonomous electricity grid load balancing powered by reinforcement learning — keeping critical loads
              stable and carbon low.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="mb-3 font-semibold text-white/80">Product</p>
              <ul className="space-y-2 text-white/55">
                <li><Link className="hover:text-teal focus-ring" to="/demo">Live Demo</Link></li>
                <li><Link className="hover:text-teal focus-ring" to="/flow">Agent Flow</Link></li>
                <li><Link className="hover:text-teal focus-ring" to="/analytics">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold text-white/80">Explore</p>
              <ul className="space-y-2 text-white/55">
                <li><Link className="hover:text-teal focus-ring" to="/xai">Explainability</Link></li>
                <li><Link className="hover:text-teal focus-ring" to="/integrations">Integrations</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} GridMind. Built for resilient, low-carbon grids.
        </div>
      </div>
    </footer>
  )
}