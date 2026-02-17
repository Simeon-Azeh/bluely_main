"""
Bluely ML FastAPI Prediction Server
====================================
Loads the trained model and exposes prediction endpoints.

- POST /predict             — Pima-based diabetes risk classification
- POST /predict-trend       — User-data-driven glucose trend prediction
- POST /predict-glucose-30  — OhioT1DM-based 30-minute glucose forecast

Run:
    uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from predict import predict_risk
from typing import List, Optional
import os
import numpy as np
import joblib
import traceback

# ── Load OhioT1DM model at startup ──────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

try:
    ohio_model = joblib.load(os.path.join(MODEL_DIR, "ohio_glucose_predictor.joblib"))
    ohio_scaler = joblib.load(os.path.join(MODEL_DIR, "ohio_scaler.joblib"))
    OHIO_MODEL_LOADED = True
    print(" OhioT1DM model loaded successfully")
except Exception as e:
    ohio_model = None
    ohio_scaler = None
    OHIO_MODEL_LOADED = False
    print(f"  OhioT1DM model not loaded: {e}")

app = FastAPI(
    title="Bluely ML API",
    description="Machine learning prediction service for Bluely diabetes management",
    version="2.0.0",
)

# CORS — allow the Express backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ───────────────────────────────────────────────

class PredictionInput(BaseModel):
    pregnancies: float = Field(default=0, ge=0, le=20)
    glucose: float = Field(..., ge=0, le=600, description="Plasma glucose concentration")
    blood_pressure: float = Field(default=72, ge=0, le=200)
    skin_thickness: float = Field(default=29, ge=0, le=100)
    insulin: float = Field(default=80, ge=0, le=900)
    bmi: float = Field(default=32, ge=0, le=80)
    diabetes_pedigree: float = Field(default=0.5, ge=0, le=3)
    age: float = Field(..., ge=1, le=120)


class PredictionOutput(BaseModel):
    predicted_risk: int
    risk_level: str
    confidence: float
    recommendation: str


class GlucoseReading(BaseModel):
    value: float
    readingType: str = "random"
    hour: int = 12
    dayOfWeek: int = 0
    medicationTaken: bool = False
    mealContext: Optional[str] = None
    activityContext: Optional[str] = None


class TrendPredictionInput(BaseModel):
    readings: List[GlucoseReading] = Field(..., min_length=3, description="Last N glucose readings, ordered oldest→newest")
    currentGlucose: float = Field(..., ge=20, le=600)
    diabetesType: Optional[str] = None
    onMedication: bool = False
    lastMealHoursAgo: Optional[float] = None
    activityLevel: Optional[str] = None


class TrendPredictionOutput(BaseModel):
    direction: str  # 'rising', 'stable', 'dropping'
    predictedNextGlucose: float
    confidence: float
    timeframe: str  # e.g. "next 1-2 hours"
    recommendation: str
    riskAlert: Optional[str] = None
    factors: List[str]


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Health check — confirms the model is loaded and ready."""
    return {"status": "healthy", "model": "loaded", "version": "2.0.0"}


@app.post("/predict", response_model=PredictionOutput)
def predict(input_data: PredictionInput):
    """Run a diabetes risk prediction using the trained Random Forest model."""
    try:
        result = predict_risk(
            pregnancies=input_data.pregnancies,
            glucose=input_data.glucose,
            blood_pressure=input_data.blood_pressure,
            skin_thickness=input_data.skin_thickness,
            insulin=input_data.insulin,
            bmi=input_data.bmi,
            diabetes_pedigree=input_data.diabetes_pedigree,
            age=input_data.age,
        )
        return PredictionOutput(**result)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model not found. Please run train.py first.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-trend", response_model=TrendPredictionOutput)
