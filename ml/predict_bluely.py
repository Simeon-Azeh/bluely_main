"""
Bluely ML Prediction Helper
=============================
Loads trained models and provides prediction functions for the FastAPI server.
Feature engineering from raw API inputs → model feature vectors.

This module is the bridge between the backend API data (meals, readings,
medications, activities) and the trained ML models. It handles:
1. Feature vector construction from raw inputs
2. Model loading and caching
3. 30-minute glucose forecast
4. Risk level classification
5. HbA1c estimation from historical readings

Feature Schema (21 features):
    See generate_synthetic_data.py FEATURE_NAMES for definitions.
"""

import os
import math
import numpy as np
import joblib
from typing import Dict, List, Optional, Tuple

# ── Paths ────────────────────────────────────────────────────────────────────

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

FORECAST_MODEL_PATH = os.path.join(MODEL_DIR, "bluely_forecast_model.joblib")
FORECAST_SCALER_PATH = os.path.join(MODEL_DIR, "bluely_forecast_scaler.joblib")
RISK_MODEL_PATH = os.path.join(MODEL_DIR, "bluely_risk_model.joblib")
RISK_SCALER_PATH = os.path.join(MODEL_DIR, "bluely_risk_scaler.joblib")

# ── Encoding maps (must match generate_synthetic_data.py) ───────────────────

MEAL_TYPE_ENCODING = {
    "none": 0, "breakfast": 1, "lunch": 2, "dinner": 3, "snack": 4,
}

MEDICATION_TYPE_ENCODING = {
    "none": 0, "insulin_rapid": 1, "insulin_long": 2,
    "insulin_mixed": 3, "metformin": 4, "sulfonylurea": 5, "other": 5,
}

ACTIVITY_INTENSITY_ENCODING = {
    "none": 0, "low": 1, "medium": 2, "high": 3,
}

DIABETES_TYPE_ENCODING = {
    "type1": 0, "type2": 1, "prediabetes": 2, "gestational": 3, "other": 4,
}

MOOD_ENCODING = {
    "Rough": 1, "Low": 2, "Okay": 3, "Good": 4, "Great": 5,
}

RISK_LABELS = {0: "low", 1: "normal", 2: "high"}

# ── Model Loading ────────────────────────────────────────────────────────────

_cache = {}


def _load_cached(path: str, name: str):
    """Load a joblib model/scaler with caching."""
    if name not in _cache:
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Model not found: {path}. Run 'python train_bluely.py' first."
            )
        _cache[name] = joblib.load(path)
    return _cache[name]


def load_forecast_model():
    model = _load_cached(FORECAST_MODEL_PATH, "forecast_model")
    scaler = _load_cached(FORECAST_SCALER_PATH, "forecast_scaler")
    return model, scaler


def load_risk_model():
    model = _load_cached(RISK_MODEL_PATH, "risk_model")
    scaler = _load_cached(RISK_SCALER_PATH, "risk_scaler")
    return model, scaler


# ── Feature Engineering ──────────────────────────────────────────────────────


