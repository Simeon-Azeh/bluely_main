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

### 4. Train the model

```bash
python train.py
```

This will output evaluation metrics and save:
- `models/glucose_model.joblib` — Random Forest model
- `models/scaler.joblib` — Feature scaler
- `models/logistic_model.joblib` — Logistic Regression baseline

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

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/predict` | Run prediction |

## Project Structure

```
ml/
├── data/
│   └── diabetes.csv          # Pima Indians dataset
├── models/
│   ├── glucose_model.joblib  # Trained Random Forest
│   ├── scaler.joblib         # Feature scaler
│   └── logistic_model.joblib # Baseline model
├── train.py                  # Training pipeline
├── predict.py                # Prediction utility
├── server.py                 # FastAPI server
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```
