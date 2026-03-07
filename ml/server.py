"""
Bluely ML FastAPI Prediction Server (v4.0)
============================================
Serves glucose predictions with patient-personalized calibration
and AI-powered insight generation.

Architecture:
  Layer 1 — Global Model: Trained on synthetic physiological data
  Layer 2 — Patient Personalization: EWMA-based calibration per user (≥21 readings)
  Layer 3 — AI Insight Engine: LLM-powered explanations (DeepSeek → OpenAI → Ollama → templates)

Endpoints:
  POST /predict                    — Glucose risk classification
  POST /predict-glucose-30         — 30-minute glucose forecast (+ personalization + AI insight)
  POST /predict-trend              — Trend direction from historical readings
  POST /estimate-hba1c             — HbA1c estimation from ≥21 readings
  POST /analyze-weekly             — Weekly trend analysis
  POST /personalization/update     — Update patient calibration parameters
  GET  /personalization/profile/{user_id} — Get patient personalization profile
  POST /ai-insight                 — Generate AI insight for prediction data
  POST /diabuddy/summarize         — Generate DiaBuddy health summary
  POST /diabuddy/chat              — Conversational DiaBuddy chat
  GET  /health                     — Service health check

Run:
    uvicorn server:app --host 0.0.0.0 --port 8000 --reload --reload-dir .
"""

from dotenv import load_dotenv
load_dotenv()  # Load .env before anything reads os.environ

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os
import math
import numpy as np
import traceback

from predict_bluely import (
    build_feature_vector,
    predict_glucose_30min,
    predict_risk as predict_risk_ml,
    estimate_hba1c,
    load_forecast_model,
    load_risk_model,
)

from personalization import (
    load_patient_profile,
    save_patient_profile,
    update_patient_parameters,
    predict_personalized_glucose,
)

from ai_insights import (
    generate_ai_insight,
    generate_summary_insight,
)
from ai_insights.llm_interface import LLMInterface

# ── Probe model availability at startup ──────────────────────────────────────

FORECAST_MODEL_LOADED = False
RISK_MODEL_LOADED = False

try:
    load_forecast_model()
    FORECAST_MODEL_LOADED = True
    print("  Bluely forecast model loaded successfully")
except Exception as e:
    print(f"  Forecast model not loaded: {e}")

try:
    load_risk_model()
    RISK_MODEL_LOADED = True
    print("  Bluely risk model loaded successfully")
except Exception as e:
    print(f"  Risk model not loaded: {e}")


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Bluely ML API",
    description=(
        "Machine learning prediction service for Bluely diabetes management. "
        "Features three-layer architecture: global models, patient-specific "
        "personalization, and AI-powered insight generation via DiaBuddy."
    ),
    version="4.0.0",
)

# CORS — allow the Express backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Shared Schemas ───────────────────────────────────────────────────────────

class MealContext(BaseModel):
    """Most recent meal details. Required for prediction accuracy."""
    carbsEstimate: float = Field(..., ge=0, le=500, description="Grams of carbs in the meal")
    mealType: str = Field(..., description="'breakfast', 'lunch', 'dinner', or 'snack'")
    minutesSinceMeal: float = Field(..., ge=0, description="Minutes since the meal was eaten")


class MedicationContext(BaseModel):
    """Most recent medication/insulin details."""
    dose: float = Field(..., ge=0, description="Dose amount (units for insulin, mg for oral)")
    medicationType: str = Field(..., description="'insulin_rapid', 'insulin_long', 'insulin_mixed', 'metformin', 'sulfonylurea', 'other'")
    minutesSinceTaken: float = Field(..., ge=0, description="Minutes since medication was taken")


class ActivityContext(BaseModel):
    """Most recent physical activity details."""
    intensity: str = Field(..., description="'low', 'medium', or 'high'")
    durationMinutes: float = Field(..., ge=0, le=480, description="Duration of activity in minutes")
    minutesSinceActivity: float = Field(..., ge=0, description="Minutes since activity ended")


class WellnessContext(BaseModel):
    """Current wellness/mood state."""
    sleepQuality: int = Field(..., ge=1, le=5, description="Sleep quality 1 (poor) to 5 (excellent)")
    stressLevel: int = Field(..., ge=1, le=5, description="Stress level 1 (calm) to 5 (very stressed)")
    mood: str = Field(..., description="'Great', 'Good', 'Okay', 'Low', or 'Rough'")


class MissingField(BaseModel):
    """Describes a missing input field and why it matters."""
    field: str
    label: str          # Human-readable label (e.g. "Last Meal")
    reason: str         # Why this matters for prediction
    href: str           # Frontend route to log it
    icon: str           # UI icon hint


# ── Input Completeness Validation ────────────────────────────────────────────