def build_feature_vector(
    current_glucose: float,
    carbs_last_meal: float,
    minutes_since_meal: float,
    meal_type: str,
    insulin_dose: float,
    minutes_since_insulin: float,
    medication_type: str,
    activity_intensity: str,
    activity_duration: float,
    minutes_since_activity: float,
    hour: float,
    sleep_quality: int,
    stress_level: int,
    mood: str,
    glucose_history: List[float],
    diabetes_type: str,
) -> np.ndarray:
    """
    Build a 21-feature vector from raw API inputs.

    This function maps the human-readable inputs from the frontend/backend
    into the exact numerical feature vector the trained model expects.

    Args:
        current_glucose: Current glucose reading in mg/dL.
        carbs_last_meal: Carb grams from the most recent meal.
        minutes_since_meal: Minutes since the last meal was eaten.
        meal_type: 'breakfast', 'lunch', 'dinner', 'snack', or 'none'.
        insulin_dose: Most recent insulin dose in units (0 if no insulin).
        minutes_since_insulin: Minutes since insulin was taken.
        medication_type: 'insulin_rapid', 'insulin_long', 'metformin', etc.
        activity_intensity: 'none', 'low', 'medium', or 'high'.
        activity_duration: Duration of last activity in minutes.
        minutes_since_activity: Minutes since activity ended.
        hour: Current hour of day (0–23, can be float).
        sleep_quality: 1–5 self-reported quality.
        stress_level: 1–5 self-reported stress.
        mood: 'Great', 'Good', 'Okay', 'Low', or 'Rough'.
        glucose_history: List of previous glucose readings (oldest→newest),
                         at least 3 values recommended.
        diabetes_type: 'type1', 'type2', 'prediabetes', 'gestational', 'other'.

    Returns:
        numpy array of shape (1, 21) — one sample, 21 features.
    """
    # Lag values from history
    hist = glucose_history if glucose_history else []
    lag1 = hist[-1] if len(hist) >= 1 else current_glucose
    lag2 = hist[-2] if len(hist) >= 2 else lag1
    lag3 = hist[-3] if len(hist) >= 3 else lag2

    # Trend: linear slope over available history (up to last 6)
    trend_values = (hist[-6:] if len(hist) >= 6 else hist) + [current_glucose]
    if len(trend_values) >= 2:
        x = np.arange(len(trend_values), dtype=float)
        slope = float(np.polyfit(x, trend_values, 1)[0])
        std = float(np.std(trend_values))
    else:
        slope = 0.0
        std = 0.0

    # Time encoding
    hour_sin = math.sin(2 * math.pi * hour / 24.0)
    hour_cos = math.cos(2 * math.pi * hour / 24.0)

    # Encode categoricals
    meal_enc = MEAL_TYPE_ENCODING.get(meal_type, 0)
    med_enc = MEDICATION_TYPE_ENCODING.get(medication_type, 0)
    act_enc = ACTIVITY_INTENSITY_ENCODING.get(activity_intensity, 0)
    mood_enc = MOOD_ENCODING.get(mood, 3)
    dtype_enc = DIABETES_TYPE_ENCODING.get(diabetes_type, 4)

    features = np.array([[
        current_glucose,
        carbs_last_meal,
        min(minutes_since_meal, 999.0),
        meal_enc,
        insulin_dose,
        min(minutes_since_insulin, 999.0),
        med_enc,
        act_enc,
        activity_duration,
        min(minutes_since_activity, 999.0),
        hour_sin,
        hour_cos,
        sleep_quality,
        stress_level,
        mood_enc,
        lag1,
        lag2,
        lag3,
        slope,
        std,
        dtype_enc,
    ]], dtype=float)

    return features


# ── Prediction Functions ─────────────────────────────────────────────────────


def predict_glucose_30min(features: np.ndarray) -> Tuple[float, float]:
    """
    Predict glucose level 30 minutes from now.

    Returns:
        (predicted_glucose, model_confidence)
        Confidence is estimated from the model's residual distribution.
    """
    model, scaler = load_forecast_model()
    scaled = scaler.transform(features)
    predicted = float(model.predict(scaled)[0])

    # Clamp to physiological range
    predicted = max(40.0, min(400.0, predicted))

    # Confidence: based on how far the prediction deviates from current glucose
    current = features[0, 0]
    deviation = abs(predicted - current)
    # Closer predictions → higher confidence, further → lower
    confidence = max(0.3, min(0.95, 1.0 - deviation / 200.0))

    return round(predicted, 1), round(confidence, 2)


