"""
Patient Profile
================
Data class and persistence for patient-specific calibration parameters.

Stores:
  - baseline_glucose_bias: Average offset between global model and actual readings
  - insulin_sensitivity_factor: How much insulin lowers this patient's glucose vs average
  - carb_response_factor: How much carbs raise this patient's glucose vs average
  - activity_response_factor: How much activity lowers this patient's glucose vs average
  - ewma_residual: Exponentially weighted moving average of recent prediction errors
  - training_samples: Number of readings used to compute these parameters

Persistence: JSON files in ml/patient_profiles/{user_id}.json
"""

import os
import json
from dataclasses import dataclass, asdict, field
from typing import Optional, List
from datetime import datetime

PROFILES_DIR = os.path.join(os.path.dirname(__file__), "..", "patient_profiles")


@dataclass
class PatientProfile:
    """Patient-specific calibration parameters."""
    user_id: str
    baseline_glucose_bias: float = 0.0
    insulin_sensitivity_factor: float = 1.0
    carb_response_factor: float = 1.0
    activity_response_factor: float = 1.0
    ewma_residual: float = 0.0
    training_samples: int = 0
    recent_residuals: List[float] = field(default_factory=list)  # Last 50 residuals
    last_updated: Optional[str] = None

    @property
    def is_personalized(self) -> bool:
        """Whether this profile has enough data for personalization (≥21 samples)."""
        return self.training_samples >= 21

    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return asdict(self)


def _profile_path(user_id: str) -> str:
    """Get the file path for a patient profile."""
    os.makedirs(PROFILES_DIR, exist_ok=True)
    safe_id = "".join(c if c.isalnum() or c in "-_" else "_" for c in user_id)
    return os.path.join(PROFILES_DIR, f"{safe_id}.json")


def load_patient_profile(user_id: str) -> PatientProfile:
    """
    Load a patient profile from disk. Returns default profile if none exists.

    Args:
        user_id: Firebase UID of the patient.

    Returns:
        PatientProfile with stored parameters or defaults.
    """
    path = _profile_path(user_id)
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)
        return PatientProfile(**data)
    return PatientProfile(user_id=user_id)


def save_patient_profile(profile: PatientProfile) -> None:
    """
    Persist a patient profile to disk.

    Args:
        profile: PatientProfile instance to save.
    """
    path = _profile_path(profile.user_id)
    profile.last_updated = datetime.utcnow().isoformat()
    with open(path, "w") as f:
        json.dump(profile.to_dict(), f, indent=2)
