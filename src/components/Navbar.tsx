import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from './Logo'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/demo', label: 'Live Demo' },
  { to: '/flow', label: 'Agent Flow' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/xai', label: 'Explainability' },
  { to: '/integrations', label: 'Integrations' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-b border-white/10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Primary">
          <Link to="/" className="flex items-center gap-2 focus-ring rounded-md" onClick={() => setOpen(false)}>
            <Logo />
            <span className="text-lg font-extrabold tracking-tight">GridMind</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white focus-ring',
                    isActive && 'text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{l.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded bg-teal"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-critical/40 bg-critical/10 px-3 py-1 text-xs font-semibold text-critical sm:flex">
              <span className="h-2 w-2 rounded-full bg-critical animate-pulseDot" />
              LIVE
            </span>
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-md p-2 text-white/80 lg:hidden focus-ring"
              aria-label="Toggle navigation menu"
              aria-expanded={open}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </nav>

        {open && (
          <div className="border-t border-white/10 px-4 pb-4 lg:hidden">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white focus-ring',
                  pathname === l.to && 'text-teal',
                )}
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}