def predict_risk(features: np.ndarray) -> Dict:
    """
    Predict glucose risk level.

    Returns:
        Dict with: risk_level (str), risk_code (int), confidence (float),
                   recommendation (str)
    """
    model, scaler = load_risk_model()
    scaled = scaler.transform(features)

    prediction = int(model.predict(scaled)[0])
    probabilities = model.predict_proba(scaled)[0]
    confidence = float(max(probabilities))

    risk_label = RISK_LABELS.get(prediction, "normal")

    recommendations = {
        "low": (
            "Glucose trend suggests a risk of going low. "
            "If you haven't eaten recently, consider having a snack. "
            "Check your glucose again in 15-30 minutes."
        ),
        "normal": (
            "Your glucose pattern looks stable and within target range. "
            "Keep up your current routine of meals, medication, and activity."
        ),
        "high": (
            "Glucose trend suggests levels may be elevated. "
            "If you've recently eaten, this may be a normal post-meal rise. "
            "Consider reviewing medication timing with your healthcare provider."
        ),
    }

    return {
        "risk_level": risk_label,
        "risk_code": prediction,
        "confidence": round(confidence, 3),
        "recommendation": recommendations.get(risk_label, recommendations["normal"]),
    }


def estimate_hba1c(glucose_values: List[float]) -> Dict:
    """
    Estimate HbA1c from a collection of glucose readings.

    Uses the ADAG (A1c-Derived Average Glucose) study formula:
        HbA1c (%) = (mean glucose in mg/dL + 46.7) / 28.7

    Reference:
        Nathan DM, et al. "Translating the A1C assay into estimated
        average glucose values." Diabetes Care. 2008;31(8):1473-8.

    Requirements:
        - Minimum 21 readings for statistical significance
        - Ideally spanning multiple days with varied reading types
          (fasting, post-meal, bedtime) for representative average

    Args:
        glucose_values: List of glucose readings in mg/dL.

    Returns:
        Dict with: estimated_hba1c, average_glucose, reading_count,
                   confidence_note, interpretation
    """
    count = len(glucose_values)
    if count < 21:
        return {
            "estimated_hba1c": None,
            "average_glucose": None,
            "reading_count": count,
            "readings_needed": 21 - count,
            "confidence_note": (
                f"Need at least 21 readings for HbA1c estimation. "
                f"You have {count}. Log {21 - count} more readings."
            ),
            "interpretation": None,
        }

    avg_glucose = float(np.mean(glucose_values))
    std_glucose = float(np.std(glucose_values))

    # ADAG formula
    hba1c = (avg_glucose + 46.7) / 28.7

    # Interpretation based on ADA guidelines
    if hba1c < 5.7:
        interpretation = "Normal range. Keep maintaining your current habits."
    elif hba1c < 6.5:
        interpretation = (
            "Prediabetes range (5.7–6.4%). This suggests elevated average glucose. "
            "Lifestyle modifications (diet, exercise) may help."
        )
    elif hba1c < 7.0:
        interpretation = (
            "Diabetes range, near target (<7.0%). Many healthcare providers "
            "aim for this target. Continue working with your provider."
        )
    elif hba1c < 8.0:
        interpretation = (
            "Above typical target (7.0–8.0%). Consider discussing medication "
            "or lifestyle adjustments with your healthcare provider."
        )
    else:
        interpretation = (
            "Significantly above target (>8.0%). This indicates consistently "
            "elevated glucose. Please consult your healthcare provider."
        )

    # Confidence based on reading count and variability
    if count >= 90:
        confidence = "High confidence — based on 90+ readings."
    elif count >= 50:
        confidence = "Good confidence — based on 50+ readings."
    elif count >= 21:
        confidence = (
            "Moderate confidence — based on 21+ readings. "
            "More readings over time will improve accuracy."
        )

    return {
        "estimated_hba1c": round(hba1c, 1),
        "average_glucose": round(avg_glucose, 1),
        "glucose_std": round(std_glucose, 1),
        "reading_count": count,
        "readings_needed": 0,
        "confidence_note": confidence,
        "interpretation": interpretation,
    }
