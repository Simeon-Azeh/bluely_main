"""
Bluely Personalization Module
==============================
Patient-specific calibration layer that adapts global model predictions
using each user's historical data. Lightweight incremental learning —
no deep learning frameworks required.

Architecture:
    predicted_glucose = global_model_prediction + patient_bias + personalized_trend_adjustment

Activation threshold: minimum 21 glucose readings per patient.
"""

from .personalization_engine import predict_personalized_glucose
from .patient_profile import PatientProfile, load_patient_profile, save_patient_profile
from .adaptation_trainer import update_patient_parameters, initialize_patient_profile

__all__ = [
    "predict_personalized_glucose",
    "PatientProfile",
    "load_patient_profile",
    "save_patient_profile",
    "update_patient_parameters",
    "initialize_patient_profile",
]
