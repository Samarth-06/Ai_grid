# backend/routers/agent.py
"""
GridMind — GET /agent/decision

Returns the latest PPO agent action, reward breakdown, and metadata.

DEMO_MODE=true  → serves canned decision from ScenarioEngine
DEMO_MODE=false → queries live PPO agent (falls back to demo if unavailable)

Bug fixes:
  - agent.predict() does not exist; correct method is agent.act().
  - PPOAgent._build_metadata() returns keys: estimated_reward,
    decision_summary, renewable_frac, policy, latency_ms, obs,
    route_industrial, route_residential, battery_cmd,
    battery_action_label — NOT reward / stability_score /
    carbon_reduction / brownout_risk / rationale.
    Map from actual keys to the response schema.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.config import Settings, get_settings
from backend.services.scenario_engine import ScenarioEngine, get_scenario_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["agent"])


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class ActionDetail(BaseModel):
    route_industrial: float    # [0, 1]
    route_residential: float   # [0, 1]
    battery_cmd: float         # [-1, +1]


class DecisionResponse(BaseModel):
    action: ActionDetail
    reward: float
    stability_score: float
    carbon_reduction: float
    brownout_risk: float
    rationale: str
    scenario_id: str
    timestamp: str
    demo_mode: bool
    source: str                # "demo" | "ppo_live" | "ppo_fallback"


# ---------------------------------------------------------------------------
# GET /agent/decision
# ---------------------------------------------------------------------------

@router.get("/decision", response_model=DecisionResponse)
async def get_agent_decision(
    settings: Settings = Depends(get_settings),
    engine: ScenarioEngine = Depends(get_scenario_engine),
):
    """
    Return the latest PPO agent decision for the active scenario.

    DEMO_MODE=true  → canned decision matched to active scenario.
    DEMO_MODE=false → queries live PPO agent if checkpoint loaded.
    """
    if settings.demo_mode:
        return _demo_decision(engine)

    # Live path — attempt PPO inference
    try:
        return await _live_decision(engine, settings)
    except Exception as exc:
        logger.warning("[agent] Live PPO inference failed: %s — falling back to demo.", exc)
        resp = _demo_decision(engine)
        resp.source = "ppo_fallback"
        return resp


# ---------------------------------------------------------------------------
# DEMO path
# ---------------------------------------------------------------------------

def _demo_decision(engine: ScenarioEngine) -> DecisionResponse:
    d = engine.get_decision()
    return DecisionResponse(
        action=ActionDetail(**d["action"]),
        reward=d["reward"],
        stability_score=d["stability_score"],
        carbon_reduction=d["carbon_reduction"],
        brownout_risk=d["brownout_risk"],
        rationale=d["rationale"],
        scenario_id=d["scenario_id"],
        timestamp=d.get("timestamp", _iso_now()),
        demo_mode=True,
        source="demo",
    )


# ---------------------------------------------------------------------------
# Live path
# ---------------------------------------------------------------------------

async def _live_decision(
    engine: ScenarioEngine,
    settings: Settings,
) -> DecisionResponse:
    """
    Query the live PPO agent for the current grid observation.
    Raises on any failure so caller can fall back.
    """
    import asyncio
    import numpy as np
    from backend.models.ppo_agent import PPOAgent

    agent = PPOAgent(checkpoint_path=settings.ppo_checkpoint_path)
    grid_state = engine.get_grid_state(demo_mode=False)

    # Build a 12-dim observation from grid state nodes
    nodes = {n["id"]: n for n in grid_state["nodes"]}
    obs = np.array([
        nodes[1]["load_mw"] / 1500.0,
        nodes[2]["load_mw"] / 1500.0,
        nodes[3]["gen_mw"] / 200.0,
        nodes[4]["gen_mw"] / 200.0,
        nodes[5]["soc"] if nodes[5]["soc"] is not None else 0.5,
        0.5, 0.5,   # hour_sin/cos placeholder
        0.5, 0.5,   # dow_sin/cos placeholder
        0.46, 0.05, # forecast_mean/std placeholder
        0.52,       # carbon_intensity placeholder
    ], dtype=np.float32)

    # Bug fix: PPOAgent.act() is the correct method, not .predict()
    action, meta = await asyncio.get_event_loop().run_in_executor(
        None, agent.act, obs
    )

    # Bug fix: map from PPOAgent._build_metadata() actual keys.
    # Keys present: estimated_reward, decision_summary, renewable_frac,
    # route_industrial, route_residential, battery_cmd,
    # battery_action_label, policy, latency_ms, obs.
    # Keys absent (not computed by PPO): stability_score,
    # carbon_reduction, brownout_risk — derive reasonable proxies.
    estimated_reward   = float(meta.get("estimated_reward", 0.0))
    renewable_frac     = float(meta.get("renewable_frac", 0.0))
    battery_soc        = float(obs[4])
    industrial_load    = float(obs[0])

    # Proxy: stability ↑ when load is low; carbon_reduction ≈ renewable_frac;
    # brownout_risk ↑ when load is high and battery is depleted.
    stability_score  = round(max(0.0, 1.0 - industrial_load), 4)
    carbon_reduction = round(renewable_frac, 4)
    brownout_risk    = round(
        max(0.0, industrial_load - 0.5) * max(0.0, 1.0 - battery_soc * 2),
        4,
    )

    return DecisionResponse(
        action=ActionDetail(
            route_industrial=float(action[0]),
            route_residential=float(action[1]),
            battery_cmd=float(action[2]),
        ),
        reward=estimated_reward,
        stability_score=stability_score,
        carbon_reduction=carbon_reduction,
        brownout_risk=brownout_risk,
        rationale=meta.get("decision_summary", "PPO live inference."),
        scenario_id=engine.get_active_scenario(),
        timestamp=_iso_now(),
        demo_mode=False,
        source="ppo_live",
    )


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()
