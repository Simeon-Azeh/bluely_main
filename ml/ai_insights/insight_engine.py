"""
AI Insight Engine
==================
Core engine that generates human-readable AI insights for glucose predictions
and health summaries. Combines LLM generation with rule-based fallbacks.

Pipeline:
  1. Build context prompt from prediction/reading data
  2. Attempt LLM generation (DeepSeek → OpenAI → Ollama)
  3. Sanitize LLM output for medical safety
  4. Fall back to rule-based templates if LLM fails

Used by:
  - /predict-glucose-30 endpoint (per-prediction insight)
  - /diabuddy/summarize endpoint (full health summary)
"""

import re
from typing import Dict, Optional, List
from .llm_interface import LLMInterface
from .insight_templates import get_rule_based_insight, get_summary_template


# Words/phrases that should NEVER appear in output
BANNED_PHRASES = [
    "you should take",
    "increase your dose",
    "decrease your dose",
    "stop taking",
    "diagnosed with",
    "you have diabetes",
    "prescribe",
    "prescription",
    "start taking",
    "change your medication",
    "adjust your insulin",
]

_llm = LLMInterface()


def _sanitize_output(text: str) -> str:
    """
    Remove any unsafe medical advice from LLM output.
    Replaces banned phrases with safe alternatives.
    """
    result = text
    for phrase in BANNED_PHRASES:
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        result = pattern.sub("consider discussing with your healthcare provider", result)

    # Remove any residual markdown formatting
    result = result.replace("**", "").replace("##", "").replace("###", "")

    return result.strip()


def _build_prediction_prompt(prediction_data: Dict) -> str:
    """
    Build a prompt for per-prediction insight generation.

    Args:
        prediction_data: Dict with keys like predicted_glucose, risk_level,
                        current_glucose, meal_type, insulin_dose, etc.
    """
    predicted = prediction_data.get("predicted_glucose", "unknown")
    risk = prediction_data.get("risk_level", "unknown")
    current = prediction_data.get("current_glucose", "unknown")
    meal = prediction_data.get("meal_type", "none")
    insulin = prediction_data.get("insulin_dose", 0)
    activity = prediction_data.get("activity_minutes", 0)
    carbs = prediction_data.get("carb_intake", 0)
    personalized = prediction_data.get("personalized", False)

    prompt = f"""A diabetes patient just received the following glucose prediction:
- Current glucose: {current} mg/dL
- Predicted glucose (30 min): {predicted} mg/dL
- Risk level: {risk}
- Recent meal: {meal} ({carbs}g carbs)
- Insulin dose: {insulin} units
- Activity: {activity} minutes

{"This prediction was personalized based on their historical patterns." if personalized else "This uses the general prediction model."}

In 2-3 sentences, explain this prediction in plain language. Mention which factors likely influenced the result most. End with one brief practical observation."""

    return prompt


def _build_summary_prompt(readings_data: List[Dict], profile_data: Dict) -> str:
    """
    Build a prompt for DiaBuddy health summary generation.

    Args:
        readings_data: List of recent glucose readings with metadata.
        profile_data: User health profile info.
    """
    if not readings_data:
        return "The patient has no recent glucose readings. Provide an encouraging message about starting to track their glucose levels."

    # Compute summary stats
    values = [r.get("value", 0) for r in readings_data if r.get("value")]
    if not values:
        return "The patient has limited glucose data. Provide encouragement about building a tracking habit."

    avg = sum(values) / len(values)
    min_val = min(values)
    max_val = max(values)
    in_range = sum(1 for v in values if 70 <= v <= 180)
    time_in_range = (in_range / len(values)) * 100 if values else 0

    # Count highs and lows
    highs = sum(1 for v in values if v > 180)
    lows = sum(1 for v in values if v < 70)

    diabetes_type = profile_data.get("diabetes_type", "unknown")
    name = profile_data.get("name", "there")

    prompt = f"""Generate a friendly DiaBuddy health summary for {name}. Here's their recent data:

- Readings count: {len(values)} over recent period
- Average glucose: {avg:.0f} mg/dL
- Range: {min_val} - {max_val} mg/dL
- Time in range (70-180): {time_in_range:.0f}%
- High readings (>180): {highs}
- Low readings (<70): {lows}
- Diabetes type: {diabetes_type}

Provide a warm, supportive summary in 4-6 sentences:
1. Greet them and give an overview of their glucose control
2. Highlight what's going well (positive reinforcement)
3. If there are patterns worth noting (too many highs/lows), mention gently
4. End with one encouraging, actionable suggestion

Remember to be supportive and never alarming. Use "around" for numbers."""

    return prompt


async def generate_ai_insight(prediction_data: Dict) -> Dict:
    """
    Generate an AI insight for a single prediction.

    Returns:
        Dict with keys: insight (str), source ("ai"|"rule-based"), provider (str|None)
    """
    prompt = _build_prediction_prompt(prediction_data)

    # Try LLM first
    llm_response = await _llm.generate(prompt, max_tokens=200, temperature=0.7)

    if llm_response:
        sanitized = _sanitize_output(llm_response)
        return {
            "insight": sanitized,
            "source": "ai",
            "provider": _llm.get_active_provider(),
        }

    # Fallback to rule-based templates
    rule_insight = get_rule_based_insight(prediction_data)
    return {
        "insight": rule_insight,
        "source": "rule-based",
        "provider": None,
    }


async def generate_summary_insight(
    readings_data: List[Dict], profile_data: Dict
) -> Dict:
    """
    Generate a DiaBuddy health summary from recent readings.

    Returns:
        Dict with keys: summary (str), source ("ai"|"rule-based"), provider (str|None)
    """
    prompt = _build_summary_prompt(readings_data, profile_data)

    # Try LLM first
    llm_response = await _llm.generate(prompt, max_tokens=400, temperature=0.7)

    if llm_response:
        sanitized = _sanitize_output(llm_response)
        return {
            "summary": sanitized,
            "source": "ai",
            "provider": _llm.get_active_provider(),
        }

    # Fallback to rule-based summary
    values = [r.get("value", 0) for r in readings_data if r.get("value")]
    avg_val = sum(values) / len(values) if values else 0
    in_range = sum(1 for v in values if 70 <= v <= 180)
    tir = (in_range / len(values)) * 100 if values else 0

    rule_summary = get_summary_template(
        reading_count=len(values),
        avg_glucose=avg_val,
        time_in_range=tir,
        name=profile_data.get("name", "there"),
    )
    return {
        "summary": rule_summary,
        "source": "rule-based",
        "provider": None,
    }
