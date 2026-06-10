# backend/config.py
"""
GridMind — Application configuration.
Loads from .env via Pydantic Settings.

Required .env keys:
    NVIDIA_API_KEY=...        (optional — enables live NIM calls)
    DEMO_MODE=true            (flip on 2h before judging)

Optional:
    HOST=0.0.0.0
    PORT=8000
    LOG_LEVEL=info
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ------------------------------------------------------------------ #
    # Server
    # ------------------------------------------------------------------ #
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"

    # ------------------------------------------------------------------ #
    # Demo safety switch
    # ------------------------------------------------------------------ #
    demo_mode: bool = False          # set DEMO_MODE=true in .env before judging

    # ------------------------------------------------------------------ #
    # LLM — NVIDIA NIM
    # ------------------------------------------------------------------ #
    nvidia_api_key: str = ""         # NVIDIA_API_KEY in .env
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "meta/llama-3.3-70b-instruct"
    llm_max_tokens: int = 256
    llm_temperature: float = 0.3

    # ------------------------------------------------------------------ #
    # Paths  (all relative to project root)
    # ------------------------------------------------------------------ #
    data_csv_path: str = os.path.join("data", "raw", "kegoc_load.csv")
    model_path: str = os.path.join("data", "processed", "lgbm_model.pkl")
    ppo_checkpoint_path: str = os.path.join("ml", "checkpoints", "best_model.zip")
    cache_dir: str = os.path.join("backend", "cache")

    # ------------------------------------------------------------------ #
    # Cache file names (joined with cache_dir at runtime)
    # ------------------------------------------------------------------ #
    shap_cache_file: str = "shap_values.json"
    explanations_cache_file: str = "explanations.json"
    demo_states_file: str = "demo_states.json"
    demo_forecasts_file: str = "demo_forecasts.json"
    demo_decisions_file: str = "demo_decisions.json"

    # ------------------------------------------------------------------ #
    # PPO / Grid
    # ------------------------------------------------------------------ #
    websocket_hz: float = 1.0        # broadcast frequency
    max_ppo_steps: int = 500         # max env steps per episode

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------ #
    # Computed helpers
    # ------------------------------------------------------------------ #
    def cache_path(self, filename: str) -> str:
        """Return absolute path for a cache file."""
        return os.path.join(self.cache_dir, filename)

    @property
    def shap_cache_path(self) -> str:
        return self.cache_path(self.shap_cache_file)

    @property
    def explanations_cache_path(self) -> str:
        return self.cache_path(self.explanations_cache_file)

    @property
    def demo_states_path(self) -> str:
        return self.cache_path(self.demo_states_file)

    @property
    def demo_forecasts_path(self) -> str:
        return self.cache_path(self.demo_forecasts_file)

    @property
    def demo_decisions_path(self) -> str:
        return self.cache_path(self.demo_decisions_file)

    @property
    def nim_available(self) -> bool:
        """True when a NIM API key is configured."""
        return bool(self.nvidia_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton — import and call this everywhere."""
    return Settings()
