# backend/main.py
"""
GridMind — FastAPI application entry point.

Lifespan:
  1. Load ForecastModel + history
  2. Load PPO agent (if checkpoint exists)
  3. Load SHAP cache  (auto-loaded at construction — no .load() call needed)
  4. Pre-warm LLM explanation cache via module-level prewarm_all()
  5. Start WebSocket broadcast loop (1 Hz)

Run:
    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routers import forecast, grid, agent, scenario, explain, carbon
from backend.websocket.ws_manager import get_ws_manager, handle_ws_connection
from backend.services.scenario_engine import get_scenario_engine
from backend.services.shap_cache import get_shap_cache

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("gridmind")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup / shutdown logic.
    All heavy I/O happens here so endpoints are ready before first request.
    """
    settings = get_settings()
    logger.info("=" * 60)
    logger.info("GridMind starting up …")
    logger.info("DEMO_MODE : %s", settings.demo_mode)
    logger.info("NIM key   : %s", "SET" if settings.nim_available else "NOT SET")
    logger.info("=" * 60)

    # ------------------------------------------------------------------ #
    # 1. ForecastModel
    # ------------------------------------------------------------------ #
    try:
        from backend.models.forecast_model import ForecastModel
        fm = ForecastModel(model_path=settings.model_path)
        fm.load_history(settings.data_csv_path)
        app.state.forecast_model = fm
        logger.info("[startup] ForecastModel loaded.")
    except Exception as exc:
        logger.warning("[startup] ForecastModel unavailable: %s", exc)
        app.state.forecast_model = None

    # ------------------------------------------------------------------ #
    # 2. PPO Agent
    # ------------------------------------------------------------------ #
    try:
        from backend.models.ppo_agent import PPOAgent
        if os.path.exists(settings.ppo_checkpoint_path):
            agent_instance = PPOAgent(checkpoint_path=settings.ppo_checkpoint_path)
            app.state.ppo_agent = agent_instance
            logger.info("[startup] PPO agent loaded from %s.", settings.ppo_checkpoint_path)
        else:
            app.state.ppo_agent = None
            logger.warning(
                "[startup] PPO checkpoint not found at %s — using demo decisions.",
                settings.ppo_checkpoint_path,
            )
    except Exception as exc:
        logger.warning("[startup] PPO agent unavailable: %s", exc)
        app.state.ppo_agent = None

    # ------------------------------------------------------------------ #
    # 3. SHAP cache
    # SHAPCache auto-loads from disk at construction via get_shap_cache().
    # No .load() method exists — just retrieve the singleton.
    # ------------------------------------------------------------------ #
    shap_cache = get_shap_cache()
    shap_count = len(shap_cache.get_all())
    logger.info(
        "[startup] SHAP cache ready (%d scenarios, from_file=%s).",
        shap_count,
        shap_cache.is_from_file(),
    )

    # ------------------------------------------------------------------ #
    # 4. LLM explanation cache pre-warm
    # llm_explain exposes module-level functions, not a class.
    # Import and call prewarm_all() directly.
    # ------------------------------------------------------------------ #
    try:
        import backend.services.llm_explain as llm_explain
        await llm_explain.prewarm_all(shap_cache)
        logger.info("[startup] LLM explanation cache pre-warmed.")
    except Exception as exc:
        logger.warning("[startup] LLM explanation pre-warm failed (non-fatal): %s", exc)

    # ------------------------------------------------------------------ #
    # 5. WebSocket broadcast loop
    # ------------------------------------------------------------------ #
    ws_manager = get_ws_manager()
    broadcast_task = asyncio.create_task(ws_manager.broadcast_loop())
    logger.info("[startup] WebSocket broadcast loop started.")

    logger.info("GridMind ready. Listening on %s:%d", settings.host, settings.port)

    yield  # Application runs here

    # ------------------------------------------------------------------ #
    # Shutdown
    # ------------------------------------------------------------------ #
    logger.info("[shutdown] Cancelling broadcast loop …")
    broadcast_task.cancel()
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass
    logger.info("[shutdown] GridMind stopped.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="GridMind API",
    description=(
        "AI-powered smart grid management system. "
        "Predicts demand, controls grid via PPO RL, "
        "and explains decisions in English, Kazakh, and Russian."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
# Dev: allow all localhost origins.
# Production: set ALLOWED_ORIGINS env var to comma-separated Vercel/etc URLs.
# e.g. ALLOWED_ORIGINS=https://gridmind.vercel.app,https://gridmind-main.vercel.app
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

_allow_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
] + _extra_origins

# If no explicit production origins set, fall back to allow all (hackathon mode)
if not _extra_origins:
    _allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=False,   # No cookies used — must be False when origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(forecast.router)
app.include_router(grid.router)
app.include_router(agent.router)
app.include_router(scenario.router)
app.include_router(explain.router)
app.include_router(carbon.router)


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/grid")
async def websocket_grid(websocket: WebSocket):
    """
    Live grid state stream at 1 Hz.

    DEMO_MODE=true  → streams from ScenarioEngine state machine.
    DEMO_MODE=false → streams from live GridEnv.

    Client receives:
        { "type": "grid_update", "grid": {...}, "decision": {...}, "carbon": {...} }
    """
    manager = get_ws_manager()
    await handle_ws_connection(websocket, manager)


# ---------------------------------------------------------------------------
# Health check
# Bug fix: shap_cache.scenario_count does not exist.
# Use len(shap_cache.get_all()) instead.
# ---------------------------------------------------------------------------

@app.get("/health", tags=["meta"])
async def health():
    settings = get_settings()
    engine = get_scenario_engine()
    ws_manager = get_ws_manager()
    shap_cache = get_shap_cache()

    return {
        "status": "ok",
        "demo_mode": settings.demo_mode,
        "active_scenario": engine.get_active_scenario(),
        "ws_connections": ws_manager.connection_count,
        "shap_scenarios": len(shap_cache.get_all()),
        "nim_available": settings.nim_available,
        "ppo_loaded": getattr(app.state, "ppo_agent", None) is not None,
        "forecast_loaded": getattr(app.state, "forecast_model", None) is not None,
    }


# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    s = get_settings()
    uvicorn.run(
        "backend.main:app",
        host=s.host,
        port=s.port,
        log_level=s.log_level,
        reload=True,
    )
