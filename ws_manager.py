"""
GridMind — backend/services/llm_explain.py
Generates natural-language explanations of grid decisions in EN/KZ/RU.

LLM backend : NVIDIA NIM  (meta/llama-3.3-70b-instruct)
Client      : openai SDK pointed at https://integrate.api.nvidia.com/v1
Key env var : NVIDIA_API_KEY

Cache hierarchy (checked in order, first hit wins):
  1. In-memory dict  — populated at runtime
  2. backend/cache/explanations.json  — pre-generated before demo day
  3. Deterministic template fallback  — always succeeds, no network needed

Public API (unchanged from previous version):
  generate_explanation(scenario_id, language, shap_top_features, force_refresh)
  generate_explanation_sync(...)
  prewarm_all(shap_cache)
  seed_file_cache(shap_cache)   ← NEW: writes explanations.json
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, Tuple

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
NVIDIA_NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_NIM_MODEL    = "meta/llama-3.3-70b-instruct"
NVIDIA_API_KEY      = os.environ.get("NVIDIA_API_KEY", "")

ROOT           = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE_DIR      = os.path.join(ROOT, "backend", "cache")
EXPL_CACHE_PATH = os.path.join(CACHE_DIR, "explanations.json")

VALID_LANGUAGES = {"en", "kz", "ru"}
VALID_SCENARIOS = {"industrial_spike", "storm", "battery_depletion", "dual_failure"}

# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------
SYSTEM_PROMPTS = {
    "en": (
        "You are GridMind, an AI grid management system for Kazakhstan's power network. "
        "Explain grid decisions to non-technical judges in clear, confident English. "
        "Be concise: 2–3 sentences maximum. Mention the specific action taken, why it was "
        "taken, and the environmental benefit. Do not use bullet points or lists."
    ),
    "kz": (
        "Сіз GridMind — Қазақстанның электр желісін басқаратын жасанды интеллект жүйесісіз. "
        "Тор шешімдерін техникалық емес судьяларға нақты қазақ тілінде түсіндіріңіз. "
        "Қысқаша болыңыз: максимум 2–3 сөйлем. Қандай іс-әрекет жасалғанын, неліктен "
        "жасалғанын және экологиялық пайдасын атаңыз. Тізімдер қолданбаңыз."
    ),
    "ru": (
        "Вы GridMind — система управления электросетью Казахстана на основе ИИ. "
        "Объясните решения сети нетехническим судьям на чётком русском языке. "
        "Будьте кратки: максимум 2–3 предложения. Укажите, какое действие было выполнено, "
        "почему и какова экологическая выгода. Не используйте списки."
    ),
}

SCENARIO_CONTEXT = {
    "industrial_spike": {
        "en": "The industrial district load increased by 42% (600 MW → 850 MW).",
        "kz": "Өнеркәсіп ауданының жүктемесі 42%-ға артты (600 МВт → 850 МВт).",
        "ru": "Нагрузка промышленного района выросла на 42% (600 МВт → 850 МВт).",
    },
    "storm": {
        "en": "A storm reduced solar output by 79% (140→30 MW) and wind by 78% (90→20 MW), while residential heating demand rose 15%.",
        "kz": "Дауыл күн энергиясын 79%-ға (140→30 МВт) және жел энергиясын 78%-ға (90→20 МВт) азайтты; тұрғындардың жылыту сұранысы 15%-ға артты.",
        "ru": "Шторм снизил выработку солнечной энергии на 79% (140→30 МВт) и ветра на 78% (90→20 МВт); потребление электроотопления в жилом секторе выросло на 15%.",
    },
    "battery_depletion": {
        "en": "The battery state-of-charge dropped to a critical 12% during evening peak demand.",
        "kz": "Кешкі шарықтау кезінде аккумулятордың заряд деңгейі 12%-ға дейін критикалық деңгейге түсті.",
        "ru": "В период вечернего пика потребления заряд батареи упал до критических 12%.",
    },
    "dual_failure": {
        "en": "The wind farm tripped offline simultaneously with a 42% industrial demand spike.",
        "kz": "Жел электр станциясы өнеркәсіп сұранысының 42%-дық өсуімен бір мезгілде өшіп қалды.",
        "ru": "Ветропарк отключился одновременно со скачком промышленного потребления на 42%.",
    },
}

AGENT_ACTIONS = {
    "industrial_spike": {
        "en": "The agent discharged the battery at 80 MW, maintained residential routing, and drew supplemental power from the substation.",
        "kz": "Агент аккумуляторды 80 МВт қуатпен разрядтады, тұрғын үй маршрутизациясын сақтады және қосалқы станциядан қосымша қуат алды.",
        "ru": "Агент разрядил батарею на 80 МВт, сохранил маршрутизацию в жилом секторе и привлёк дополнительную мощность с подстанции.",
    },
    "storm": {
        "en": "The agent discharged battery reserves to compensate for lost renewables and drew additional power from the external grid.",
        "kz": "Агент жоғалған жаңартылатын энергияны өтеу үшін аккумулятор резервтерін разрядтады және сыртқы желіден қосымша қуат алды.",
        "ru": "Агент разрядил резервы батареи для компенсации потери возобновляемой генерации и привлёк дополнительную мощность из внешней сети.",
    },
    "battery_depletion": {
        "en": "The agent halted battery discharge, redirected available solar generation to recharge the battery, and applied load priority to critical nodes.",
        "kz": "Агент аккумулятордың разрядын тоқтатты, аккумуляторды қайта зарядтау үшін қолжетімді күн энергиясын бағыттады және маңызды түйіндерге жүктеме басымдылығын қолданды.",
        "ru": "Агент остановил разряд батареи, перенаправил доступную солнечную генерацию на подзарядку и применил приоритизацию нагрузки на критических узлах.",
    },
    "dual_failure": {
        "en": "The agent initiated full battery discharge, prioritised residential supply, curtailed industrial load by 20%, and maximised substation draw.",
        "kz": "Агент аккумулятордың толық разрядын бастады, тұрғын үй қуат беруіне басымдық берді, өнеркәсіп жүктемесін 20%-ға қысқартты және қосалқы станция тартымын барынша арттырды.",
        "ru": "Агент инициировал полный разряд батареи, приоритизировал снабжение жилого сектора, снизил промышленную нагрузку на 20% и максимизировал отбор мощности с подстанции.",
    },
}

CARBON_IMPACT = {
    "industrial_spike": {
        "en": "This prevented an emergency coal ramp-up, avoiding approximately 142 kg CO₂.",
        "kz": "Бұл авариялық көмір жүктемесін болдырмады, шамамен 142 кг CO₂ азайтты.",
        "ru": "Это предотвратило аварийный запуск угольной генерации, избежав примерно 142 кг CO₂.",
    },
    "storm": {
        "en": "By maximising battery use before grid draw, the system avoided approximately 98 kg CO₂ from coal backup.",
        "kz": "Торды пайдаланбас бұрын аккумулятордың пайдалануын барынша арттыру арқылы жүйе резервтік көмір генерациясынан шамамен 98 кг CO₂ болдырмады.",
        "ru": "Максимальное использование батареи перед обращением к сети позволило избежать примерно 98 кг CO₂ от резервной угольной генерации.",
    },
    "battery_depletion": {
        "en": "Prioritising solar recharge instead of coal backup preserves 67 kg CO₂ savings for subsequent demand cycles.",
        "kz": "Резервтік көмірдің орнына күн энергиясымен қайта зарядтауға басымдық беру кейінгі сұраныс циклдері үшін 67 кг CO₂ үнемдеуді сақтайды.",
        "ru": "Приоритет солнечной подзарядки вместо угольного резерва сохраняет 67 кг CO₂ экономии для последующих циклов потребления.",
    },
    "dual_failure": {
        "en": "Emergency protocol avoided full coal ramp, saving an estimated 203 kg CO₂ compared to a rule-based system.",
        "kz": "Авариялық хаттама толық көмір жүктемесінің алдын алды, ережеге негізделген жүйемен салыстырғанда шамамен 203 кг CO₂ үнемдеді.",
        "ru": "Аварийный протокол предотвратил полный запуск угля, сэкономив примерно 203 кг CO₂ по сравнению с системой на основе правил.",
    },
}

# ---------------------------------------------------------------------------
# Cache layer 1 — in-memory  {(scenario_id, language): text}
# ---------------------------------------------------------------------------
_MEM_CACHE: Dict[Tuple[str, str], str] = {}

# Cache layer 2 — file-based (loaded once at import time)
_FILE_CACHE: Dict[str, Dict[str, str]] = {}   # {scenario_id: {lang: text}}


def _load_file_cache():
    global _FILE_CACHE
    if os.path.exists(EXPL_CACHE_PATH):
        try:
            with open(EXPL_CACHE_PATH, "r", encoding="utf-8") as f:
                _FILE_CACHE = json.load(f)
            count = sum(len(v) for v in _FILE_CACHE.values())
            print(f"[llm_explain] Loaded {count} cached explanations from {EXPL_CACHE_PATH}")
        except Exception as exc:
            print(f"[llm_explain] Could not read explanations.json ({exc}) — will regenerate.")
            _FILE_CACHE = {}


_load_file_cache()


# ---------------------------------------------------------------------------
# Deterministic fallback (cache layer 3 — always succeeds)
# ---------------------------------------------------------------------------
def _build_fallback(scenario_id: str, language: str) -> str:
    ctx    = SCENARIO_CONTEXT.get(scenario_id, {}).get(language, "")
    action = AGENT_ACTIONS.get(scenario_id, {}).get(language, "")
    carbon = CARBON_IMPACT.get(scenario_id, {}).get(language, "")
    return f"{ctx} {action} {carbon}".strip()


# ---------------------------------------------------------------------------
# NVIDIA NIM call (sync — run in executor to stay non-blocking in async ctx)
# ---------------------------------------------------------------------------
def _call_nim_sync(system: str, user: str) -> str:
    """
    Calls NVIDIA NIM via the OpenAI-compatible SDK.
    Raises on any network / auth / timeout error — caller handles fallback.
    """
    from openai import OpenAI  # imported here so missing package = clear error message

    client = OpenAI(
        base_url=NVIDIA_NIM_BASE_URL,
        api_key=NVIDIA_API_KEY,
    )
    completion = client.chat.completions.create(
        model=NVIDIA_NIM_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.2,
        top_p=0.7,
        max_tokens=300,
        stream=False,
    )
    return completion.choices[0].message.content.strip()


async def _call_nim_async(system: str, user: str) -> str:
    """Runs the sync NIM call in a thread pool so FastAPI's event loop stays free."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _call_nim_sync, system, user)


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------
def _build_user_message(scenario_id: str, language: str, top_features: list) -> str:
    ctx    = SCENARIO_CONTEXT.get(scenario_id, {}).get(language, "")
    action = AGENT_ACTIONS.get(scenario_id, {}).get(language, "")
    carbon = CARBON_IMPACT.get(scenario_id, {}).get(language, "")

    top_str = ", ".join(
        f"{f['name']} ({'+' if f['direction'] == 'up' else ''}{f['shap_value']})"
        for f in top_features[:4]
    )

    instruction = {
        "en": "Generate a concise 2-3 sentence explanation suitable for hackathon judges. Only use the metrics provided above — do not invent numbers.",
        "kz": "Хакатон судьяларына арналған қысқаша 2-3 сөйлемді түсіндірме жасаңыз. Тек жоғарыда берілген көрсеткіштерді пайдаланыңыз — сандарды ойдан шығармаңыз.",
        "ru": "Сформулируйте краткое объяснение из 2–3 предложений для судей хакатона. Используйте только приведённые выше показатели — не придумывайте цифры.",
    }[language]

    label_ctx    = {"en": "Scenario",      "kz": "Сценарий",              "ru": "Сценарий"}[language]
    label_action = {"en": "Agent action",  "kz": "Агент іс-әрекеті",      "ru": "Действие агента"}[language]
    label_shap   = {"en": "Top SHAP drivers", "kz": "Негізгі SHAP факторлары", "ru": "Ключевые факторы SHAP"}[language]
    label_carbon = {"en": "Carbon impact", "kz": "Көміртек әсері",         "ru": "Углеродный эффект"}[language]

    return (
        f"{label_ctx}: {ctx}\n"
        f"{label_action}: {action}\n"
        f"{label_shap}: {top_str}\n"
        f"{label_carbon}: {carbon}\n\n"
        f"{instruction}"
    )


