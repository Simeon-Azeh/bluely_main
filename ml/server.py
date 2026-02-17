"""
Bluely ML FastAPI Prediction Server
====================================
Loads the trained model and exposes a POST /predict endpoint.

Run:
    uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from predict import predict_risk
import os

app = FastAPI(
    title="Bluely ML API",
    description="Machine learning prediction service for Bluely diabetes management",
    version="1.0.0",
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


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Health check — confirms the model is loaded and ready."""
    return {"status": "healthy", "model": "loaded", "version": "1.0.0"}


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


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
