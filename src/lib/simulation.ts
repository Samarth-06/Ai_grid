import type { AgentDecision, GridNode, GridEdge } from '@/types/models'

export const NODES: GridNode[] = [
  { id: 'solar', name: 'Solar Farm', short: 'SOLAR', type: 'source', load: 62, x: 120, y: 90 },
  { id: 'wind', name: 'Wind Farm', short: 'WIND', type: 'source', load: 54, x: 120, y: 320 },
  { id: 'subA', name: 'Substation A', short: 'SUB-A', type: 'substation', load: 71, x: 360, y: 200 },
  { id: 'hospital', name: 'Hospital', short: 'HOSP', type: 'load', load: 88, critical: true, x: 600, y: 90 },
  { id: 'industrial', name: 'Industrial Zone', short: 'IND', type: 'load', load: 79, x: 600, y: 320 },
  { id: 'residential', name: 'Residential Area', short: 'RES', type: 'load', load: 45, x: 600, y: 480 },
  { id: 'battery', name: 'Battery Storage', short: 'BATT', type: 'storage', load: 40, x: 360, y: 420 },
]

export const EDGES: GridEdge[] = [
  { id: 'e1', from: 'solar', to: 'subA' },
  { id: 'e2', from: 'wind', to: 'subA' },
  { id: 'e3', from: 'subA', to: 'hospital' },
  { id: 'e4', from: 'subA', to: 'industrial' },
  { id: 'e5', from: 'subA', to: 'battery' },
  { id: 'e6', from: 'battery', to: 'residential' },
  { id: 'e7', from: 'battery', to: 'industrial' },
]

const ACTIONS: { action: string; icon: string; nodeId: string }[] = [
  { action: 'Rerouted 18kW Industrial→Battery', icon: '⚡', nodeId: 'industrial' },
  { action: 'Charged Battery Storage to 64%', icon: '🔋', nodeId: 'battery' },
  { action: 'Throttled Industrial Zone load -12%', icon: '🏭', nodeId: 'industrial' },
  { action: 'Prioritized Hospital supply line', icon: '🏥', nodeId: 'hospital' },
  { action: 'Increased Wind farm dispatch +9kW', icon: '🌬️', nodeId: 'wind' },
  { action: 'Compensated demand spike via Solar', icon: '☀️', nodeId: 'solar' },
  { action: 'Shed non-critical Residential load', icon: '🏘️', nodeId: 'residential' },
  { action: 'Rebalanced Substation A flow', icon: '🔀', nodeId: 'subA' },
]

const FEATURES = [
  'Demand forecast (22min)',
  'Hospital criticality',
  'Battery state of charge',
  'Solar irradiance',
  'Wind availability',
  'Grid frequency Δ',
  'Time of day',
  'Industrial schedule',
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

let counter = 0

export function generateDecision(forcedAction?: { action: string; icon: string; nodeId: string }): AgentDecision {
  const pick = forcedAction ?? ACTIONS[Math.floor(Math.random() * ACTIONS.length)]
  const shuffled = [...FEATURES].sort(() => Math.random() - 0.5).slice(0, 3)
  counter += 1
  return {
    id: `dec-${Date.now()}-${counter}`,
    timestamp: new Date().toISOString(),
    action: pick.action,
    icon: pick.icon,
    confidence: Math.round(rand(82, 99)),
    co2Delta: parseFloat(rand(0.4, 3.6).toFixed(1)),
    nodeId: pick.nodeId,
    shap: shuffled.map((f) => ({ feature: f, value: parseFloat(rand(-0.4, 0.6).toFixed(2)) })),
  }
}

export const EVENT_PRESETS = [
  { key: 'spike', label: 'Demand Spike +40%', icon: '⚡', action: { action: 'Detected demand spike → routing reserves', icon: '⚡', nodeId: 'industrial' } },
  { key: 'solar', label: 'Solar Dropout', icon: '☀️', action: { action: 'Solar dropout → compensating via Wind farm', icon: '🌬️', nodeId: 'wind' } },
  { key: 'storm', label: 'Storm Warning', icon: '🌩️', action: { action: 'Storm warning → pre-charging Battery Storage', icon: '🔋', nodeId: 'battery' } },
  { key: 'night', label: 'Night Mode', icon: '🌙', action: { action: 'Night mode → reducing Residential baseline', icon: '🌙', nodeId: 'residential' } },
]