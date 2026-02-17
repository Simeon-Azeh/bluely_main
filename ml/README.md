# Bluely ML Module

## Setup

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

### 3. Download the dataset

Download the [Pima Indians Diabetes Dataset](https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database) and place `diabetes.csv` inside `ml/data/`.

### 4. Train the models

**Pima risk classifier:**
```bash
python train.py
```

**OhioT1DM temporal predictor:**
```bash
python train_ohio.py
```

This will output evaluation metrics and save:
- `models/glucose_model.joblib` — Random Forest model (Pima)
- `models/scaler.joblib` — Feature scaler (Pima)
- `models/logistic_model.joblib` — Logistic Regression baseline (Pima)
- `models/ohio_glucose_predictor.joblib` — Gradient Boosting Regressor (OhioT1DM)
- `models/ohio_scaler.joblib` — Feature scaler (OhioT1DM)

### 5. Start the prediction server

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

Or simply:

```bash
python server.py
```

### 6. Test the endpoint

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"glucose": 148, "age": 33, "bmi": 28.5}'
```

## Deploying to Render

### Quick Setup

1. **Ensure models are committed** — `ml/models/*.joblib` must be in git (not gitignored)
2. Create a **Web Service** on Render with the settings below
3. Set `PYTHON_VERSION=3.12.7` in environment variables

### Render Configuration

| Setting | Value |
|---------|-------|
| **Root Directory** | `ml` |
| **Runtime** | Python |
| **Build Command** | `chmod +x build.sh && ./build.sh` |
| **Start Command** | `gunicorn server:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120` |

### Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `PYTHON_VERSION` | `3.12.7` | **Yes** — pandas/numpy fail on Python 3.14 |
| `PORT` | `8000` | Optional (Render auto-injects on paid plans) |

### Why Python 3.12?

Render defaults to Python 3.14, which is too new for scientific Python packages. `pandas 2.x` fails to compile its Cython/C++ extensions on 3.14. Python 3.12 is the latest fully compatible version.

### Verify Deploy

```bash
curl https://your-service.onrender.com/health
# {"status":"ok","models":{"pima":"loaded","ohio":"loaded"}}
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/predict` | Run Pima risk prediction |
| POST | `/predict-trend` | User-data glucose trend prediction |

## Datasets

| Dataset | Purpose | Files |
|---------|---------|-------|
| Pima Indians Diabetes | Static risk classification | `data/diabetes.csv` |
| OhioT1DM (Marling & Bunescu, 2020) | Temporal glucose prediction | `data/ohiot1dm/*.xml` |

## Project Structure

```
ml/
├── data/
│   ├── diabetes.csv              # Pima Indians dataset
│   └── ohiot1dm/                 # OhioT1DM XML dataset (6 patients)
├── models/
│   ├── glucose_model.joblib      # Pima Random Forest
│   ├── logistic_model.joblib     # Pima Logistic Regression
│   ├── scaler.joblib             # Pima feature scaler
│   ├── ohio_glucose_predictor.joblib  # OhioT1DM GBR
│   └── ohio_scaler.joblib        # OhioT1DM scaler
├── train.py                      # Pima training pipeline
├── train_ohio.py                 # OhioT1DM training pipeline
├── parse_ohio.py                 # OhioT1DM XML parser
├── predict.py                    # Prediction utility
├── server.py                     # FastAPI server
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```