# ---------------------------------------------------------------------------
# Core public API
# ---------------------------------------------------------------------------

async def generate_explanation(
    scenario_id: str,
    language: str,
    shap_top_features: list,
    force_refresh: bool = False,
) -> str:
    """
    Return a natural-language explanation for (scenario_id, language).

    Cache hierarchy:
      1. In-memory cache
      2. explanations.json file cache
      3. NVIDIA NIM live call
      4. Deterministic template fallback

    Parameters
    ----------
    scenario_id       : 'industrial_spike' | 'storm' | 'battery_depletion' | 'dual_failure'
    language          : 'en' | 'kz' | 'ru'
    shap_top_features : list of dicts from SHAPCache.get()['top_features']
    force_refresh     : skip all caches and regenerate via NIM
    """
    if scenario_id not in VALID_SCENARIOS:
        raise ValueError(f"Unknown scenario_id: {scenario_id!r}")
    if language not in VALID_LANGUAGES:
        raise ValueError(f"Unknown language: {language!r}. Valid: {sorted(VALID_LANGUAGES)}")

    cache_key = (scenario_id, language)

    # Layer 1 — memory
    if not force_refresh and cache_key in _MEM_CACHE:
        return _MEM_CACHE[cache_key]

    # Layer 2 — file
    if not force_refresh:
        file_hit = _FILE_CACHE.get(scenario_id, {}).get(language)
        if file_hit:
            _MEM_CACHE[cache_key] = file_hit
            return file_hit

    # Layer 3 — NVIDIA NIM
    if NVIDIA_API_KEY:
        try:
            explanation = await _call_nim_async(
                system=SYSTEM_PROMPTS[language],
                user=_build_user_message(scenario_id, language, shap_top_features),
            )
            _MEM_CACHE[cache_key] = explanation
            return explanation
        except Exception as exc:
            print(f"[llm_explain] NVIDIA NIM error for {scenario_id}/{language} ({exc}) — using fallback.")

    # Layer 4 — deterministic fallback
    explanation = _build_fallback(scenario_id, language)
    _MEM_CACHE[cache_key] = explanation
    return explanation


