# ml/features.py
"""
Feature engineering for LightGBM demand forecasting.
Produces lag features, rolling statistics, and calendar features
from the raw Kazakhstan load profile.
"""

import numpy as np
import pandas as pd
from typing import List, Tuple

# Lag windows (hours back)
LAG_HOURS: List[int] = [1, 2, 3, 6, 12, 24, 48, 168]

# Rolling aggregation windows (hours)
ROLLING_WINDOWS: List[int] = [3, 6, 12, 24]

# Final feature column list — single source of truth used by train + inference
FEATURE_COLS: List[str] = (
    [f"lag_{l}h" for l in LAG_HOURS]
    + [f"roll_mean_{w}h" for w in ROLLING_WINDOWS]
    + [f"roll_std_{w}h" for w in ROLLING_WINDOWS]
    + [f"roll_max_{w}h" for w in ROLLING_WINDOWS]
    + [
        "hour_sin", "hour_cos",
        "dow_sin", "dow_cos",
        "month_sin", "month_cos",
        "is_weekend",
        "temp_c",
        "temp_lag1",
        "solar_mw",
        "wind_mw",
        "carbon_intensity",
    ]
)

TARGET_COL = "load_mw"


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes a raw load DataFrame (from kegoc_load.csv) and returns
    a feature-engineered DataFrame ready for LightGBM training or inference.
    Drops rows with NaN (introduced by lag/rolling operations).

    Args:
        df: Raw DataFrame with columns:
            timestamp, load_mw, industrial_mw, residential_mw,
            solar_mw, wind_mw, battery_soc, temp_c, carbon_intensity

    Returns:
        DataFrame with FEATURE_COLS + TARGET_COL columns.
        Index is reset. Original columns are dropped.
    """
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    # --- Calendar features (cyclically encoded to avoid ordinal bias) ---
    hour = df["timestamp"].dt.hour
    dow = df["timestamp"].dt.dayofweek
    month = df["timestamp"].dt.month

    df["hour_sin"] = np.sin(2.0 * np.pi * hour / 24.0)
    df["hour_cos"] = np.cos(2.0 * np.pi * hour / 24.0)
    df["dow_sin"] = np.sin(2.0 * np.pi * dow / 7.0)
    df["dow_cos"] = np.cos(2.0 * np.pi * dow / 7.0)
    df["month_sin"] = np.sin(2.0 * np.pi * (month - 1) / 12.0)
    df["month_cos"] = np.cos(2.0 * np.pi * (month - 1) / 12.0)
    df["is_weekend"] = (dow >= 5).astype(np.int8)

    # --- Lag features ---
    for lag in LAG_HOURS:
        df[f"lag_{lag}h"] = df[TARGET_COL].shift(lag)

    # --- Rolling features ---
    for w in ROLLING_WINDOWS:
        rolled = df[TARGET_COL].rolling(window=w, min_periods=w)
        df[f"roll_mean_{w}h"] = rolled.mean()
        df[f"roll_std_{w}h"] = rolled.std()
        df[f"roll_max_{w}h"] = rolled.max()

    # --- Weather lag ---
    df["temp_lag1"] = df["temp_c"].shift(1)

    # --- Keep only needed columns ---
    keep = FEATURE_COLS + [TARGET_COL, "timestamp"]
    df = df[keep].dropna().reset_index(drop=True)

    return df


def prepare_train_val_split(
    df: pd.DataFrame,
    val_fraction: float = 0.10
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Time-based train/val split.
    Last val_fraction of rows -> validation set.
    No shuffling (preserves temporal ordering).

    Returns:
        X_train, X_val, y_train, y_val
    """
    df = build_features(df)
    split_idx = int(len(df) * (1.0 - val_fraction))

    train = df.iloc[:split_idx]
    val = df.iloc[split_idx:]

    X_train = train[FEATURE_COLS]
    y_train = train[TARGET_COL]
    X_val = val[FEATURE_COLS]
    y_val = val[TARGET_COL]

    return X_train, X_val, y_train, y_val
