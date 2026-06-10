"""
GridMind — ml/compute_shap.py
Precomputes SHAP values for all 4 demo scenarios and writes
backend/cache/shap_values.json.

Run from project root:
    python ml/compute_shap.py

Requirements:
    pip install shap
"""

import os
import sys
import json
import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import shap
from backend.models.forecast_model import ForecastModel
from ml.features import build_features

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
DATA_PATH       = os.path.join(ROOT, "data", "raw", "kegoc_load.csv")
MODEL_PATH      = os.path.join(ROOT, "data", "processed", "lgbm_model.pkl")
CACHE_DIR       = os.path.join(ROOT, "backend", "cache")
OUTPUT_PATH     = os.path.join(CACHE_DIR, "shap_values.json")

# ---------------------------------------------------------------------------
# Scenario definitions — each overrides specific columns in the load CSV
# These match the demo scenario parameters in grid_env.py / SCENARIO_PRESETS
# ---------------------------------------------------------------------------
SCENARIO_CONFIGS = {
    "industrial_spike": {
        "industrial_multiplier": 1.42,
        "residential_multiplier": 1.0,
        "solar_multiplier": 1.0,
        "wind_multiplier": 1.0,
        "wind_offline": False,
        "description": "Industrial load +42% demand spike",
    },
    "storm": {
        "industrial_multiplier": 1.0,
        "residential_multiplier": 1.15,
        "solar_multiplier": 0.21,
        "wind_multiplier": 0.22,
        "wind_offline": False,
        "description": "Storm: solar/wind -78%, residential +15%",
    },
    "battery_depletion": {
        "industrial_multiplier": 1.0,
        "residential_multiplier": 1.0,
        "solar_multiplier": 1.0,
        "wind_multiplier": 1.0,
        "wind_offline": False,
        "description": "Battery SOC at critical 12%, evening peak demand",
    },
    "dual_failure": {
        "industrial_multiplier": 1.42,
        "residential_multiplier": 1.0,
        "solar_multiplier": 1.0,
        "wind_multiplier": 0.0,
        "wind_offline": True,
        "description": "Wind offline + industrial spike simultaneously",
    },
}

# Number of rows to use per scenario for SHAP background + explanation
N_BACKGROUND = 100
N_EXPLAIN    = 1       # single representative row per scenario


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def apply_scenario(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Return a copy of df with scenario multipliers applied."""
    d = df.copy()
    d["industrial_mw"]  = d["industrial_mw"]  * config["industrial_multiplier"]
    d["residential_mw"] = d["residential_mw"] * config["residential_multiplier"]
    d["solar_mw"]       = d["solar_mw"]       * config["solar_multiplier"]
    d["wind_mw"]        = d["wind_mw"]        * config["wind_multiplier"]
    if config.get("wind_offline"):
        d["wind_mw"] = 0.0
    # Recompute total load column
    d["load_mw"] = d["industrial_mw"] + d["residential_mw"]
    return d


def pick_representative_row(df: pd.DataFrame, scenario_id: str) -> pd.DataFrame:
    """
    Pick a single row that best represents the scenario for explanation.
    For spikes: row with highest industrial load.
    For storm: row with lowest solar.
    For battery_depletion: evening peak (17:00–19:00).
    For dual_failure: highest industrial + zero wind.
    """
    if scenario_id == "industrial_spike":
        idx = df["industrial_mw"].idxmax()
    elif scenario_id == "storm":
        idx = df["solar_mw"].idxmin()
    elif scenario_id == "battery_depletion":
        evening = df[df.index.hour.isin([17, 18, 19])] if hasattr(df.index, 'hour') else df
        idx = evening["load_mw"].idxmax() if len(evening) else df["load_mw"].idxmax()
    elif scenario_id == "dual_failure":
        idx = df["industrial_mw"].idxmax()
    else:
        idx = df["load_mw"].idxmax()
    return df.loc[[idx]]


def shap_values_to_top_features(shap_vals: np.ndarray,
                                 feature_names: list,
                                 n_top: int = 6) -> list:
    """Convert a 1D SHAP array into sorted top-feature dicts."""
    pairs = sorted(
        zip(feature_names, shap_vals.flatten()),
        key=lambda x: abs(x[1]),
        reverse=True,
    )[:n_top]
    return [
        {
            "name":       name,
            "shap_value": round(float(val), 4),
            "direction":  "up" if val >= 0 else "down",
        }
        for name, val in pairs
    ]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def compute_and_cache():
    os.makedirs(CACHE_DIR, exist_ok=True)

    # Load raw data
    print(f"[compute_shap] Loading data from {DATA_PATH}")
    df_raw = pd.read_csv(DATA_PATH, parse_dates=["timestamp"])
    df_raw = df_raw.set_index("timestamp")

    # Load trained model via ForecastModel wrapper
    print(f"[compute_shap] Loading model from {MODEL_PATH}")
    fm = ForecastModel(model_path=MODEL_PATH)
    model = fm.model       # underlying LGBMRegressor
    feature_names = fm.feature_names  # list of feature column names

    # Build full feature matrix on raw (baseline) data
    print("[compute_shap] Building baseline feature matrix …")
    X_base = build_features(df_raw.reset_index())
    X_base = X_base[feature_names]

    # Background sample for SHAP (random subset)
    rng = np.random.default_rng(42)
    bg_idx = rng.choice(len(X_base), size=min(N_BACKGROUND, len(X_base)), replace=False)
    X_background = X_base.iloc[bg_idx]

    # Build SHAP TreeExplainer once
    print("[compute_shap] Building TreeExplainer …")
    explainer = shap.TreeExplainer(model, data=X_background)

    output = {}

    for scenario_id, config in SCENARIO_CONFIGS.items():
        print(f"[compute_shap] Computing SHAP for scenario: {scenario_id}")

        # Apply scenario to raw df, rebuild features
        df_scenario = apply_scenario(df_raw.reset_index(), config)
        X_scenario = build_features(df_scenario)
        X_scenario = X_scenario[feature_names]

        # Pick one representative row
        if "timestamp" in df_scenario.columns:
            df_scenario = df_scenario.set_index("timestamp")
        rep_row_df = pick_representative_row(df_scenario, scenario_id)
        rep_idx    = rep_row_df.index[0]

        # Corresponding feature row
        # Match by positional index since feature df has integer index
        pos = df_scenario.index.get_loc(rep_idx)
        X_explain = X_scenario.iloc[[pos]]

        # SHAP values
        sv = explainer.shap_values(X_explain)      # shape (1, n_features)
        sv_row = np.array(sv).flatten()

        base_value  = float(explainer.expected_value)
        prediction  = float(model.predict(X_explain)[0])

        top_features = shap_values_to_top_features(sv_row, feature_names, n_top=6)

        output[scenario_id] = {
            "scenario":     scenario_id,
            "description":  config["description"],
            "base_value":   round(base_value, 2),
            "prediction":   round(prediction, 2),
            "top_features": top_features,
        }

        print(f"  base={base_value:.1f}  pred={prediction:.1f}  "
              f"top_feature={top_features[0]['name']} ({top_features[0]['shap_value']:+.1f})")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n[compute_shap] Saved → {OUTPUT_PATH}")
    return output


if __name__ == "__main__":
    compute_and_cache()
