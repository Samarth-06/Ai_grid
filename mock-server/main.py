"""
GridMind mock WebSocket server (reference implementation).

Streams fake but realistic agent decision data every 2 seconds over a WebSocket.
This is a standalone reference server — the GridMind web app ships with an in-app
simulation, so it runs without this server. Use this when you want to wire the
front-end up to a real backend.

Run:
    pip install fastapi uvicorn
    uvicorn main:app --reload --port 8000

Connect from the browser:
    const ws = new WebSocket("ws://localhost:8000/ws/decisions")
"""
import asyncio
import json
import random
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI(title="GridMind Mock WS")

ACTIONS = [
    ("⚡", "Rerouted 18kW Industrial→Battery", "industrial"),
    ("🔋", "Charged Battery Storage to 64%", "battery"),
    ("🏭", "Throttled Industrial Zone load -12%", "industrial"),
    ("🏥", "Prioritized Hospital supply line", "hospital"),
    ("🌬️", "Increased Wind farm dispatch +9kW", "wind"),
    ("☀️", "Compensated demand spike via Solar", "solar"),
    ("🏘️", "Shed non-critical Residential load", "residential"),
    ("🔀", "Rebalanced Substation A flow", "subA"),
]

FEATURES = [
    "Demand forecast (22min)",
    "Hospital criticality",
    "Battery state of charge",
    "Solar irradiance",
    "Wind availability",
    "Grid frequency Δ",
    "Time of day",
    "Industrial schedule",
]


def make_decision() -> dict:
    icon, action, node_id = random.choice(ACTIONS)
    feats = random.sample(FEATURES, 3)
    return {
        "id": f"dec-{int(datetime.now().timestamp() * 1000)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "icon": icon,
        "action": action,
        "nodeId": node_id,
        "confidence": random.randint(82, 99),
        "co2Delta": round(random.uniform(0.4, 3.6), 1),
        "shap": [
            {"feature": f, "value": round(random.uniform(-0.4, 0.6), 2)} for f in feats
        ],
        "metrics": {
            "stability": round(random.uniform(96.0, 99.6), 1),
            "co2Saved": round(random.uniform(120, 180), 1),
            "reward": random.randint(270, 295),
            "activeNodes": 7,
        },
    }


@app.websocket("/ws/decisions")
async def decisions_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_text(json.dumps(make_decision()))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        return


@app.get("/")
def root():
    return {"service": "GridMind Mock WS", "ws": "/ws/decisions", "interval_seconds": 2}