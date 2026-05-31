import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { usesReducedMotion } from '@/lib/utils'

type Props = {
  prefix?: string
  value: number
  suffix?: string
  decimals?: number
  label: string
}

export default function StatCounter({ prefix = '', value, suffix = '', decimals = 0, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [display, setDisplay] = useState(0)
  const reduce = usesReducedMotion()

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const duration = 1600
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, reduce])

  return (
    <div ref={ref} className="glass rounded-2xl p-6 text-center">
      <div className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {prefix}
        {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        {suffix}
      </div>
      <div className="mx-auto mt-3 h-1 w-12 rounded bg-teal" />
      <div className="mt-3 text-sm text-white/55">{label}</div>
    </div>
  )
}