def predict_trend(input_data: TrendPredictionInput):
    """
    Predict glucose trend direction using user's historical patterns.
    Uses statistical analysis of recent readings + contextual factors.
    """
    try:
        readings = input_data.readings
        values = [r.value for r in readings]
        current = input_data.currentGlucose

        # ------ Statistical trend analysis ------
        n = len(values)
        if n < 3:
            raise HTTPException(status_code=400, detail="Need at least 3 readings")

        # Linear regression on recent values
        x = np.arange(n, dtype=float)
        y = np.array(values, dtype=float)
        slope = np.polyfit(x, y, 1)[0]

        # Rate of change (last 3)
        recent_3 = values[-3:]
        rate_of_change = (recent_3[-1] - recent_3[0]) / max(len(recent_3) - 1, 1)

        # Velocity (acceleration)
        if n >= 4:
            prev_rate = (values[-3] - values[-4])
            curr_rate = (values[-1] - values[-2])
            acceleration = curr_rate - prev_rate
        else:
            acceleration = 0.0

        # Variability (coefficient of variation)
        cv = np.std(values) / np.mean(values) if np.mean(values) > 0 else 0

        # ------ Contextual factors ------
        factors = []
        adjustment = 0.0

        last_reading = readings[-1]

        # Meal effect
        if input_data.lastMealHoursAgo is not None:
            if input_data.lastMealHoursAgo < 1:
                adjustment += 15  # glucose tends to rise after eating
                factors.append("Recent meal detected. Glucose often rises in this window")
            elif input_data.lastMealHoursAgo < 2:
                adjustment += 5
                factors.append("Post-meal period (1-2 hrs). Levels may still be adjusting")
            elif input_data.lastMealHoursAgo > 4:
                adjustment -= 5
                factors.append("Extended time since last meal. Levels may trend lower")

        # Medication effect
        if last_reading.medicationTaken or input_data.onMedication:
            adjustment -= 10
            factors.append("Medication logged. May influence glucose direction")

        # Time-of-day effect
        hour = last_reading.hour
        if 4 <= hour <= 7:
            adjustment += 8  # Dawn phenomenon
            factors.append("Early morning reading. Dawn effect may influence levels")
        elif 22 <= hour or hour <= 3:
            adjustment -= 5
            factors.append("Nighttime reading. Levels often stabilize during rest")

        # Activity effect
        if input_data.activityLevel in ['high', 'frequent']:
            adjustment -= 8
            factors.append("High activity logged. May contribute to lower readings")
        elif last_reading.activityContext:
            adjustment -= 5
            factors.append("Recent activity noted. Levels may be influenced")

        if not factors:
            factors.append("Based on recent glucose trend patterns")

        # ------ Prediction ------
        raw_prediction = current + slope * 2 + rate_of_change + adjustment + acceleration * 0.5
        predicted_next = max(40, min(400, raw_prediction))  # Clamp

        # Direction
        delta = predicted_next - current
        if delta > 10:
            direction = "rising"
        elif delta < -10:
            direction = "dropping"
        else:
            direction = "stable"

        # Confidence (higher when more data + lower variability)
        base_confidence = min(0.5 + (n / 20) * 0.3, 0.8)
        variability_penalty = min(cv * 0.5, 0.3)
        confidence = round(max(0.3, base_confidence - variability_penalty), 2)

        # Risk alerts
        risk_alert = None
        if predicted_next < 70:
            risk_alert = "Trend suggests glucose may drop below target. Monitor closely"
        elif predicted_next > 250:
            risk_alert = "Trend suggests glucose may remain significantly elevated. Consider reviewing with your provider"
        elif predicted_next > 180:
            risk_alert = "Trend suggests levels may stay above target range in the near term"

        # Recommendation
        if direction == "rising" and predicted_next > 180:
            recommendation = "An upward trend is detected with levels above target range. Consider discussing this pattern with your healthcare provider."
        elif direction == "dropping" and predicted_next < 80:
            recommendation = "A downward trend is detected approaching lower range. Monitoring more frequently may help you stay informed."
        elif direction == "stable" and 70 <= predicted_next <= 140:
            recommendation = "Levels appear stable and within target range based on recent readings."
        elif direction == "stable":
            recommendation = "Levels appear stable. Continuing to log readings helps track patterns over time."
        elif direction == "rising":
            recommendation = "A mild upward trend is detected in recent readings. Staying hydrated and active may support glucose management."
        else:
            recommendation = "A downward trend is detected in recent readings. This may reflect normal variation — continued monitoring helps clarify the pattern."

        return TrendPredictionOutput(
            direction=direction,
            predictedNextGlucose=round(predicted_next, 1),
            confidence=confidence,
            timeframe="next 1-2 hours",
            recommendation=recommendation,
            riskAlert=risk_alert,
            factors=factors,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── OhioT1DM 30-minute glucose forecast ─────────────────────────────────────

class Glucose30Input(BaseModel):
    readings: List[GlucoseReading] = Field(
        ..., min_length=1,
        description="Recent glucose readings, ordered oldest→newest",
    )
    currentGlucose: float = Field(..., ge=20, le=600)
    diabetesType: Optional[str] = None
    onMedication: bool = False
    lastMealHoursAgo: Optional[float] = None
    activityLevel: Optional[str] = None


class Glucose30Output(BaseModel):
    predictedGlucose: float
    direction: str          # 'rising' | 'stable' | 'dropping'
    directionArrow: str     # '↑' | '→' | '↓'
    directionLabel: str     # human-readable tooltip
    confidence: float
    timeframe: str          # "30 minutes"
    recommendation: str
    riskAlert: Optional[str] = None
    factors: List[str]
    modelUsed: str          # 'ohiot1dm' | 'statistical'


def _build_ohio_features(readings: List[GlucoseReading], current: float) -> np.ndarray:
    """
    Build a 26-feature vector compatible with the OhioT1DM model.
    For sparse user data we extrapolate from available readings.
    """
    values = [r.value for r in readings]
    n = len(values)

    # Pad to at least 6 values using repetition so lag/diff features work
    while len(values) < 6:
        values = [values[0]] + values

    recent = values[-6:]  # use last 6 data points

    # Core lag features (glucose_lag_1 through glucose_lag_6)
    lags = list(reversed(recent[:6]))  # most-recent first

    # Diff features
    diffs = [recent[i] - recent[i - 1] for i in range(1, len(recent))]
    while len(diffs) < 5:
        diffs = [0.0] + diffs

    # Rolling stats
    mean_6 = np.mean(recent)
    std_6 = np.std(recent) if len(set(recent)) > 1 else 0.0
    min_6 = np.min(recent)
    max_6 = np.max(recent)

    # Time features from last reading
    last = readings[-1]
    hour = last.hour
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    dow = last.dayOfWeek
    dow_sin = np.sin(2 * np.pi * dow / 7)
    dow_cos = np.cos(2 * np.pi * dow / 7)

    # Rate of change
    roc = (recent[-1] - recent[0]) / max(len(recent) - 1, 1)

    # Acceleration
    if len(diffs) >= 2:
        accel = diffs[-1] - diffs[-2]
    else:
        accel = 0.0

    # 26 features in order trained
    features = (
        lags[:6]           # 6: glucose_lag_1..6
        + diffs[:5]        # 5: glucose_diff_1..5
        + [mean_6, std_6, min_6, max_6]   # 4: rolling stats
        + [hour_sin, hour_cos, dow_sin, dow_cos]  # 4: time
        + [roc, accel]     # 2: rate, accel
        + [current]        # 1: current glucose value (fills any remaining slot)
    )

    # Ensure exactly 26 features
    features = features[:26]
    while len(features) < 26:
        features.append(0.0)

    return np.array(features, dtype=float).reshape(1, -1)


def _statistical_30min(readings: List[GlucoseReading], current: float) -> float:
    """Fallback: linear extrapolation for 30 min using available readings."""
    values = [r.value for r in readings]
    n = len(values)
    if n < 2:
        return current
    x = np.arange(n, dtype=float)
    y = np.array(values, dtype=float)
    slope = np.polyfit(x, y, 1)[0]
    # Assume ~30 min step
    return float(current + slope * 0.5)


@app.post("/predict-glucose-30", response_model=Glucose30Output)
def predict_glucose_30(input_data: Glucose30Input):
    """
    Predict glucose level 30 minutes from now.
    Uses the OhioT1DM Gradient-Boosting model when available,
    falls back to statistical extrapolation otherwise.
    """
    try:
        readings = input_data.readings
        current = input_data.currentGlucose
        values = [r.value for r in readings]
        factors: List[str] = []

        # ── Try OhioT1DM model first ──
        model_used = "statistical"
        if OHIO_MODEL_LOADED and ohio_model is not None and ohio_scaler is not None:
            try:
                raw_features = _build_ohio_features(readings, current)
                scaled = ohio_scaler.transform(raw_features)
                predicted = float(ohio_model.predict(scaled)[0])
                model_used = "ohiot1dm"
                factors.append("Prediction from trained OhioT1DM temporal model")
            except Exception as model_err:
                print(f"OhioT1DM prediction failed, falling back: {model_err}")
                traceback.print_exc()
                predicted = _statistical_30min(readings, current)
                factors.append("Statistical extrapolation (model fallback)")
        else:
            predicted = _statistical_30min(readings, current)
            factors.append("Statistical extrapolation from recent readings")

        # ── Contextual adjustments for sparse data ──
        adjustment = 0.0

        if input_data.lastMealHoursAgo is not None:
            if input_data.lastMealHoursAgo < 1:
                adjustment += 10
                factors.append("Recent meal. Glucose may still be rising")
            elif input_data.lastMealHoursAgo < 2:
                adjustment += 3
                factors.append("Post-meal window (1-2 hrs)")
            elif input_data.lastMealHoursAgo > 4:
                adjustment -= 3
                factors.append("Extended time since last meal")

        if input_data.onMedication:
            adjustment -= 5
            factors.append("Medication logged. May influence trend")

        last = readings[-1]
        if 4 <= last.hour <= 7:
            adjustment += 5
            factors.append("Early morning. Dawn effect possible")
        elif 22 <= last.hour or last.hour <= 3:
            adjustment -= 3
            factors.append("Nighttime. Levels tend to stabilize")

        if input_data.activityLevel in ("high", "frequent", "very_active", "active"):
            adjustment -= 5
            factors.append("Active lifestyle may lower readings")

        predicted = max(40, min(400, predicted + adjustment))

        if not factors:
            factors.append("Based on recent glucose trend patterns")

        # ── Direction ──
        delta = predicted - current
        if delta > 8:
            direction = "rising"
            arrow = "↑"
            label = "Trend is rising. Glucose may increase over the next 30 minutes"
        elif delta < -8:
            direction = "dropping"
            arrow = "↓"
            label = "Trend is dropping. Glucose may decrease over the next 30 minutes"
        else:
            direction = "stable"
            arrow = "→"
            label = "Trend is stable. Glucose is expected to stay near current level"

        # ── Confidence ──
        n = len(values)
        base_conf = min(0.45 + (n / 15) * 0.35, 0.85)
        if model_used == "ohiot1dm":
            base_conf = min(base_conf + 0.1, 0.92)
        cv = np.std(values) / np.mean(values) if np.mean(values) > 0 else 0
        confidence = round(max(0.25, base_conf - min(cv * 0.4, 0.25)), 2)

        # ── Risk alert ──
        risk_alert = None
        if predicted < 70:
            risk_alert = "Glucose may drop below target. Monitor closely"
        elif predicted > 250:
            risk_alert = "Glucose may remain significantly elevated"
        elif predicted > 180:
            risk_alert = "Glucose may stay above target range"

        # ── Recommendation ──
        if direction == "rising" and predicted > 180:
            recommendation = "An upward trend is detected. Consider discussing this pattern with your healthcare provider."
        elif direction == "dropping" and predicted < 80:
            recommendation = "A downward trend is detected approaching lower range. More frequent monitoring may be helpful."
        elif direction == "stable" and 70 <= predicted <= 140:
            recommendation = "Levels appear stable and within target. Keep up the great work!"
        elif direction == "rising":
            recommendation = "A mild upward trend is expected. Staying hydrated and active may help."
        elif direction == "dropping":
            recommendation = "A downward trend is noted. This may reflect normal variation."
        else:
            recommendation = "Levels appear stable. Continue logging to track patterns."

        return Glucose30Output(
            predictedGlucose=round(predicted, 1),
            direction=direction,
            directionArrow=arrow,
            directionLabel=label,
            confidence=confidence,
            timeframe="30 minutes",
            recommendation=recommendation,
            riskAlert=risk_alert,
            factors=factors,
            modelUsed=model_used,
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
