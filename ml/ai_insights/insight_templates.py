"""
Rule-Based Insight Templates
==============================
Fallback insight generation when LLM is unavailable.
Uses predefined templates driven by prediction data and feature values.

All language is:
  - Observational ("Your glucose appears to be…")
  - Non-directive ("You might consider…" not "You should…")
  - Non-diagnostic (no disease claims)
"""

from typing import Dict, List, Optional


def get_rule_based_insight(
    predicted_glucose: float,
    current_glucose: float,
    risk_level: str,
    direction: str,
    features: Optional[Dict] = None,
    prediction_source: str = "global_model",
) -> str:
    """
    Generate a human-readable insight using rule-based templates.

    Args:
        predicted_glucose: Predicted glucose in 30 minutes (mg/dL).
        current_glucose: Current glucose reading (mg/dL).
        risk_level: 'low', 'normal', or 'high'.
        direction: 'rising', 'stable', or 'dropping'.
        features: Optional dict of input features for context.
        prediction_source: 'global_model' or 'personalized_model'.

    Returns:
        Human-readable insight string.
    """
    features = features or {}
    parts: List[str] = []

    # Opening — state the prediction
    delta = predicted_glucose - current_glucose
    if direction == "rising":
        parts.append(
            f"Your glucose is expected to rise from {current_glucose:.0f} to "
            f"approximately {predicted_glucose:.0f} mg/dL over the next 30 minutes."
        )
    elif direction == "dropping":
        parts.append(
            f"Your glucose is expected to decrease from {current_glucose:.0f} to "
            f"approximately {predicted_glucose:.0f} mg/dL over the next 30 minutes."
        )
    else:
        parts.append(
            f"Your glucose appears stable around {current_glucose:.0f} mg/dL "
            f"and is expected to remain near {predicted_glucose:.0f} mg/dL."
        )

    # Explain contributing factors
    factors = _explain_factors(features, direction, delta)
    if factors:
        parts.append(" ".join(factors))

    # Risk-specific guidance
    if risk_level == "high":
        parts.append(
            "This pattern suggests glucose may stay above the typical target range. "
            "Staying hydrated and light activity after meals may help. "
            "Consider discussing persistent patterns with your healthcare provider."
        )
    elif risk_level == "low":
        parts.append(
            "This trend suggests glucose could approach the lower range. "
            "If you haven't eaten recently, a small snack might be helpful. "
            "Monitoring again in 15-30 minutes could provide useful information."
        )
    else:
        parts.append(
            "This pattern looks stable and within a typical range. "
            "Maintaining your current routine appears to be working well."
        )

    # Personalization note
    if prediction_source == "personalized_model":
        parts.append(
            "This prediction has been calibrated using your personal glucose history "
            "for improved accuracy."
        )

    return " ".join(parts)


def _explain_factors(features: Dict, direction: str, delta: float) -> List[str]:
    """Build factor explanation sentences from input features."""
    explanations = []

    # Meal impact
    carbs = features.get("carbs_last_meal", 0) or features.get("carbs_consumed", 0)
    mins_since_meal = features.get("minutes_since_meal", 999)
    if carbs > 0 and mins_since_meal < 120:
        if direction == "rising":
            explanations.append(
                f"A recent meal ({carbs:.0f}g carbs, {mins_since_meal:.0f} minutes ago) "
                f"is likely contributing to the upward trend."
            )
        else:
            explanations.append(
                f"Despite a recent meal ({carbs:.0f}g carbs), other factors appear to be "
                f"balancing the glucose response."
            )

    # Insulin/medication impact
    insulin_dose = features.get("insulin_dose", 0)
    mins_since_insulin = features.get("minutes_since_insulin", 999)
    if insulin_dose > 0 and mins_since_insulin < 240:
        if direction == "dropping":
            explanations.append(
                f"Medication taken {mins_since_insulin:.0f} minutes ago may be contributing "
                f"to the downward movement."
            )
        elif direction == "stable":
            explanations.append(
                f"Medication taken {mins_since_insulin:.0f} minutes ago appears to be helping "
                f"maintain stability."
            )

    # Activity impact
    activity_intensity = features.get("activity_intensity", "none")
    activity_duration = features.get("activity_duration", 0)
    mins_since_activity = features.get("minutes_since_activity", 999)
    if activity_intensity != "none" and activity_duration > 0 and mins_since_activity < 180:
        explanations.append(
            f"Recent {activity_intensity}-intensity activity ({activity_duration:.0f} minutes) "
            f"may be influencing glucose levels."
        )

    # Stress
    stress = features.get("stress_level", 3)
    if stress >= 4:
        explanations.append(
            "Elevated stress levels can temporarily increase insulin resistance, "
            "which may contribute to higher glucose readings."
        )

    # Sleep
    sleep = features.get("sleep_quality", 3)
    if sleep <= 2:
        explanations.append(
            "Poor sleep quality has been associated with increased insulin resistance "
            "and glucose variability."
        )

    return explanations


def get_summary_template(
    readings_count: int,
    avg_glucose: float,
    time_in_range: float,
    recent_trend: str = 'stable',
    risk_distribution: Optional[Dict] = None,
    name: str = 'there',
    preferred_unit: str = 'mg/dL',
) -> str:
    """
    Generate a rule-based summary of the user's recent glucose data.
    Used as fallback when LLM is unavailable for the DiaBuddy summary.

    Args:
        readings_count: Number of readings in the analysis period.
        avg_glucose: Average glucose already converted to the preferred unit.
        time_in_range: Percentage of readings in target range.
        recent_trend: 'improving', 'stable', or 'worsening'.
        risk_distribution: Optional dict with 'low', 'normal', 'high' percentages.
        name: User's first name.
        preferred_unit: Display unit ('mg/dL' or 'mmol/L').

    Returns:
        Summary text string.
    """
    is_mmol = preferred_unit == 'mmol/L'
    avg_display = f"{avg_glucose:.1f} {preferred_unit}" if is_mmol else f"{int(avg_glucose)} {preferred_unit}"

    parts = []

    # Overview
    parts.append(
        f"Hey {name}! Based on your {readings_count} recent glucose readings, "
        f"your average glucose is around {avg_display}."
    )

    # Time in range
    if time_in_range >= 70:
        parts.append(
            f"Great news — {time_in_range:.0f}% of your readings are within "
            f"your target range. That's excellent management!"
        )
    elif time_in_range >= 50:
        parts.append(
            f"About {time_in_range:.0f}% of your readings are within target range. "
            f"There's room for improvement, and consistent logging can help identify patterns."
        )
    else:
        parts.append(
            f"Currently {time_in_range:.0f}% of readings are within target range. "
            f"Identifying patterns in meals, activity, and medication timing "
            f"may help improve this over time."
        )

    # Trend
    if recent_trend == "improving":
        parts.append("Your glucose trend appears to be improving — keep up the good work!")
    elif recent_trend == "worsening":
        parts.append(
            "Recent trends suggest some variability. Reviewing meal timing "
            "and activity patterns with your care team could be helpful."
        )
    else:
        parts.append("Your glucose levels have been relatively stable recently.")

    # Encouragement
    parts.append(
        "Remember, consistent logging helps DiaBuddy learn your patterns "
        "and provide more personalized insights over time."
    )

    return " ".join(parts)
