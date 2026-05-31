export type GridNode = {
  id: string
  name: string
  short: string
  type: 'source' | 'storage' | 'load' | 'substation'
  load: number // 0-100
  critical?: boolean
  x: number
  y: number
}

export type GridEdge = {
  id: string
  from: string
  to: string
}

export type AgentDecision = {
  id: string
  timestamp: string
  action: string
  icon: string
  confidence: number
  co2Delta: number
  nodeId?: string
  shap: ShapFeature[]
}

export type ShapFeature = {
  feature: string
  value: number
}

export type GridMetrics = {
  stability: number
  co2Saved: number
  reward: number
  activeNodes: number
}