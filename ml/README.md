# Bluely ML Module

Machine learning service for glucose prediction, risk classification, HbA1c estimation, and weekly analysis. Uses physiologically realistic synthetic data - no external datasets required.

## Quick Start

### 1. Create a virtual environment

```bash
cd ml
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Generate synthetic training data

```bash
python generate_synthetic_data.py
```

This simulates 200 virtual patients over 10 days each, producing ~135,000 physiologically realistic glucose samples in `data/synthetic_training_data.csv`.

### 4. Train the models

```bash
python train_bluely.py
```

Trains two models on the synthetic data:
- **Forecast**: Gradient Boosting Regressor (predicts glucose 30 min ahead) - MAE: 2.46 mg/dL
- **Risk**: Random Forest Classifier (classifies low/normal/high risk) - Accuracy: 99.3%

Output files:
- `models/bluely_forecast_model.joblib`
- `models/bluely_forecast_scaler.joblib`
- `models/bluely_risk_model.joblib`
- `models/bluely_risk_scaler.joblib`

### 5. Start the prediction server

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Test the endpoints

**Risk prediction:**
```bash
curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d "{\"currentGlucose\": 165, \"diabetesType\": \"type2\", \"meal\": {\"carbsEstimate\": 45, \"mealType\": \"lunch\", \"minutesSinceMeal\": 90}, \"medication\": {\"dose\": 500, \"medicationType\": \"metformin\", \"minutesSinceTaken\": 120}, \"activity\": {\"intensity\": \"low\", \"durationMinutes\": 20, \"minutesSinceActivity\": 180}, \"wellness\": {\"sleepQuality\": 4, \"stressLevel\": 2, \"mood\": \"Good\"}, \"glucoseHistory\": [140, 155, 160, 162, 165], \"hour\": 14}"
```

**Health check:**
```bash
curl http://localhost:8000/health
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Glucose risk classification (requires full context) |
| POST | `/predict-glucose-30` | 30-minute glucose forecast (requires full context) |
| POST | `/predict-trend` | Trend direction from readings |
| POST | `/estimate-hba1c` | HbA1c estimation from glucose values |
| POST | `/analyze-weekly` | Weekly time-in-range analysis |
| GET | `/health` | Service health check |

All strict endpoints return 422 with `missingInputs` details when required data is absent.

## Hybrid Fine-Tuning

Once real user data is available (>=21 readings), blend it with synthetic data:

```bash
python train_bluely.py --finetune path/to/real_data.csv
```

## Deploying to Render

1. Ensure `ml/models/*.joblib` files are committed to git
2. Create a **Web Service** on Render:

| Setting | Value |
|---------|-------|
| **Root Directory** | `ml` |
| **Runtime** | Python |
| **Build Command** | `chmod +x build.sh && ./build.sh` |
| **Start Command** | `gunicorn server:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120` |

3. Set environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `PYTHON_VERSION` | `3.12.7` | **Yes** - pandas/numpy fail on 3.14 |

## File Structure

```
ml/
|-- generate_synthetic_data.py  # Physiological glucose simulation
|-- train_bluely.py             # Train forecast + risk models
|-- predict_bluely.py           # Feature engineering + predictions
|-- server.py                   # FastAPI v3.0 server
|-- requirements.txt            # Python dependencies
|-- build.sh                    # Render build script
|-- data/
|   +-- synthetic_training_data.csv
|-- models/
|   |-- bluely_forecast_model.joblib
|   |-- bluely_forecast_scaler.joblib
|   |-- bluely_risk_model.joblib
|   +-- bluely_risk_scaler.joblib
```

See [ML_DOCUMENTATION.md](../ML_DOCUMENTATION.md) for full technical documentation.
