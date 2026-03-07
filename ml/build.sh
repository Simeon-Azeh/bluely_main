#!/usr/bin/env bash
# Render build script for Bluely ML service
set -o errexit

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Checking for trained models..."

# Train Bluely models (primary — used by /predict-glucose-30 and /predict)
if [ ! -f "models/bluely_forecast_model.joblib" ] || [ ! -f "models/bluely_risk_model.joblib" ]; then
    echo "==> Bluely model files not found. Training..."
    if [ -f "data/synthetic_training_data.csv" ]; then
        echo "    Training Bluely forecast + risk models..."
        python train_bluely.py
    elif [ -f "generate_synthetic_data.py" ]; then
        echo "    Generating synthetic data first..."
        python generate_synthetic_data.py
        echo "    Training Bluely forecast + risk models..."
        python train_bluely.py
    else
        echo "    WARNING: Cannot train Bluely models — no training data or generator found"
    fi
else
    echo "==> Bluely models already present. Skipping training."
fi

# Train legacy models (Pima + OhioT1DM — optional)
if [ ! -f "models/glucose_model.joblib" ]; then
    if [ -f "data/diabetes.csv" ]; then
        echo "    Training Pima risk classifier..."
        python train.py
    else
        echo "    WARNING: data/diabetes.csv not found — Pima model will not be available"
    fi
else
    echo "==> Pima model already present."
fi

if [ ! -f "models/ohio_glucose_predictor.joblib" ]; then
    if [ -d "data/ohiot1dm" ] && [ "$(ls -A data/ohiot1dm/*.xml 2>/dev/null)" ]; then
        echo "    Training OhioT1DM temporal predictor..."
        python train_ohio.py
    else
        echo "    WARNING: OhioT1DM data not found — temporal model will not be available"
    fi
else
    echo "==> OhioT1DM model already present."
fi

echo "==> Build complete!"
