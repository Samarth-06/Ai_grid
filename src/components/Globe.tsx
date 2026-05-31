import { useEffect, useRef } from 'react'
import { usesReducedMotion } from '@/lib/utils'

type City = { name: string; lat: number; lon: number }
const CITIES: City[] = [
  { name: 'Almaty', lat: 43.2, lon: 76.9 },
  { name: 'Mumbai', lat: 19.0, lon: 72.8 },
  { name: 'Dubai', lat: 25.2, lon: 55.3 },
  { name: 'Brussels', lat: 50.8, lon: 4.3 },
]

// Lightweight canvas globe with rotating wireframe + glowing connection arcs.
export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = usesReducedMotion()

    let raf = 0
    let rotation = 0
    let particleT = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const size = Math.min(canvas.parentElement?.clientWidth ?? 600, 620)
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const project = (lat: number, lon: number, rot: number, R: number, cx: number, cy: number) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lon + rot) * (Math.PI / 180)
      const x = R * Math.sin(phi) * Math.cos(theta)
      const y = R * Math.cos(phi)
      const z = R * Math.sin(phi) * Math.sin(theta)
      return { x: cx + x, y: cy - y, z }
    }

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.36
      ctx.clearRect(0, 0, w, h)

      // glow halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5)
      halo.addColorStop(0, 'rgba(0,201,167,0.10)')
      halo.addColorStop(1, 'rgba(0,201,167,0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // sphere base
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(10,15,44,0.9)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,201,167,0.25)'
      ctx.lineWidth = 1
      ctx.stroke()

      // meridians
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath()
        let started = false
        for (let lat = -90; lat <= 90; lat += 6) {
          const p = project(lat, lon, rotation, R, cx, cy)
          if (p.z < 0) {
            started = false
            continue
          }
          if (!started) {
            ctx.moveTo(p.x, p.y)
            started = true
          } else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.stroke()
      }
      // parallels
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath()
        let started = false
        for (let lon = -180; lon <= 180; lon += 6) {
          const p = project(lat, lon, rotation, R, cx, cy)
          if (p.z < 0) {
            started = false
            continue
          }
          if (!started) {
            ctx.moveTo(p.x, p.y)
            started = true
          } else ctx.lineTo(p.x, p.y)
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.stroke()
      }

      // city nodes + arcs
      const pts = CITIES.map((c) => project(c.lat, c.lon, rotation, R, cx, cy))
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]
        const b = pts[(i + 1) % pts.length]
        if (a.z < 0 && b.z < 0) continue
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2 - R * 0.45
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(mx, my, b.x, b.y)
        ctx.strokeStyle = 'rgba(0,201,167,0.4)'
        ctx.lineWidth = 1.4
        ctx.stroke()

        // particle along arc
        const t = (particleT + i * 0.25) % 1
        const px = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x
        const py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#00C9A7'
        ctx.shadowColor = '#00C9A7'
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0
      }
      for (const p of pts) {
        if (p.z < 0) continue
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#F4A623'
        ctx.shadowColor = '#F4A623'
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (!reduce) {
        rotation += 0.18
        particleT = (particleT + 0.006) % 1
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="flex items-center justify-center" role="img" aria-label="Rotating globe showing power data arcs between Almaty, Mumbai, Dubai and Brussels">
      <canvas ref={canvasRef} />
    </div>
  )
}