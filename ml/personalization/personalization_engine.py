"""
Personalization Engine
=======================
Applies patient-specific calibration to global model predictions.

Pipeline:
    1. Global model produces base prediction
    2. Load patient profile
    3. If ≥21 samples: apply bias, EWMA correction, and context adjustments
    4. Return calibrated prediction with source tag

The adjustments are additive and conservative:
    calibrated = global_prediction + baseline_bias + ewma_residual * 0.5
                 + context_adjustments

Context adjustments use the patient-specific sensitivity factors:
    - Insulin adjustment = (1 - insulin_sensitivity_factor) * insulin_effect_estimate
    - Carb adjustment = (carb_response_factor - 1) * carb_effect_estimate
    - Activity adjustment = (1 - activity_response_factor) * activity_effect_estimate
"""

import numpy as np
from typing import Dict, Tuple, Optional

from .patient_profile import load_patient_profile, PatientProfile


# Rough physiological estimates used for context adjustment scaling
INSULIN_BASE_EFFECT = -30.0   # Average mg/dL drop per unit of rapid insulin
CARB_BASE_EFFECT = 4.0        # Average mg/dL rise per gram of carb
ACTIVITY_BASE_EFFECT = -15.0  # Average mg/dL drop per 30min moderate activity


def predict_personalized_glucose(
    user_id: str,
    global_prediction: float,
    feature_context: Optional[Dict] = None,
) -> Dict:
    """
    Apply patient-specific calibration to a global model prediction.

    Args:
        user_id: Firebase UID.
        global_prediction: Prediction from the global model (mg/dL).
        feature_context: Optional dict with actual input values:
            - insulin_dose (float): Insulin units taken
            - carbs_consumed (float): Carbs in grams
            - activity_duration (float): Activity duration in minutes
            - activity_intensity (str): 'low', 'medium', 'high'

    Returns:
        Dict with:
            - predicted_glucose (float): Calibrated prediction
            - prediction_source (str): 'global_model' or 'personalized_model'
            - global_prediction (float): Uncalibrated prediction
            - calibration_offset (float): How much personalization changed the prediction
            - patient_profile (dict): Summary of patient parameters
    """
    profile = load_patient_profile(user_id)

    result = {
        "global_prediction": round(global_prediction, 1),
        "patient_profile": {
            "training_samples": profile.training_samples,
            "is_personalized": profile.is_personalized,
            "baseline_bias": round(profile.baseline_glucose_bias, 2),
            "insulin_sensitivity": round(profile.insulin_sensitivity_factor, 3),
            "carb_response": round(profile.carb_response_factor, 3),
            "activity_response": round(profile.activity_response_factor, 3),
        },
    }

    if not profile.is_personalized:
        # Not enough data — return global prediction unchanged
        result["predicted_glucose"] = round(global_prediction, 1)
        result["prediction_source"] = "global_model"
        result["calibration_offset"] = 0.0
        return result

    # Apply personalization
    context = feature_context or {}
    offset = 0.0

    # 1. Baseline bias correction
    offset += profile.baseline_glucose_bias

    # 2. EWMA trend correction (weighted at 50% to avoid overreaction)
    offset += profile.ewma_residual * 0.5

    # 3. Context-specific adjustments
    insulin_dose = context.get("insulin_dose", 0)
    if insulin_dose > 0:
        # Adjust insulin effect based on patient sensitivity
        base_insulin_effect = insulin_dose * INSULIN_BASE_EFFECT / 10.0  # Per 10 units
        patient_adjustment = base_insulin_effect * (profile.insulin_sensitivity_factor - 1.0)
        offset += patient_adjustment

    carbs = context.get("carbs_consumed", 0)
    if carbs > 0:
        # Adjust carb effect based on patient response
        base_carb_effect = carbs * CARB_BASE_EFFECT / 30.0  # Per 30g carbs
        patient_adjustment = base_carb_effect * (profile.carb_response_factor - 1.0)
        offset += patient_adjustment

    activity_duration = context.get("activity_duration", 0)
    intensity = context.get("activity_intensity", "none")
    if activity_duration > 0 and intensity != "none":
        intensity_mult = {"low": 0.5, "medium": 1.0, "high": 1.5}.get(intensity, 1.0)
        base_activity_effect = (activity_duration / 30.0) * ACTIVITY_BASE_EFFECT * intensity_mult
        patient_adjustment = base_activity_effect * (profile.activity_response_factor - 1.0)
        offset += patient_adjustment

    # Clamp total offset to prevent wild corrections
    offset = max(-50.0, min(50.0, offset))

    calibrated = global_prediction + offset
    # Clamp to physiological range
    calibrated = max(40.0, min(400.0, calibrated))

    result["predicted_glucose"] = round(calibrated, 1)
    result["prediction_source"] = "personalized_model"
    result["calibration_offset"] = round(offset, 2)

    return result
