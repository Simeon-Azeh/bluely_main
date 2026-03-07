"""
Adaptation Trainer
===================
Incremental learning engine that updates patient-specific calibration
parameters as new glucose readings arrive.

Methods:
  - Exponentially Weighted Moving Average (EWMA) of residuals
  - Residual bias correction
  - Context-specific sensitivity factors (insulin, carbs, activity)

Algorithm:
  1. Global model produces prediction for a feature vector
  2. When the actual reading arrives, compute residual = actual - predicted
  3. Update EWMA of residuals (decay factor α = 0.15)
  4. Update context-specific factors using attribution:
     - If insulin was active and residual > 0 → insulin less effective for this patient
     - If carbs were high and residual > 0 → stronger carb response
     - If activity was recent and residual < 0 → activity more effective
  5. Persist profile. After ≥21 samples, personalization activates.
"""

import numpy as np
from datetime import datetime
from typing import Dict, Optional

from .patient_profile import (
    PatientProfile,
    load_patient_profile,
    save_patient_profile,
)

# EWMA decay factor — balances recent vs historical data
# 0.15 means recent readings carry ~15% weight individually
EWMA_ALPHA = 0.15

# Context factor learning rates — conservative to avoid oscillation
INSULIN_LR = 0.02
CARB_LR = 0.02
ACTIVITY_LR = 0.02

# Maximum residual history to keep
MAX_RESIDUALS = 50


def initialize_patient_profile(user_id: str) -> PatientProfile:
    """
    Create or load a patient profile.

    Args:
        user_id: Firebase UID.

    Returns:
        Initialized PatientProfile (loaded from disk or fresh).
    """
    return load_patient_profile(user_id)


def update_patient_parameters(
    user_id: str,
    predicted_glucose: float,
    actual_glucose: float,
    context: Optional[Dict] = None,
) -> PatientProfile:
    """
    Update patient calibration parameters with a new glucose reading.

    This is called whenever a user logs a new glucose reading AND we have
    a prior prediction to compare against. The residual (actual - predicted)
    drives all parameter updates.

    Args:
        user_id: Firebase UID.
        predicted_glucose: What the global model predicted (mg/dL).
        actual_glucose: What the patient actually measured (mg/dL).
        context: Optional dict with keys:
            - insulin_active (bool): Was insulin taken recently?
            - carbs_consumed (float): Carbs from recent meal (grams).
            - activity_recent (bool): Was there recent physical activity?

    Returns:
        Updated PatientProfile.
    """
    profile = load_patient_profile(user_id)
    context = context or {}

    # Compute residual
    residual = actual_glucose - predicted_glucose

    # Update EWMA of residuals
    if profile.training_samples == 0:
        profile.ewma_residual = residual
    else:
        profile.ewma_residual = (
            EWMA_ALPHA * residual + (1 - EWMA_ALPHA) * profile.ewma_residual
        )

    # Store residual history (capped)
    profile.recent_residuals.append(round(residual, 2))
    if len(profile.recent_residuals) > MAX_RESIDUALS:
        profile.recent_residuals = profile.recent_residuals[-MAX_RESIDUALS:]

    # Update baseline bias (running average of residuals)
    n = profile.training_samples + 1
    profile.baseline_glucose_bias = (
        profile.baseline_glucose_bias * (n - 1) + residual
    ) / n

    # Context-specific factor updates
    if context.get("insulin_active"):
        # If actual > predicted while insulin active → patient less insulin-sensitive
        # Factor > 1 means less sensitive, < 1 means more sensitive
        if residual > 5:
            profile.insulin_sensitivity_factor += INSULIN_LR
        elif residual < -5:
            profile.insulin_sensitivity_factor -= INSULIN_LR
        profile.insulin_sensitivity_factor = max(0.5, min(2.0, profile.insulin_sensitivity_factor))

    carbs = context.get("carbs_consumed", 0)
    if carbs > 10:
        # If actual > predicted after carbs → patient has stronger carb response
        if residual > 5:
            profile.carb_response_factor += CARB_LR
        elif residual < -5:
            profile.carb_response_factor -= CARB_LR
        profile.carb_response_factor = max(0.5, min(2.0, profile.carb_response_factor))

    if context.get("activity_recent"):
        # If actual < predicted after activity → patient responds more to exercise
        if residual < -5:
            profile.activity_response_factor += ACTIVITY_LR
        elif residual > 5:
            profile.activity_response_factor -= ACTIVITY_LR
        profile.activity_response_factor = max(0.5, min(2.0, profile.activity_response_factor))

    profile.training_samples = n
    save_patient_profile(profile)
    return profile