def validate_prediction_inputs(
    meal: Optional[MealContext],
    medication: Optional[MedicationContext],
    activity: Optional[ActivityContext],
    wellness: Optional[WellnessContext],
    current_glucose: float,
    glucose_history: Optional[List[float]],
) -> List[MissingField]:
    """
    Check that all physiologically relevant inputs are present.

    Why every field matters for prediction:
    - Meals: Carbs directly raise blood glucose. Without knowing the last meal,
      we can't predict post-meal spikes or fasting drops.
    - Medication: Insulin lowers glucose significantly. Missing this data could
      lead to dangerously inaccurate predictions.
    - Activity: Exercise lowers glucose during and after. Intense exercise can
      cause temporary spikes. This context is critical.
    - Wellness: Sleep quality and stress directly affect insulin resistance
      and glucose variability through hormonal pathways.
    - History: Without prior readings, trend analysis is impossible.

    Returns list of MissingField objects. Empty list = all inputs present.
    """
    missing = []

    if meal is None:
        missing.append(MissingField(
            field="meal",
            label="Last Meal",
            reason=(
                "Carbohydrate intake directly affects blood glucose. Without meal data, "
                "the prediction cannot account for post-meal glucose rises or fasting periods."
            ),
            href="/meals",
            icon="meal",
        ))

    if medication is None:
        missing.append(MissingField(
            field="medication",
            label="Recent Medication",
            reason=(
                "Insulin and medications significantly lower blood glucose. Without this data, "
                "predictions may overestimate glucose levels or miss hypoglycemia risk."
            ),
            href="/medications",
            icon="medication",
        ))

    if activity is None:
        missing.append(MissingField(
            field="activity",
            label="Recent Activity",
            reason=(
                "Physical exercise affects glucose uptake by muscles. Even noting 'no activity' "
                "helps the model distinguish sedentary from active periods."
            ),
            href="/glucose",
            icon="activity",
        ))

    if wellness is None:
        missing.append(MissingField(
            field="wellness",
            label="Mood & Wellness",
            reason=(
                "Sleep quality and stress level affect insulin resistance through hormonal "
                "pathways (cortisol, growth hormone). This data improves prediction accuracy."
            ),
            href="/settings",
            icon="wellness",
        ))

    if not glucose_history or len(glucose_history) < 3:
        missing.append(MissingField(
            field="glucoseHistory",
            label="Previous Readings",
            reason=(
                "At least 3 prior glucose readings are needed to calculate trends, "
                "variability, and lag features. Without history, predictions lack context."
            ),
            href="/glucose",
            icon="glucose",
        ))

    return missing


# ── Endpoint: Risk Prediction ────────────────────────────────────────────────

class RiskPredictionInput(BaseModel):
    """All inputs required for glucose risk assessment."""
    currentGlucose: float = Field(..., ge=20, le=600, description="Current glucose in mg/dL")
    diabetesType: str = Field(..., description="'type1', 'type2', 'prediabetes', 'gestational', or 'other'")
    meal: Optional[MealContext] = None
    medication: Optional[MedicationContext] = None
    activity: Optional[ActivityContext] = None
    wellness: Optional[WellnessContext] = None
    glucoseHistory: Optional[List[float]] = Field(None, description="Previous readings (oldest→newest), minimum 3")
    hour: Optional[float] = Field(None, ge=0, lt=24, description="Hour of day (0-23). Auto-detected if omitted.")


class RiskPredictionOutput(BaseModel):
    riskLevel: str              # 'low', 'normal', 'high'
    riskCode: int               # 0, 1, 2
    confidence: float
    recommendation: str
    inputsComplete: bool        # Whether all required inputs were provided
    missingInputs: Optional[List[MissingField]] = None