def generate_explanation_sync(
    scenario_id: str,
    language: str,
    shap_top_features: list,
    force_refresh: bool = False,
) -> str:
    """Synchronous wrapper for non-async callers (e.g. seed_demo_cache.py)."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(
            generate_explanation(scenario_id, language, shap_top_features, force_refresh)
        )
    finally:
        loop.close()


# ---------------------------------------------------------------------------
# Pre-warm — populate memory cache from NIM (or file/fallback) for all 12 pairs
# ---------------------------------------------------------------------------

async def prewarm_all(shap_cache) -> Dict[str, Any]:
    """
    Pre-generate all 4 scenarios × 3 languages = 12 explanations.
    Called during FastAPI startup lifespan.

    shap_cache : SHAPCache instance
    Returns    : {scenario_id: {lang: text}}
    """
    results: Dict[str, Any] = {}
    for scenario_id in sorted(VALID_SCENARIOS):
        results[scenario_id] = {}
        shap_data    = shap_cache.get(scenario_id)
        top_features = shap_data["top_features"] if shap_data else []
        for lang in sorted(VALID_LANGUAGES):
            text = await generate_explanation(scenario_id, lang, top_features)
            results[scenario_id][lang] = text
            print(f"[llm_explain] Pre-warmed {scenario_id}/{lang}")
    return results


# ---------------------------------------------------------------------------
# File cache seeder — run before demo day to write explanations.json
# ---------------------------------------------------------------------------

async def seed_file_cache(shap_cache, force: bool = False) -> str:
    """
    Generate all 12 explanations via NVIDIA NIM and write to
    backend/cache/explanations.json.

    Run once before judging:
        python -c "
        import asyncio, sys
        sys.path.insert(0, '.')
        from backend.services.shap_cache import get_shap_cache
        from backend.services.llm_explain import seed_file_cache
        asyncio.run(seed_file_cache(get_shap_cache(), force=True))
        "

    Parameters
    ----------
    shap_cache : SHAPCache instance
    force      : if True, regenerate even if explanations.json already exists
    Returns    : path to written file
    """
    if os.path.exists(EXPL_CACHE_PATH) and not force:
        print(f"[llm_explain] explanations.json already exists — skipping. Pass force=True to overwrite.")
        return EXPL_CACHE_PATH

    os.makedirs(CACHE_DIR, exist_ok=True)
    data: Dict[str, Any] = {}

    for scenario_id in sorted(VALID_SCENARIOS):
        data[scenario_id] = {}
        shap_data    = shap_cache.get(scenario_id)
        top_features = shap_data["top_features"] if shap_data else []
        for lang in sorted(VALID_LANGUAGES):
            text = await generate_explanation(scenario_id, lang, top_features, force_refresh=True)
            data[scenario_id][lang] = text
            print(f"[llm_explain] seed_file_cache: {scenario_id}/{lang}")

    with open(EXPL_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    # Reload into module-level file cache
    global _FILE_CACHE
    _FILE_CACHE = data
    print(f"[llm_explain] explanations.json written → {EXPL_CACHE_PATH}")
    return EXPL_CACHE_PATH
