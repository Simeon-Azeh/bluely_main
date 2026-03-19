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


def _build_summary_prompt(readings_data: List[Dict], profile_data: Dict, preferred_unit: str = 'mg/dL') -> str:
    """
    Build a prompt for DiaBuddy health summary generation.

    Args:
        readings_data: List of recent glucose readings with metadata.
        profile_data: User health profile info.
        preferred_unit: The user's preferred display unit ('mg/dL' or 'mmol/L').
    """
    if not readings_data:
        return "The patient has no recent glucose readings. Provide an encouraging message about starting to track their glucose levels."

    # Compute summary stats (values stored as mg/dL)
    values = [r.get("value", 0) for r in readings_data if r.get("value")]
    if not values:
        return "The patient has limited glucose data. Provide encouragement about building a tracking habit."

    MMOL = 18.0182
    is_mmol = preferred_unit == 'mmol/L'

    def to_display(mgdl: float) -> str:
        if is_mmol:
            return f"{round(mgdl / MMOL, 1):.1f} {preferred_unit}"
        return f"{round(mgdl):.0f} {preferred_unit}"

    avg = sum(values) / len(values)
    min_val = min(values)
    max_val = max(values)

    # Target range in native unit
    target_min = profile_data.get('targetMin', 70)
    target_max = profile_data.get('targetMax', 180)
    in_range = sum(1 for v in values if target_min <= v <= target_max)
    time_in_range = (in_range / len(values)) * 100 if values else 0

    # Count highs and lows (use numeric targets for flexibility)
    highs = sum(1 for v in values if v > target_max)
    lows = sum(1 for v in values if v < target_min)

    target_min_display = to_display(target_min)
    target_max_display = to_display(target_max)

    diabetes_type = profile_data.get("diabetes_type", "unknown")
    name = profile_data.get("name", "there")

    prompt = f"""Generate a friendly DiaBuddy health summary for {name}. Here's their recent data:

- Readings count: {len(values)} over recent period
- Average glucose: {to_display(avg)}
- Range: {to_display(min_val)} - {to_display(max_val)}
- Time in range ({target_min_display} - {target_max_display}): {time_in_range:.0f}%
- High readings (>{target_max_display}): {highs}
- Low readings (<{target_min_display}): {lows}
- Diabetes type: {diabetes_type}
- Preferred unit: {preferred_unit}

Provide a warm, supportive summary in 4-6 sentences:
1. Greet them and give an overview of their glucose control
2. Highlight what's going well (positive reinforcement)
3. If there are patterns worth noting (too many highs/lows), mention gently
4. End with one encouraging, actionable suggestion

ALWAYS use {preferred_unit} when mentioning glucose values. Never use mg/dL if preferred unit is mmol/L.
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
    readings_data: List[Dict], profile_data: Dict, preferred_unit: str = 'mg/dL'
) -> Dict:
    """
    Generate a DiaBuddy health summary from recent readings.

    Returns:
        Dict with keys: summary (str), source ("ai"|"rule-based"), provider (str|None)
    """
    prompt = _build_summary_prompt(readings_data, profile_data, preferred_unit)

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
    MMOL = 18.0182
    is_mmol = preferred_unit == 'mmol/L'
    values = [r.get("value", 0) for r in readings_data if r.get("value")]
    avg_val = sum(values) / len(values) if values else 0
    target_min = profile_data.get('targetMin', 70)
    target_max = profile_data.get('targetMax', 180)
    in_range = sum(1 for v in values if target_min <= v <= target_max)
    tir = (in_range / len(values)) * 100 if values else 0

    # Convert avg for display
    display_avg = round(avg_val / MMOL, 1) if is_mmol else round(avg_val)

    rule_summary = get_summary_template(
        reading_count=len(values),
        avg_glucose=display_avg,
        time_in_range=tir,
        name=profile_data.get("name", "there"),
        preferred_unit=preferred_unit,
    )
    return {
        "summary": rule_summary,
        "source": "rule-based",
        "provider": None,
    }


def generate_missing_data_explanation(missing_inputs: list[dict]) -> str:
    """
    Generate a clear explanation for why certain data inputs are missing and important.
    
    Args:
        missing_inputs: List of dicts with keys: field, label, reason, importance
        
    Returns:
        Human-readable explanation of missing data
    """
    if not missing_inputs:
        return ""
    
    # Group by importance
    critical = [m for m in missing_inputs if m.get("importance") == "critical"]
    high = [m for m in missing_inputs if m.get("importance") == "high"]
    
    parts = [
        "I couldn't generate a forecast yet because some important information is missing:"
    ]
    
    # Explain critical inputs
    for inp in critical:
        label = inp.get("label", "Data")
        reason = inp.get("reason", "This information is needed for accurate predictions.")
        
        if inp.get("field") == "glucose":
            parts.append(f"\n[Glucose] {label}: {reason}")
        elif inp.get("field") == "meal" or inp.get("field") == "mealCarbs":
            parts.append(f"\n[Meal] {label}: {reason}")
        elif inp.get("field") == "medication":
            parts.append(f"\n[Medication] {label}: {reason}")
        elif inp.get("field") == "activity":
            parts.append(f"\n[Activity] {label}: {reason}")
        else:
            parts.append(f"\n• {label}: {reason}")
    
    # Mention high priority if present
    if high:
        parts.append("\nAlso helpful to know:")
        for inp in high:
            label = inp.get("label", "Data")
            reason = inp.get("reason", "")
            parts.append(f"• {label}: {reason}")
    
    # Closing statement
    parts.append(
        "\nWithout these pieces, the forecast would be a guess rather than a personalized prediction. "
        "Want to log them now?"
    )
    
    return "".join(parts)
