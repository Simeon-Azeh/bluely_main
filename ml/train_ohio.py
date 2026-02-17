"""
OhioT1DM Temporal Glucose Prediction — Training Script
========================================================
Trains a gradient-boosted regression model on the OhioT1DM dataset to
predict glucose values 30 minutes into the future, using CGM history,
meal/bolus/exercise/sleep context, and physiological signals.

Complements the Pima-based risk classifier (train.py) by adding a
temporal, patient-aware prediction capability.

Dataset citation:
    Marling C, Bunescu R. The OhioT1DM Dataset for Blood Glucose Level
    Prediction: Update 2020. CEUR Workshop Proc. 2020;2675:71-74.
    PMID: 33584164; PMCID: PMC7881904.

Usage:
    python train_ohio.py

Output:
    models/ohio_glucose_predictor.joblib  — trained GBR model
    models/ohio_scaler.joblib             — feature scaler
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

from parse_ohio import load_all_patients, build_temporal_features, PATIENT_IDS

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)


def train():
    print("=" * 60)
    print("OhioT1DM Temporal Glucose Prediction — Training")
    print("=" * 60)

    # ── 1. Load all patients ───────────────────────────────────────────────
    print("\n[1/5] Loading patient data ...")
    all_data = load_all_patients()

    if not all_data:
        print("ERROR: No patient data found. Ensure XML files are in data/ohiot1dm/")
        sys.exit(1)

    # ── 2. Build features ─────────────────────────────────────────────────
    print("\n[2/5] Building temporal features ...")
    train_X_all, train_y_all = [], []
    test_X_all, test_y_all = [], []

    for pid in PATIENT_IDS:
        if pid not in all_data:
            continue

        train_data, test_data = all_data[pid]

        # Training features
        X_tr, y_tr = build_temporal_features(
            glucose_df=train_data["glucose"],
            meal_df=train_data["meal"],
            bolus_df=train_data["bolus"],
            exercise_df=train_data["exercise"],
            sleep_df=train_data["sleep"],
            heart_rate_df=train_data["heart_rate"],
            steps_df=train_data["steps"],
        )
        if len(X_tr) > 0:
            train_X_all.append(X_tr)
            train_y_all.append(y_tr)
            print(f"  Patient {pid} train: {X_tr.shape[0]} samples")

        # Testing features
        X_te, y_te = build_temporal_features(
            glucose_df=test_data["glucose"],
            meal_df=test_data["meal"],
            bolus_df=test_data["bolus"],
            exercise_df=test_data["exercise"],
            sleep_df=test_data["sleep"],
            heart_rate_df=test_data["heart_rate"],
            steps_df=test_data["steps"],
        )
        if len(X_te) > 0:
            test_X_all.append(X_te)
            test_y_all.append(y_te)
            print(f"  Patient {pid} test:  {X_te.shape[0]} samples")

    X_train = np.vstack(train_X_all)
    y_train = np.concatenate(train_y_all)
    X_test = np.vstack(test_X_all)
    y_test = np.concatenate(test_y_all)

    print(f"\n  Total training samples: {X_train.shape[0]}")
    print(f"  Total test samples:     {X_test.shape[0]}")
    print(f"  Feature dimension:      {X_train.shape[1]}")

    # ── 3. Scale features ──────────────────────────────────────────────────
    print("\n[3/5] Scaling features ...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── 4. Train model ─────────────────────────────────────────────────────
    print("\n[4/5] Training Gradient Boosting Regressor ...")
    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        min_samples_split=10,
        min_samples_leaf=5,
        subsample=0.8,
        random_state=42,
        loss="squared_error",
    )
    model.fit(X_train_scaled, y_train)

    # ── 5. Evaluate ────────────────────────────────────────────────────────
    print("\n[5/5] Evaluating ...")
    y_pred_train = model.predict(X_train_scaled)
    y_pred_test = model.predict(X_test_scaled)

    print("\n=== Training Set ===")
    print(f"  MAE:  {mean_absolute_error(y_train, y_pred_train):.2f} mg/dL")
    print(f"  RMSE: {np.sqrt(mean_squared_error(y_train, y_pred_train)):.2f} mg/dL")
    print(f"  R²:   {r2_score(y_train, y_pred_train):.4f}")

    print("\n=== Test Set ===")
    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    r2 = r2_score(y_test, y_pred_test)
    print(f"  MAE:  {mae:.2f} mg/dL")
    print(f"  RMSE: {rmse:.2f} mg/dL")
    print(f"  R²:   {r2:.4f}")

    # Clarke Error Grid zones (simplified)
    within_20 = np.mean(np.abs(y_pred_test - y_test) <= 20) * 100
    within_40 = np.mean(np.abs(y_pred_test - y_test) <= 40) * 100
    print(f"\n  Within ±20 mg/dL: {within_20:.1f}%")
    print(f"  Within ±40 mg/dL: {within_40:.1f}%")

    # Per-patient evaluation
    print("\n=== Per-Patient Test MAE ===")
    offset = 0
    for pid in PATIENT_IDS:
        if pid not in all_data:
            continue
        test_data = all_data[pid][1]
        X_p, y_p = build_temporal_features(
            glucose_df=test_data["glucose"],
            meal_df=test_data["meal"],
            bolus_df=test_data["bolus"],
            exercise_df=test_data["exercise"],
            sleep_df=test_data["sleep"],
            heart_rate_df=test_data["heart_rate"],
            steps_df=test_data["steps"],
        )
        if len(X_p) > 0:
            X_p_scaled = scaler.transform(X_p)
            y_p_pred = model.predict(X_p_scaled)
            p_mae = mean_absolute_error(y_p, y_p_pred)
            print(f"  Patient {pid}: MAE = {p_mae:.2f} mg/dL ({len(X_p)} samples)")

    # ── Save ───────────────────────────────────────────────────────────────
    model_path = os.path.join(MODEL_DIR, "ohio_glucose_predictor.joblib")
    scaler_path = os.path.join(MODEL_DIR, "ohio_scaler.joblib")
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    print(f"\n✓ Model saved: {model_path}")
    print(f"✓ Scaler saved: {scaler_path}")
    print(f"\n{'=' * 60}")
    print(f"Training complete! Test MAE: {mae:.2f} mg/dL, R²: {r2:.4f}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    train()
