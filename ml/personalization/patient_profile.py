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

Persistence: Firestore documents in patientModelProfiles/{user_id}
"""

import os
import re
import firebase_admin
from firebase_admin import credentials, firestore
from dataclasses import dataclass, asdict, field
from typing import Optional, List
from datetime import datetime

COLLECTION_NAME = "patientModelProfiles"
_firestore_client = None


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


def _get_firestore_client():
    """Initialize Firebase Admin once and return the shared Firestore client."""
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    if not firebase_admin._apps:
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
        private_key = os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
        if project_id and client_email and private_key:
            firebase_admin.initialize_app(credentials.Certificate({
                "project_id": project_id,
                "client_email": client_email,
                "private_key": private_key,
                "token_uri": "https://oauth2.googleapis.com/token",
            }))
        else:
            firebase_admin.initialize_app(options={"projectId": project_id or "bluely-development"})

    _firestore_client = firestore.client()
    return _firestore_client


def _document_id(user_id: str) -> str:
    """Create a Firestore-safe deterministic document ID for a Firebase UID."""
    return re.sub(r"[^A-Za-z0-9_-]", "_", user_id)


def load_patient_profile(user_id: str) -> PatientProfile:
    """
    Load a patient profile from disk. Returns default profile if none exists.

    Args:
        user_id: Firebase UID of the patient.

    Returns:
        PatientProfile with stored parameters or defaults.
    """
    snapshot = _get_firestore_client().collection(COLLECTION_NAME).document(_document_id(user_id)).get()
    if not snapshot.exists:
        return PatientProfile(user_id=user_id)
    data = snapshot.to_dict() or {}
    return PatientProfile(
        user_id=data.get("user_id", user_id),
        baseline_glucose_bias=float(data.get("baseline_glucose_bias", 0.0)),
        insulin_sensitivity_factor=float(data.get("insulin_sensitivity_factor", 1.0)),
        carb_response_factor=float(data.get("carb_response_factor", 1.0)),
        activity_response_factor=float(data.get("activity_response_factor", 1.0)),
        ewma_residual=float(data.get("ewma_residual", 0.0)),
        training_samples=int(data.get("training_samples", 0)),
        recent_residuals=list(data.get("recent_residuals", [])),
        last_updated=data.get("last_updated"),
    )


def save_patient_profile(profile: PatientProfile) -> None:
    """
    Persist a patient profile to disk.

    Args:
        profile: PatientProfile instance to save.
    """
    profile.last_updated = datetime.utcnow().isoformat()
    _get_firestore_client().collection(COLLECTION_NAME).document(_document_id(profile.user_id)).set({
        **profile.to_dict(),
        "updated_at": firestore.SERVER_TIMESTAMP,
    }, merge=True)