@app.post("/predict", response_model=RiskPredictionOutput)
def predict(input_data: RiskPredictionInput):
    """
    Predict glucose risk level.

    Requires ALL inputs: glucose, meal, medication, activity, wellness, history.
    If any input is missing, returns 422 with details on what to log and why.

    This strict enforcement ensures predictions are medically meaningful —
    not guesses based on incomplete information.
    """
    try:
        # ── Validate completeness ──
        missing = validate_prediction_inputs(
            meal=input_data.meal,
            medication=input_data.medication,
            activity=input_data.activity,
            wellness=input_data.wellness,
            current_glucose=input_data.currentGlucose,
            glucose_history=input_data.glucoseHistory,
        )

        if missing:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": (
                        "Cannot generate prediction — missing required inputs. "
                        "All inputs are needed because glucose is affected by meals, "
                        "medication, activity, and wellness simultaneously."
                    ),
                    "missingInputs": [m.model_dump() for m in missing],
                    "missingCount": len(missing),
                },
            )

        if not RISK_MODEL_LOADED:
            raise HTTPException(
                status_code=503,
                detail="Risk model not loaded. Run 'python train_bluely.py' first.",
            )

        # ── Determine hour ──
        from datetime import datetime
        hour = input_data.hour if input_data.hour is not None else datetime.now().hour

        # ── Build features ──
        features = build_feature_vector(
            current_glucose=input_data.currentGlucose,
            carbs_last_meal=input_data.meal.carbsEstimate,
            minutes_since_meal=input_data.meal.minutesSinceMeal,
            meal_type=input_data.meal.mealType,
            insulin_dose=input_data.medication.dose,
            minutes_since_insulin=input_data.medication.minutesSinceTaken,
            medication_type=input_data.medication.medicationType,
            activity_intensity=input_data.activity.intensity,
            activity_duration=input_data.activity.durationMinutes,
            minutes_since_activity=input_data.activity.minutesSinceActivity,
            hour=hour,
            sleep_quality=input_data.wellness.sleepQuality,
            stress_level=input_data.wellness.stressLevel,
            mood=input_data.wellness.mood,
            glucose_history=input_data.glucoseHistory,
            diabetes_type=input_data.diabetesType,
        )

        result = predict_risk_ml(features)

        return RiskPredictionOutput(
            riskLevel=result["risk_level"],
            riskCode=result["risk_code"],
            confidence=result["confidence"],
            recommendation=result["recommendation"],
            inputsComplete=True,
            missingInputs=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoint: 30-Minute Glucose Forecast ─────────────────────────────────────

class Glucose30Input(BaseModel):
    """All inputs required for 30-minute glucose forecast."""
    currentGlucose: float = Field(..., ge=20, le=600)
    diabetesType: str = Field(...)
    meal: Optional[MealContext] = None
    medication: Optional[MedicationContext] = None
    activity: Optional[ActivityContext] = None
    wellness: Optional[WellnessContext] = None
    glucoseHistory: Optional[List[float]] = Field(None, description="Previous readings (oldest→newest)")
    hour: Optional[float] = Field(None, ge=0, lt=24)
    userId: Optional[str] = Field(None, description="Patient ID for personalized predictions")


class Glucose30Output(BaseModel):
    predictedGlucose: float
    direction: str              # 'rising', 'stable', 'dropping'
    directionArrow: str         # '↑', '→', '↓'
    directionLabel: str
    confidence: float
    timeframe: str              # "30 minutes"
    recommendation: str
    riskAlert: Optional[str] = None
    factors: List[str]
    modelUsed: str              # 'bluely_synthetic' or 'bluely_personalized'
    inputsComplete: bool
    missingInputs: Optional[List[MissingField]] = None
    personalized: bool = False
    personalizedGlucose: Optional[float] = None
    trainingSamples: Optional[int] = None
    aiInsight: Optional[str] = None
    aiInsightSource: Optional[str] = None


@app.post("/predict-glucose-30", response_model=Glucose30Output)
async def predict_glucose_30(input_data: Glucose30Input):
    """
    Predict glucose level 30 minutes from now.

    Uses the Bluely model trained on physiologically realistic synthetic data.
    If userId is provided and the patient has ≥21 readings, applies
    personalized calibration. Includes AI-generated insight via DiaBuddy.
    Requires ALL context inputs. Returns 422 if any are missing.
    """
    try:
        # ── Validate completeness ──
        missing = validate_prediction_inputs(
            meal=input_data.meal,
            medication=input_data.medication,
            activity=input_data.activity,
            wellness=input_data.wellness,
            current_glucose=input_data.currentGlucose,
            glucose_history=input_data.glucoseHistory,
        )

        if missing:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": (
                        "Cannot generate 30-minute forecast — missing required inputs. "
                        "Glucose prediction depends on meals, medication, activity, "
                        "and wellness data to be accurate."
                    ),
                    "missingInputs": [m.model_dump() for m in missing],
                    "missingCount": len(missing),
                },
            )

        if not FORECAST_MODEL_LOADED:
            raise HTTPException(
                status_code=503,
                detail="Forecast model not loaded. Run 'python train_bluely.py' first.",
            )

        from datetime import datetime
        hour = input_data.hour if input_data.hour is not None else datetime.now().hour

        # ── Build features ──
        features = build_feature_vector(
            current_glucose=input_data.currentGlucose,
            carbs_last_meal=input_data.meal.carbsEstimate,
            minutes_since_meal=input_data.meal.minutesSinceMeal,
            meal_type=input_data.meal.mealType,
            insulin_dose=input_data.medication.dose,
            minutes_since_insulin=input_data.medication.minutesSinceTaken,
            medication_type=input_data.medication.medicationType,
            activity_intensity=input_data.activity.intensity,
            activity_duration=input_data.activity.durationMinutes,
            minutes_since_activity=input_data.activity.minutesSinceActivity,
            hour=hour,
            sleep_quality=input_data.wellness.sleepQuality,
            stress_level=input_data.wellness.stressLevel,
            mood=input_data.wellness.mood,
            glucose_history=input_data.glucoseHistory,
            diabetes_type=input_data.diabetesType,
        )

        # ── Predict ──
        predicted, confidence = predict_glucose_30min(features)
        current = input_data.currentGlucose

        # ── Factors ──
        factors = ["Prediction from Bluely model (trained on synthetic physiological data)"]

        if input_data.meal.minutesSinceMeal < 60:
            factors.append(
                f"Recent meal ({input_data.meal.carbsEstimate}g carbs, "
                f"{int(input_data.meal.minutesSinceMeal)}min ago) — glucose likely still rising"
            )
        elif input_data.meal.minutesSinceMeal < 180:
            factors.append(
                f"Post-meal period ({int(input_data.meal.minutesSinceMeal)}min since meal)"
            )

        if input_data.medication.dose > 0:
            factors.append(
                f"Medication: {input_data.medication.medicationType} "
                f"({input_data.medication.dose} dose, "
                f"{int(input_data.medication.minutesSinceTaken)}min ago)"
            )

        if input_data.activity.intensity != "none" and input_data.activity.minutesSinceActivity < 180:
            factors.append(
                f"Recent {input_data.activity.intensity} activity "
                f"({int(input_data.activity.durationMinutes)}min, "
                f"{int(input_data.activity.minutesSinceActivity)}min ago)"
            )

        if input_data.wellness.stressLevel >= 4:
            factors.append("Elevated stress — may contribute to higher glucose")

        if input_data.wellness.sleepQuality <= 2:
            factors.append("Poor sleep quality — may increase insulin resistance")

        if 4 <= hour <= 7:
            factors.append("Early morning — dawn phenomenon may affect levels")

        # ── Personalization (Layer 2) ──
        personalized = False
        personalized_glucose = None
        training_samples = None
        final_predicted = predicted

        if input_data.userId:
            try:
                feature_context = {
                    "insulin_dose": input_data.medication.dose,
                    "carb_intake": input_data.meal.carbsEstimate,
                    "activity_minutes": input_data.activity.durationMinutes,
                }
                p_result = predict_personalized_glucose(
                    user_id=input_data.userId,
                    global_prediction=predicted,
                    feature_context=feature_context,
                )
                if p_result["personalized"]:
                    personalized = True
                    personalized_glucose = round(p_result["calibrated_prediction"], 1)
                    training_samples = p_result["training_samples"]
                    final_predicted = personalized_glucose
                    factors.append(
                        f"Personalized calibration applied ({training_samples} readings)"
                    )
            except Exception as pe:
                print(f"  Personalization skipped: {pe}")

        # Recalculate direction with (potentially personalized) prediction
        current = input_data.currentGlucose
        delta = final_predicted - current
        if delta > 8:
            direction = "rising"
            arrow = "\u2191"
            label = "Glucose is expected to rise over the next 30 minutes"
        elif delta < -8:
            direction = "dropping"
            arrow = "\u2193"
            label = "Glucose is expected to drop over the next 30 minutes"
        else:
            direction = "stable"
            arrow = "\u2192"
            label = "Glucose is expected to stay near current level"

        # ── Risk alert ──
        risk_alert = None
        if final_predicted < 70:
            risk_alert = "Glucose may drop below target. Monitor closely and consider a snack."
        elif final_predicted > 250:
            risk_alert = "Glucose may remain significantly elevated. Consider reviewing with your provider."
        elif final_predicted > 180:
            risk_alert = "Glucose may stay above target range."

        # ── Recommendation ──
        if direction == "rising" and final_predicted > 180:
            recommendation = (
                "An upward trend is detected with levels above target range. "
                "Consider discussing this pattern with your healthcare provider."
            )
        elif direction == "dropping" and final_predicted < 80:
            recommendation = (
                "A downward trend is detected approaching lower range. "
                "More frequent monitoring may be helpful."
            )
        elif direction == "stable" and 70 <= final_predicted <= 140:
            recommendation = "Levels appear stable and within target. Keep up your routine!"
        elif direction == "rising":
            recommendation = "A mild upward trend is expected. Staying hydrated and active may help."
        elif direction == "dropping":
            recommendation = "A mild downward trend is noted. This may reflect normal variation."
        else:
            recommendation = "Levels appear stable. Continue logging to track patterns."

        # ── AI Insight (Layer 3) ──
        ai_insight_text = None
        ai_insight_source = None
        try:
            insight_data = {
                "predicted_glucose": final_predicted,
                "risk_level": risk_alert or "normal",
                "current_glucose": current,
                "meal_type": input_data.meal.mealType,
                "insulin_dose": input_data.medication.dose,
                "activity_minutes": input_data.activity.durationMinutes,
                "carb_intake": input_data.meal.carbsEstimate,
                "personalized": personalized,
            }
            insight_result = await generate_ai_insight(insight_data)
            ai_insight_text = insight_result["insight"]
            ai_insight_source = insight_result["source"]
        except Exception as ie:
            print(f"  AI insight generation skipped: {ie}")

        return Glucose30Output(
            predictedGlucose=round(final_predicted, 1),
            direction=direction,
            directionArrow=arrow,
            directionLabel=label,
            confidence=confidence,
            timeframe="30 minutes",
            recommendation=recommendation,
            riskAlert=risk_alert,
            factors=factors,
            modelUsed="bluely_personalized" if personalized else "bluely_synthetic",
            inputsComplete=True,
            missingInputs=None,
            personalized=personalized,
            personalizedGlucose=personalized_glucose,
            trainingSamples=training_samples,
            aiInsight=ai_insight_text,
            aiInsightSource=ai_insight_source,
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoint: Trend Prediction (lighter requirements) ────────────────────────

class GlucoseReading(BaseModel):
    value: float
    readingType: str = "random"
    hour: int = 12
    dayOfWeek: int = 0


class TrendPredictionInput(BaseModel):
    readings: List[GlucoseReading] = Field(..., min_length=3)
    currentGlucose: float = Field(..., ge=20, le=600)
    diabetesType: Optional[str] = None
    lastMealHoursAgo: Optional[float] = None
    onMedication: bool = False
    activityLevel: Optional[str] = None


class TrendPredictionOutput(BaseModel):
    direction: str
    predictedNextGlucose: float
    confidence: float
    timeframe: str
    recommendation: str
    riskAlert: Optional[str] = None
    factors: List[str]


@app.post("/predict-trend", response_model=TrendPredictionOutput)
def predict_trend(input_data: TrendPredictionInput):
    """
    Predict glucose trend direction using statistical analysis
    of recent readings + contextual factors.

    This endpoint has lighter input requirements than /predict or
    /predict-glucose-30 — it works with just glucose readings.
    For full predictions, use the other endpoints.
    """
    try:
        values = [r.value for r in input_data.readings]
        current = input_data.currentGlucose
        n = len(values)

        if n < 3:
            raise HTTPException(status_code=400, detail="Need at least 3 readings")

        # Linear regression on recent values
        x = np.arange(n, dtype=float)
        y = np.array(values, dtype=float)
        slope = float(np.polyfit(x, y, 1)[0])

        # Rate of change (last 3)
        recent_3 = values[-3:]
        rate_of_change = (recent_3[-1] - recent_3[0]) / max(len(recent_3) - 1, 1)

        # Acceleration
        if n >= 4:
            acceleration = (values[-1] - values[-2]) - (values[-3] - values[-4])
        else:
            acceleration = 0.0

        cv = float(np.std(values) / np.mean(values)) if np.mean(values) > 0 else 0.0

        # Contextual adjustments
        factors = []
        adjustment = 0.0

        if input_data.lastMealHoursAgo is not None:
            if input_data.lastMealHoursAgo < 1:
                adjustment += 15
                factors.append("Recent meal — glucose tends to rise in this window")
            elif input_data.lastMealHoursAgo < 2:
                adjustment += 5
                factors.append("Post-meal period (1–2 hrs)")
            elif input_data.lastMealHoursAgo > 4:
                adjustment -= 5
                factors.append("Extended fasting — levels may drift lower")

        if input_data.onMedication:
            adjustment -= 10
            factors.append("Medication active — may influence glucose direction")

        hour = input_data.readings[-1].hour
        if 4 <= hour <= 7:
            adjustment += 8
            factors.append("Early morning — dawn phenomenon may elevate levels")
        elif 22 <= hour or hour <= 3:
            adjustment -= 5
            factors.append("Nighttime — levels tend to stabilize")

        if input_data.activityLevel in ("high", "frequent"):
            adjustment -= 8
            factors.append("High activity — may lower readings")

        if not factors:
            factors.append("Based on recent glucose trend patterns")

        # Prediction
        raw = current + slope * 2 + rate_of_change + adjustment + acceleration * 0.5
        predicted_next = max(40.0, min(400.0, raw))

        delta = predicted_next - current
        if delta > 10:
            direction = "rising"
        elif delta < -10:
            direction = "dropping"
        else:
            direction = "stable"

        # Confidence
        base_conf = min(0.5 + (n / 20) * 0.3, 0.8)
        confidence = round(max(0.3, base_conf - min(cv * 0.5, 0.3)), 2)

        # Risk
        risk_alert = None
        if predicted_next < 70:
            risk_alert = "Trend suggests glucose may drop below target"
        elif predicted_next > 250:
            risk_alert = "Trend suggests glucose may remain significantly elevated"
        elif predicted_next > 180:
            risk_alert = "Trend suggests levels may stay above target range"

        # Recommendation
        if direction == "rising" and predicted_next > 180:
            recommendation = "Upward trend with levels above target. Consider reviewing with your provider."
        elif direction == "dropping" and predicted_next < 80:
            recommendation = "Downward trend approaching lower range. Monitor more frequently."
        elif direction == "stable" and 70 <= predicted_next <= 140:
            recommendation = "Stable and within target. Keep it up!"
        elif direction == "rising":
            recommendation = "Mild upward trend. Staying active and hydrated may help."
        elif direction == "dropping":
            recommendation = "Mild downward trend — may be normal variation."
        else:
            recommendation = "Stable. Continue logging to track patterns."

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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoint: HbA1c Estimation ───────────────────────────────────────────────

class HbA1cInput(BaseModel):
    """Input for HbA1c estimation. Requires ≥21 glucose readings."""
    glucoseValues: List[float] = Field(
        ..., description="List of glucose readings in mg/dL. Minimum 21 required."
    )


class HbA1cOutput(BaseModel):
    estimatedHbA1c: Optional[float] = None      # Percentage, e.g. 6.5
    averageGlucose: Optional[float] = None      # mg/dL
    glucoseStd: Optional[float] = None          # Standard deviation
    readingCount: int
    readingsNeeded: int                         # 0 if sufficient
    confidenceNote: str
    interpretation: Optional[str] = None


@app.post("/estimate-hba1c", response_model=HbA1cOutput)
def estimate_hba1c_endpoint(input_data: HbA1cInput):
    """
    Estimate HbA1c from a patient's glucose readings.

    Uses the ADAG (A1c-Derived Average Glucose) formula:
        HbA1c (%) = (mean glucose mg/dL + 46.7) / 28.7

    Requirements:
      - Minimum 21 readings for statistical significance.
      - More readings and varied times (fasting, post-meal) improve accuracy.
      - Ideally spans multiple weeks/months for representative average.

    If fewer than 21 readings are provided, returns the count and how many
    more are needed, without making an estimate.
    """
    try:
        result = estimate_hba1c(input_data.glucoseValues)
        return HbA1cOutput(
            estimatedHbA1c=result["estimated_hba1c"],
            averageGlucose=result["average_glucose"],
            glucoseStd=result.get("glucose_std"),
            readingCount=result["reading_count"],
            readingsNeeded=result["readings_needed"],
            confidenceNote=result["confidence_note"],
            interpretation=result["interpretation"],
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoint: Weekly Trend Analysis ──────────────────────────────────────────

class WeeklyReading(BaseModel):
    value: float
    readingType: str = "random"
    hour: int = 12
    day: int = 0  # 0=Mon, 6=Sun


class WeeklyAnalysisInput(BaseModel):
    readings: List[WeeklyReading] = Field(..., min_length=7)
    diabetesType: Optional[str] = None
    targetMin: float = Field(default=70, ge=40)
    targetMax: float = Field(default=180, le=400)


class WeeklyAnalysisOutput(BaseModel):
    averageGlucose: float
    glucoseStd: float
    timeInRange: float              # Percentage of readings within target
    timeBelowRange: float           # Percentage below target
    timeAboveRange: float           # Percentage above target
    fastingAverage: Optional[float] = None
    postMealAverage: Optional[float] = None
    bestDay: Optional[str] = None   # Day of week with best control
    worstDay: Optional[str] = None  # Day of week with worst control
    insights: List[str]


@app.post("/analyze-weekly", response_model=WeeklyAnalysisOutput)
def analyze_weekly(input_data: WeeklyAnalysisInput):
    """
    Analyze glucose patterns over a week of readings.

    Provides:
    - Time in range (TIR) — key metric for diabetes management
    - Fasting vs post-meal averages
    - Day-of-week patterns
    - Actionable insights
    """
    try:
        values = [r.value for r in input_data.readings]
        target_min = input_data.targetMin
        target_max = input_data.targetMax

        avg = float(np.mean(values))
        std = float(np.std(values))

        in_range = sum(1 for v in values if target_min <= v <= target_max)
        below = sum(1 for v in values if v < target_min)
        above = sum(1 for v in values if v > target_max)
        total = len(values)

        tir = round(in_range / total * 100, 1)
        tbr = round(below / total * 100, 1)
        tar = round(above / total * 100, 1)

        # Fasting vs post-meal
        fasting = [r.value for r in input_data.readings if r.readingType == "fasting"]
        post_meal = [r.value for r in input_data.readings if r.readingType == "after_meal"]
        fasting_avg = round(float(np.mean(fasting)), 1) if fasting else None
        post_meal_avg = round(float(np.mean(post_meal)), 1) if post_meal else None

        # Day-of-week analysis
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_values: Dict[int, List[float]] = {}
        for r in input_data.readings:
            day_values.setdefault(r.day, []).append(r.value)

        best_day = None
        worst_day = None
        if day_values:
            day_avgs = {d: float(np.mean(vs)) for d, vs in day_values.items()}
            # Best day = closest to target midpoint
            target_mid = (target_min + target_max) / 2
            best_d = min(day_avgs, key=lambda d: abs(day_avgs[d] - target_mid))
            worst_d = max(day_avgs, key=lambda d: abs(day_avgs[d] - target_mid))
            if best_d < len(day_names):
                best_day = day_names[best_d]
            if worst_d < len(day_names):
                worst_day = day_names[worst_d]

        # Insights
        insights = []
        if tir >= 70:
            insights.append(
                f"Great work! {tir}% of your readings are within target range. "
                f"The recommended goal is ≥70%."
            )
        elif tir >= 50:
            insights.append(
                f"{tir}% time-in-range. This is improving — aim for ≥70% as recommended."
            )
        else:
            insights.append(
                f"{tir}% time-in-range is below the ≥70% target. "
                f"Consider reviewing your meal plan and medication timing with your provider."
            )

        if tbr > 5:
            insights.append(
                f"Caution: {tbr}% of readings are below range ({target_min} mg/dL). "
                f"Frequent lows increase hypoglycemia risk."
            )

        if tar > 25:
            insights.append(
                f"{tar}% of readings are above range ({target_max} mg/dL). "
                f"Post-meal and stress management strategies may help."
            )

        if fasting_avg and fasting_avg > 130:
            insights.append(
                f"Fasting average is {fasting_avg} mg/dL — above the 80-130 target. "
                f"Consider discussing basal insulin or evening routines with your provider."
            )

        if post_meal_avg and post_meal_avg > 180:
            insights.append(
                f"Post-meal average is {post_meal_avg} mg/dL — above 180 target. "
                f"Meal composition and portion control may help."
            )

        if std > 50:
            insights.append(
                f"Glucose variability is high (SD: {round(std)} mg/dL). "
                f"Consistent meal timing and balanced carb intake may reduce swings."
            )

        if not insights:
            insights.append("Keep logging regularly to build a clearer picture of your patterns.")

        return WeeklyAnalysisOutput(
            averageGlucose=round(avg, 1),
            glucoseStd=round(std, 1),
            timeInRange=tir,
            timeBelowRange=tbr,
            timeAboveRange=tar,
            fastingAverage=fasting_avg,
            postMealAverage=post_meal_avg,
            bestDay=best_day,
            worstDay=worst_day,
            insights=insights,
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Health Check ─────────────────────────────────────────────────────────────

# ── Endpoint: Personalization Update ─────────────────────────────────────────

class PersonalizationUpdateInput(BaseModel):
    """Input for updating patient personalization parameters."""
    userId: str = Field(..., description="Patient identifier")
    predictedGlucose: float = Field(..., ge=20, le=600, description="What the model predicted")
    actualGlucose: float = Field(..., ge=20, le=600, description="What the actual reading was")
    context: Optional[Dict] = Field(None, description="Feature context (insulin, carbs, activity)")


class PersonalizationUpdateOutput(BaseModel):
    updated: bool
    trainingSamples: int
    isPersonalized: bool
    message: str


@app.post("/personalization/update", response_model=PersonalizationUpdateOutput)
def personalization_update(input_data: PersonalizationUpdateInput):
    """
    Update patient personalization parameters with a new predicted/actual pair.

    Called by the backend whenever a patient logs a glucose reading
    that corresponds to a previous 30-min prediction. The system learns
    from prediction errors to improve future predictions for this patient.
    """
    try:
        context = input_data.context or {}
        profile = update_patient_parameters(
            user_id=input_data.userId,
            predicted=input_data.predictedGlucose,
            actual=input_data.actualGlucose,
            context=context,
        )
        return PersonalizationUpdateOutput(
            updated=True,
            trainingSamples=profile.training_samples,
            isPersonalized=profile.is_personalized,
            message=(
                f"Profile updated ({profile.training_samples} samples). "
                f"{'Personalization active.' if profile.is_personalized else f'Need {21 - profile.training_samples} more readings for personalization.'}"
            ),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoint: Get Personalization Profile ────────────────────────────────────

class PersonalizationProfileOutput(BaseModel):
    userId: str
    trainingSamples: int
    isPersonalized: bool
    baselineGlucoseBias: float
    insulinSensitivityFactor: float
    carbResponseFactor: float
    activityResponseFactor: float
    ewmaResidual: float


@app.get("/personalization/profile/{user_id}", response_model=PersonalizationProfileOutput)
def get_personalization_profile(user_id: str):
    """Get the personalization profile for a patient."""
    try:
        profile = load_patient_profile(user_id)
        return PersonalizationProfileOutput(
            userId=profile.user_id,
            trainingSamples=profile.training_samples,
            isPersonalized=profile.is_personalized,
            baselineGlucoseBias=round(profile.baseline_glucose_bias, 2),
            insulinSensitivityFactor=round(profile.insulin_sensitivity_factor, 3),
            carbResponseFactor=round(profile.carb_response_factor, 3),
            activityResponseFactor=round(profile.activity_response_factor, 3),
            ewmaResidual=round(profile.ewma_residual, 2),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoint: AI Insight ─────────────────────────────────────────────────────

class AIInsightInput(BaseModel):
    """Input for generating an AI insight for a prediction."""
    predictedGlucose: float
    currentGlucose: float
    riskLevel: Optional[str] = "normal"
    mealType: Optional[str] = "none"
    insulinDose: Optional[float] = 0
    activityMinutes: Optional[float] = 0
    carbIntake: Optional[float] = 0
    personalized: bool = False


class AIInsightOutput(BaseModel):
    insight: str
    source: str         # 'ai' or 'rule-based'
    provider: Optional[str] = None


@app.post("/ai-insight", response_model=AIInsightOutput)
async def ai_insight_endpoint(input_data: AIInsightInput):
    """
    Generate an AI-powered insight for prediction data.
    Falls back to rule-based templates if LLM is unavailable.
    """
    try:
        prediction_data = {
            "predicted_glucose": input_data.predictedGlucose,
            "current_glucose": input_data.currentGlucose,
            "risk_level": input_data.riskLevel,
            "meal_type": input_data.mealType,
            "insulin_dose": input_data.insulinDose,
            "activity_minutes": input_data.activityMinutes,
            "carb_intake": input_data.carbIntake,
            "personalized": input_data.personalized,
        }
        result = await generate_ai_insight(prediction_data)
        return AIInsightOutput(
            insight=result["insight"],
            source=result["source"],
            provider=result.get("provider"),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoint: DiaBuddy Summary ───────────────────────────────────────────────

class DiaBuddyReadingInput(BaseModel):
    value: float
    readingType: Optional[str] = "random"


class DiaBuddySummaryInput(BaseModel):
    """Input for DiaBuddy health summary generation."""
    readings: List[DiaBuddyReadingInput] = Field(..., min_length=1)
    profile: Optional[Dict] = Field(None, description="User health profile data")


class DiaBuddySummaryOutput(BaseModel):
    summary: str
    source: str         # 'ai' or 'rule-based'
    provider: Optional[str] = None


@app.post("/diabuddy/summarize", response_model=DiaBuddySummaryOutput)
async def diabuddy_summarize(input_data: DiaBuddySummaryInput):
    """
    Generate a DiaBuddy health summary from recent glucose readings.
    Uses LLM for personalized, warm summaries with rule-based fallback.
    """
    try:
        readings_data = [{"value": r.value, "readingType": r.readingType} for r in input_data.readings]
        profile_data = input_data.profile or {}

        result = await generate_summary_insight(readings_data, profile_data)
        return DiaBuddySummaryOutput(
            summary=result["summary"],
            source=result["source"],
            provider=result.get("provider"),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoint: DiaBuddy Chat ─────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)

class DiaBuddyChatInput(BaseModel):
    messages: List[ChatMessage]
    userName: Optional[str] = None
    userDataContext: Optional[str] = None

class ChatAction(BaseModel):
    type: str              # 'LOG_GLUCOSE' or 'LOG_MEAL'
    data: Dict[str, str]   # parsed fields

class DiaBuddyChatOutput(BaseModel):
    reply: str
    source: str           # 'ai' or 'fallback'
    provider: Optional[str] = None
    actions: Optional[List[ChatAction]] = None


import re as _re

def _parse_chat_actions(text: str):
    """
    Extract [ACTION:...] tags from LLM reply.
    Returns (cleaned_reply, actions_list).
    """
    action_pattern = _re.compile(r'\[ACTION:(LOG_GLUCOSE|LOG_MEAL)\|([^\]]+)\]')
    actions = []

    for match in action_pattern.finditer(text):
        action_type = match.group(1)
        params = match.group(2).split('|')

        if action_type == 'LOG_GLUCOSE' and len(params) >= 1:
            try:
                value = float(params[0].strip())
                if 20 <= value <= 600:
                    reading_type = params[1].strip() if len(params) > 1 else 'random'
                    valid_types = {'fasting', 'before_meal', 'after_meal', 'bedtime', 'random'}
                    if reading_type not in valid_types:
                        reading_type = 'random'
                    actions.append(ChatAction(
                        type='LOG_GLUCOSE',
                        data={'value': str(int(value)), 'readingType': reading_type}
                    ))
            except (ValueError, IndexError):
                pass

        elif action_type == 'LOG_MEAL' and len(params) >= 3:
            try:
                description = params[0].strip()
                meal_type = params[1].strip().lower()
                carbs = params[2].strip()
                valid_meal_types = {'breakfast', 'lunch', 'dinner', 'snack'}
                if meal_type not in valid_meal_types:
                    meal_type = 'snack'
                carbs_num = float(carbs)
                if 0 < carbs_num <= 500 and description:
                    actions.append(ChatAction(
                        type='LOG_MEAL',
                        data={
                            'description': description[:300],
                            'mealType': meal_type,
                            'carbsEstimate': str(int(carbs_num))
                        }
                    ))
            except (ValueError, IndexError):
                pass

    # Strip action tags from visible reply
    cleaned = action_pattern.sub('', text).strip()
    return cleaned, actions if actions else None


@app.post("/diabuddy/chat", response_model=DiaBuddyChatOutput)
async def diabuddy_chat(input_data: DiaBuddyChatInput):
    """
    Conversational chat with DiaBuddy.
    Only answers diabetes-related questions, never gives medical advice.
    """
    try:
        llm = LLMInterface()

        # Build messages list, injecting user context
        messages = []

        # Inject user data context as a system-level preamble in the first user message
        context_prefix = ""
        if input_data.userName:
            context_prefix += f"[User's name is {input_data.userName}] "
        if input_data.userDataContext:
            context_prefix += f"[USER DATA CONTEXT: {input_data.userDataContext}] "

        for msg in input_data.messages:
            content = msg.content
            if msg.role == "user" and not messages and context_prefix:
                content = f"{context_prefix}{content}"
            messages.append({"role": msg.role, "content": content})

        reply = await llm.chat(messages, max_tokens=400, temperature=0.7)

        if reply:
            cleaned_reply, actions = _parse_chat_actions(reply)
            return DiaBuddyChatOutput(
                reply=cleaned_reply,
                source="ai",
                provider=llm.get_active_provider(),
                actions=actions,
            )

        # Fallback if all providers fail
        return DiaBuddyChatOutput(
            reply="I'm having trouble connecting right now. Please try again in a moment!",
            source="fallback",
            provider=None,
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health/llm")
async def health_check_llm():
    """Ping LLM providers to verify connectivity."""
    from ai_insights.llm_interface import LLMInterface
    llm = LLMInterface()
    results = {}

    # Test each configured provider with a trivial prompt
    for provider in llm.providers:
        try:
            if provider.value == "deepseek":
                reply = await llm._call_chat_openai_compat(
                    "https://api.deepseek.com/chat/completions",
                    llm.deepseek_key, "deepseek-chat",
                    [{"role": "user", "content": "Reply with OK"}],
                    max_tokens=5, temperature=0,
                )
                results["deepseek"] = {"status": "connected", "reply": reply}
            elif provider.value == "openai":
                reply = await llm._call_chat_openai_compat(
                    "https://api.openai.com/v1/chat/completions",
                    llm.openai_key, "gpt-4o-mini",
                    [{"role": "user", "content": "Reply with OK"}],
                    max_tokens=5, temperature=0,
                )
                results["openai"] = {"status": "connected", "reply": reply}
            elif provider.value == "ollama":
                reply = await llm._call_chat_ollama(
                    [{"role": "user", "content": "Reply with OK"}],
                    max_tokens=5, temperature=0,
                )
                results["ollama"] = {"status": "connected", "reply": reply}
        except Exception as e:
            results[provider.value] = {"status": "failed", "error": str(e)}

    has_key = bool(llm.deepseek_key)
    any_connected = any(r["status"] == "connected" for r in results.values())

    return {
        "llmProviders": results,
        "deepseekKeyConfigured": has_key,
        "anyProviderConnected": any_connected,
        "providerOrder": [p.value for p in llm.providers],
    }


@app.get("/health")
def health_check():
    """Health check — confirms which models are loaded and ready."""
    return {
        "status": "healthy",
        "version": "4.0.0",
        "models": {
            "forecast": "loaded" if FORECAST_MODEL_LOADED else "not loaded",
            "risk": "loaded" if RISK_MODEL_LOADED else "not loaded",
        },
        "features": {
            "personalization": True,
            "aiInsights": True,
            "diabuddy": True,
            "diabuddyChat": True,
        },
        "dataSource": "synthetic (physiologically modeled)",
        "inputEnforcement": True,
    }


# ── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        reload_dirs=[os.path.dirname(os.path.abspath(__file__))],
        reload_excludes=["venv/*", "data/*", "models/*", "__pycache__/*"],
    )
