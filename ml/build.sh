#!/usr/bin/env bash
# Render build script for Bluely ML service
set -o errexit

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Checking for trained models..."
if [ ! -f "models/glucose_model.joblib" ] || [ ! -f "models/ohio_glucose_predictor.joblib" ]; then
    echo "==> Model files not found. Training models..."
    
    # Train Pima model (only needs data/diabetes.csv)
    if [ -f "data/diabetes.csv" ]; then
        echo "    Training Pima risk classifier..."
        python train.py
    else
        echo "    WARNING: data/diabetes.csv not found — Pima model will not be available"
    fi
    
    # Train OhioT1DM model (needs data/ohiot1dm/*.xml)
    if [ -d "data/ohiot1dm" ] && [ "$(ls -A data/ohiot1dm/*.xml 2>/dev/null)" ]; then
        echo "    Training OhioT1DM temporal predictor..."
        python train_ohio.py
    else
        echo "    WARNING: OhioT1DM data not found — temporal model will not be available"
    fi
else
    echo "==> Models already present. Skipping training."
fi

echo "==> Build complete!"
