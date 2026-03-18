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


def apply_pk_correction(
    predicted_glucose: float,
    current_glucose: float,
    insulin_dose: float,
    minutes_since_insulin: float,
    medication_type: str,
    activity_intensity: str = 'none',
    activity_duration: float = 0.0,
    minutes_since_activity: float = 999.0,
    diabetes_type: str = 'type2',
    stress_level: int = 3,
    sleep_quality: int = 3,
    carbs_last_meal: float = 0.0,
    minutes_since_meal: float = 999.0,
    hour: float = 12.0,
) -> Tuple[float, float]:
    """
    Pharmacokinetic (PK) & Physiological post-prediction correction layer.

    ══════════════════════════════════════════════════════════════════════════
    PURPOSE
    ──────────────────────────────────────────────────────────────────────────
    This is NOT a model override. It is a physiological correction layer that
    runs AFTER the ML model prediction, to correct for scenarios where the
    training data distribution leads to systematic prediction errors.

    All corrections use the same gamma-curve and exercise-effect formulas that
    were used to generate the training data (generate_synthetic_data.py), so
    the physiological constants are all internally consistent.

    ══════════════════════════════════════════════════════════════════════════
    SCENARIO COVERAGE (8 scenarios)
    ──────────────────────────────────────────────────────────────────────────
    S1 — Correction bolus (rapid insulin post-meal)
         The primary scenario this function was built for. Model sees
         minutes_since_insulin=0 and predicts "stable" because training data
         almost exclusively shows insulin + meal starting together. For
         correction bolus (insulin given 2+ hrs after meal), physiology
         dominates. PK weight: 0.45 (high glucose) / 0.25 (normal glucose).

    S2 — High-dose rapid insulin (stacked / over-correction risk)
         Dose > 25U for type2, > 20U for type1. Risk of over-correction is
         elevated. PK weight bumped to 0.60 when also high glucose + fresh
         insulin. Confidence penalty raised to 0.35 to signal higher
         uncertainty.

    S3 — Stress dampening of insulin effect
         High stress (level ≥ 4) raises cortisol, which counteracts insulin
         via gluconeogenesis. When stress is elevated, the expected insulin
         drop is reduced by 20% (conservative; training data reflects the
         average stress participant, not high-stress edge cases).

    S4 — Gastroparesis / slow carb absorption
         When carbs were high (> 60g) and it has been 120–200 min since the
         meal but glucose is not yet dropping, active absorption may still be
         ongoing. This reduces PK weight by 30% to prevent over-predicting
         the insulin drop.

    S5 — Long-acting insulin basal effect
         insulin_long has no correction bolus effect in 30 min but does
         provide a steady downward bias. Conservative 3–6 mg/dL expected
         drop over 30 min if taken within 4 hours.

    S6 — Oral medication (metformin / sulfonylurea) subtle effect
         These lower glucose slowly over hours. If taken within 2 hours, add
         a very small correction bias (2–4 mg/dL over 30 min) to nudge the
         prediction slightly downward.

    S7 — Delayed post-exercise hypoglycemia window
         2–4 hours after high-intensity activity, insulin sensitivity
         increases significantly (GLUT4 mobilisation, lactic acid clearance).
         If the model didn't fully capture this, add an extra 15% on the
         activity drop for the 120–360 min window.

    S8 — Dawn phenomenon resistance
         Between 04:00–07:00, cortisol + growth hormone surges increase
         insulin resistance. If the model predicts dropping during this
         window, it is likely underestimating the resistance effect. Apply a
         +8 mg/dL counteracting bias.

    ══════════════════════════════════════════════════════════════════════════
    BLENDING PHILOSOPHY
    ──────────────────────────────────────────────────────────────────────────
    All corrections use conservative blend weights (0.10–0.60). The ML model
    always retains at least 40% weight (except high-dose stacked bolus where
    physiological risk is highest). This ensures the model's learned patterns
    are preserved; we only nudge where physiology is unambiguous.

    Args:
        predicted_glucose:      Raw ML model output (mg/dL).
        current_glucose:        Current reading (mg/dL).
        insulin_dose:           Insulin dose in units.
        minutes_since_insulin:  Minutes since injection.
        medication_type:        'insulin_rapid', 'insulin_mixed', 'insulin_long',
                                'metformin', 'sulfonylurea', 'none', etc.
        activity_intensity:     'none', 'low', 'medium', 'high'.
        activity_duration:      Activity duration (minutes).
        minutes_since_activity: Minutes since activity started.
        diabetes_type:          'type1', 'type2', 'prediabetes', 'gestational', 'other'.
        stress_level:           1–5 self-reported stress (default 3 = neutral).
        sleep_quality:          1–5 self-reported sleep quality (default 3 = neutral).
        carbs_last_meal:        Grams of carbs in last meal.
        minutes_since_meal:     Minutes since last meal.
        hour:                   Current hour of day (0–23).

    Returns:
        (corrected_glucose, confidence_penalty)
        confidence_penalty: value to subtract from raw model confidence (0.0–0.40).
                            Higher = the model is more uncertain due to active PK factors.
    """
    # Conservative ISF by diabetes type (lower-end of training profiles to avoid over-correction).
    # Matches the ISF ranges used in generate_synthetic_data.py patient profiles.
    isf_by_type = {
        'type1': 30.0, 'type2': 18.0, 'prediabetes': 22.0,
        'gestational': 20.0, 'other': 20.0,
    }
    isf = isf_by_type.get(diabetes_type, 18.0)

    # High-dose threshold: above this, stacked-bolus / over-correction risk applies
    high_dose_threshold = 20.0 if diabetes_type == 'type1' else 25.0

    # ──────────────────────────────────────────────────────────────────────────
    # S5: Long-acting insulin basal effect
    # insulin_long provides a gentle basal reduction. If taken within 4 hours
    # (240 min), nudge the prediction ~3–6 mg/dL downward. We use a very low
    # PK weight (0.08) because the ML model is reasonably calibrated for basal
    # insulin — this is just a small corrective nudge.
    # ──────────────────────────────────────────────────────────────────────────
    if medication_type == 'insulin_long' and insulin_dose > 0 and minutes_since_insulin < 240:
        # Basal delivers ~0.5–1 U/hr for a long-acting dose; over 30 min the effect
        # on glucose is subtle: 3–6 mg/dL depending on dose.
        basal_drop = min(6.0, insulin_dose * 0.10)  # very conservative
        pk_basal_prediction = max(40.0, current_glucose - basal_drop)
        pk_basal_weight = 0.08
        corrected_basal = (1.0 - pk_basal_weight) * predicted_glucose + pk_basal_weight * pk_basal_prediction
        return round(max(40.0, min(400.0, corrected_basal)), 1), 0.0  # no confidence penalty for basal

    # ──────────────────────────────────────────────────────────────────────────
    # S6: Oral medication subtle effect (metformin / sulfonylurea)
    # These medications lower glucose slowly (over hours). If taken within
    # 120 min, nudge the prediction slightly downward — 2–4 mg/dL max.
    # Very low PK weight (0.06): these drugs don't change 30-min outcomes much.
    # ──────────────────────────────────────────────────────────────────────────
    if medication_type in ('metformin', 'sulfonylurea') and insulin_dose > 0 and minutes_since_insulin < 120:
        oral_drop = min(4.0, insulin_dose * 0.01)  # tiny effect over 30 min
        pk_oral_prediction = max(40.0, current_glucose - oral_drop)
        pk_oral_weight = 0.06
        corrected_oral = (1.0 - pk_oral_weight) * predicted_glucose + pk_oral_weight * pk_oral_prediction
        return round(max(40.0, min(400.0, corrected_oral)), 1), 0.0

    # ── All remaining scenarios require rapid or mixed insulin ────────────────
    if medication_type not in ('insulin_rapid', 'insulin_mixed'):
        # ──────────────────────────────────────────────────────────────────────
        # S7 (activity-only path): Delayed post-exercise hypoglycemia
        # Even without any insulin, high-intensity exercise 2–4h ago can produce
        # a sustained increase in insulin sensitivity that the model may miss.
        # ──────────────────────────────────────────────────────────────────────
        if activity_intensity == 'high' and activity_duration > 0:
            t_post = max(0.0, minutes_since_activity - activity_duration)
            if 120 <= t_post <= 360:
                # Add 15% extra drop to whatever the model already expects
                delayed_extra = 0.0
                for dt in range(0, 30, 5):
                    t_p = t_post + dt
                    rate = 15.0 * 1.0 * min(activity_duration / 30.0, 2.0) * math.exp(-t_p / 120.0)
                    delayed_extra += rate * 0.10 * 0.15  # 15% of training exercise formula
                if delayed_extra >= 2.0:
                    pk_delayed_prediction = max(40.0, predicted_glucose - delayed_extra)
                    pk_delayed_weight = 0.12
                    corrected_delayed = (1.0 - pk_delayed_weight) * predicted_glucose + pk_delayed_weight * pk_delayed_prediction
                    return round(max(40.0, min(400.0, corrected_delayed)), 1), 0.05
        return predicted_glucose, 0.0

    if insulin_dose <= 0 or minutes_since_insulin >= 120:
        return predicted_glucose, 0.0

    # ──────────────────────────────────────────────────────────────────────────
    # Compute expected rapid-insulin glucose drop over the NEXT 30 min
    # using the same gamma-curve formula as generate_synthetic_data.py.
    # Step size: 5 min. Multiplier: 0.18 (training simulation step scale).
    # ──────────────────────────────────────────────────────────────────────────
    tau = 50.0
    total_insulin_drop = 0.0
    t = minutes_since_insulin
    while t < min(minutes_since_insulin + 30.0, 300.0):
        if t > 0.0:
            rate = insulin_dose * isf * (t / tau) * math.exp(1.0 - t / tau) * 0.35
            total_insulin_drop += rate * 0.18
        t += 5.0

    # ──────────────────────────────────────────────────────────────────────────
    # S3: Stress dampening
    # High cortisol (stress ≥ 4) counteracts insulin via gluconeogenesis.
    # Reduce the expected insulin drop by 20% as a conservative estimate.
    # (Training data uses average stress, so high-stress correction is needed.)
    # ──────────────────────────────────────────────────────────────────────────
    if stress_level >= 4:
        total_insulin_drop *= 0.80  # 20% reduction in insulin effectiveness

    # ──────────────────────────────────────────────────────────────────────────
    # S4: Gastroparesis / slow absorption dampening
    # High carb meal (> 60g) at 120–200 min post-meal: absorption may still
    # be active, partially counteracting the insulin drop. Reduce insulin
    # drop by 30% to avoid over-predicting the correction effect.
    # ──────────────────────────────────────────────────────────────────────────
    gastroparesis_flag = (
        carbs_last_meal > 60.0 and 120.0 <= minutes_since_meal <= 200.0
    )
    if gastroparesis_flag:
        total_insulin_drop *= 0.70  # 30% reduction

    # ──────────────────────────────────────────────────────────────────────────
    # Compute expected activity drop over the NEXT 30 min
    # using the training data's exercise_effect formula.
    # ──────────────────────────────────────────────────────────────────────────
    total_activity_drop = 0.0
    if activity_intensity in ('low', 'medium', 'high') and activity_duration > 0:
        i_factor = {'low': 0.4, 'medium': 0.7, 'high': 1.0}[activity_intensity]
        d_factor = min(activity_duration / 30.0, 2.0)
        t_post = max(0.0, minutes_since_activity - activity_duration)

        for dt in range(0, 30, 5):
            t_p = t_post + dt
            if t_p <= 360:
                rate = 15.0 * i_factor * d_factor * math.exp(-t_p / 120.0)
                total_activity_drop += rate * 0.10

        # ──────────────────────────────────────────────────────────────────────
        # S7: Delayed post-exercise hypoglycemia (120–360 min after high activity)
        # Add an extra 15% on top of the base activity drop when in the delayed
        # sensitivity window. Only applies to high intensity.
        # ──────────────────────────────────────────────────────────────────────
        if activity_intensity == 'high' and 120 <= t_post <= 360:
            total_activity_drop *= 1.15

    total_drop = total_insulin_drop + total_activity_drop
    if total_drop < 5.0:
        return predicted_glucose, 0.0  # Negligible — trust the ML model

    pk_prediction = max(40.0, current_glucose - total_drop)

    # ──────────────────────────────────────────────────────────────────────────
    # Determine blending weight
    # ──────────────────────────────────────────────────────────────────────────
    is_correction_bolus = current_glucose > 150 and minutes_since_insulin < 60
    is_high_dose = insulin_dose >= high_dose_threshold

    if is_correction_bolus and is_high_dose:
        # S2: High-dose stacked bolus — highest PK weight, highest uncertainty
        pk_weight = 0.60
        confidence_penalty = 0.35
    elif is_correction_bolus:
        # S1: Standard correction bolus — physiology strongly overrides ML
        pk_weight = 0.45
        confidence_penalty = pk_weight * 0.30
    elif minutes_since_insulin < 60:
        # S1 (low glucose): Fresh insulin, near-normal glucose
        pk_weight = 0.25
        confidence_penalty = pk_weight * 0.30
    else:
        # Insulin 60–120 min ago: model has more training support
        pk_weight = 0.10
        confidence_penalty = pk_weight * 0.30

    # Dampen PK weight when gastroparesis is suspected (reduces confidence in correction)
    if gastroparesis_flag:
        pk_weight *= 0.70
        confidence_penalty *= 0.70

    corrected = (1.0 - pk_weight) * predicted_glucose + pk_weight * pk_prediction
    corrected = round(max(40.0, min(400.0, corrected)), 1)

    # ──────────────────────────────────────────────────────────────────────────
    # S8: Dawn phenomenon resistance (04:00–07:00)
    # Cortisol + growth hormone surges increase insulin resistance during this
    # window. If the corrected prediction shows a drop, counteract with +8 mg/dL
    # to reflect the physiological resistance to glucose lowering.
    # Dawn effect is real but already partially encoded in the model's hour
    # features, so we use a small correction only.
    # ──────────────────────────────────────────────────────────────────────────
    if 4.0 <= hour <= 7.0 and corrected < current_glucose:
        corrected = min(current_glucose, corrected + 8.0)
        confidence_penalty = min(0.40, confidence_penalty + 0.05)

    corrected = round(max(40.0, min(400.0, corrected)), 1)
    return corrected, min(0.40, confidence_penalty)


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
