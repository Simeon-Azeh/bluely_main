"""
Bluely ML Prediction Helper
============================
Utility module for loading the trained model and making predictions.
"""

import os
import numpy as np
import joblib

# Paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'glucose_model.joblib')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.joblib')


def load_model():
    """Load the trained model and scaler."""
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    return model, scaler


def predict_risk(
    pregnancies: float = 0,
    glucose: float = 100,
    blood_pressure: float = 72,
    skin_thickness: float = 29,
    insulin: float = 80,
    bmi: float = 32,
    diabetes_pedigree: float = 0.5,
    age: float = 30,
) -> dict:
    """
    Make a diabetes risk prediction.

    Returns:
        dict with keys: predicted_risk, risk_level, confidence, recommendation
    """
    model, scaler = load_model()

    features = np.array([[
        pregnancies,
        glucose,
        blood_pressure,
        skin_thickness,
        insulin,
        bmi,
        diabetes_pedigree,
        age,
    ]])

    features_scaled = scaler.transform(features)

    prediction = model.predict(features_scaled)[0]
    probability = model.predict_proba(features_scaled)[0]
    confidence = float(max(probability))

    if prediction == 0:
        risk_level = 'normal'
        recommendation = (
            'Current inputs suggest a lower risk profile. '
            'Consistent habits may help maintain this pattern.'
        )
    elif confidence < 0.7:
        risk_level = 'elevated'
        recommendation = (
            'Some factors suggest an elevated risk pattern. '
            'Consider reviewing this with your healthcare provider.'
        )
    else:
        risk_level = 'critical'
        recommendation = (
            'Multiple factors indicate a higher risk profile. '
            'We recommend discussing these patterns with your healthcare provider.'
        )

    return {
        'predicted_risk': int(prediction),
        'risk_level': risk_level,
        'confidence': round(confidence, 3),
        'recommendation': recommendation,
    }


if __name__ == '__main__':
    # Quick test
    result = predict_risk(glucose=148, age=33, bmi=28.5)
    print(f"Prediction: {result}")
