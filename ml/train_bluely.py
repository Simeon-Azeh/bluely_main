"""
Bluely ML Training Pipeline
=============================
Trains prediction models on synthetic data (no foreign datasets).
Supports hybrid mode: synthetic-only when data is sparse, fine-tuning
with real user data once ≥21 readings are available per patient.

Models trained:
  1. Gradient Boosting Regressor — 30-minute glucose forecast
  2. Random Forest Classifier — glucose risk level (low/normal/high)

Physiological context:
  All 21 input features capture the key physiological drivers of glucose:
  current level, meal intake, insulin/medication timing, exercise,
  circadian rhythm, stress, sleep, mood, and recent glucose trend.
  See generate_synthetic_data.py for feature definitions.

Usage:
    python train_bluely.py                          # Train on synthetic data
    python train_bluely.py --finetune user_data.csv # Fine-tune with real data

Output:
    models/bluely_forecast_model.joblib   — 30-min glucose regressor
    models/bluely_forecast_scaler.joblib  — feature scaler for forecast model
    models/bluely_risk_model.joblib       — risk classifier
    models/bluely_risk_scaler.joblib      — feature scaler for risk model
"""

import os
import sys
import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    classification_report,
    accuracy_score,
    f1_score,
)
import joblib

# Feature schema — must match generate_synthetic_data.py and predict_bluely.py
FEATURE_NAMES = [
    "current_glucose", "carbs_last_meal", "minutes_since_meal", "meal_type",
    "insulin_dose", "minutes_since_insulin", "medication_type",
    "activity_intensity", "activity_duration", "minutes_since_activity",
    "hour_sin", "hour_cos", "sleep_quality", "stress_level", "mood_score",
    "glucose_lag_1", "glucose_lag_2", "glucose_lag_3",
    "glucose_trend", "glucose_std", "diabetes_type",
]

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
SYNTHETIC_DATA_PATH = os.path.join(DATA_DIR, "synthetic_training_data.csv")


def load_data(path: str) -> pd.DataFrame:
    """Load and validate training data CSV."""
    df = pd.read_csv(path)
    missing = [f for f in FEATURE_NAMES if f not in df.columns]
    if missing:
        raise ValueError(f"Missing required feature columns: {missing}")
    if "future_glucose_30min" not in df.columns:
        raise ValueError("Missing target column: future_glucose_30min")
    if "risk_level" not in df.columns:
        raise ValueError("Missing target column: risk_level")
    return df


def train_forecast_model(X_train, y_train, X_test, y_test):
    """
    Train the 30-minute glucose forecast model (Gradient Boosting Regressor).

    Why Gradient Boosting:
    - Handles non-linear relationships (meal spikes, insulin curves)
    - Robust to feature scale differences
    - Good performance on tabular medical data
    - Interpretable feature importances
    """
    print("\n" + "=" * 55)
    print("Training 30-Minute Glucose Forecast Model")
    print("=" * 55)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

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
    model.fit(X_train_s, y_train)

    # Evaluate
    y_pred_train = model.predict(X_train_s)
    y_pred_test = model.predict(X_test_s)

    print(f"\n  Training Set:")
    print(f"    MAE:  {mean_absolute_error(y_train, y_pred_train):.2f} mg/dL")
    print(f"    RMSE: {np.sqrt(mean_squared_error(y_train, y_pred_train)):.2f} mg/dL")
    print(f"    R²:   {r2_score(y_train, y_pred_train):.4f}")

    mae = mean_absolute_error(y_test, y_pred_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    r2 = r2_score(y_test, y_pred_test)
    print(f"\n  Test Set:")
    print(f"    MAE:  {mae:.2f} mg/dL")
    print(f"    RMSE: {rmse:.2f} mg/dL")
    print(f"    R²:   {r2:.4f}")

    within_20 = np.mean(np.abs(y_pred_test - y_test) <= 20) * 100
    within_40 = np.mean(np.abs(y_pred_test - y_test) <= 40) * 100
    print(f"    Within ±20 mg/dL: {within_20:.1f}%")
    print(f"    Within ±40 mg/dL: {within_40:.1f}%")

    # Feature importance
    print(f"\n  Top 10 Feature Importances:")
    importances = model.feature_importances_
    for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1])[:10]:
        print(f"    {name:30s} {imp:.4f}")

    return model, scaler


def train_risk_model(X_train, y_train, X_test, y_test):
    """
    Train the glucose risk classification model (Random Forest Classifier).

    Classes: 0=low (hypoglycemia risk), 1=normal, 2=high (hyperglycemia risk)

    Why Random Forest:
    - Handles class imbalance well with class_weight='balanced'
    - Provides probability estimates for confidence scoring
    - Less prone to overfitting than single decision trees
    """
    print("\n" + "=" * 55)
    print("Training Glucose Risk Classification Model")
    print("=" * 55)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",  # Handle imbalanced risk classes
        random_state=42,
    )
    model.fit(X_train_s, y_train)

    y_pred = model.predict(X_test_s)

    print(f"\n  Test Set:")
    print(f"    Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"    F1 (macro): {f1_score(y_test, y_pred, average='macro'):.4f}")

    risk_labels = ["Low (hypo)", "Normal", "High (hyper)"]
    present_labels = sorted(set(y_test) | set(y_pred))
    present_names = [risk_labels[i] for i in present_labels]
    print(f"\n{classification_report(y_test, y_pred, labels=present_labels, target_names=present_names)}")

    # Cross-validation
    cv_scores = cross_val_score(model, X_train_s, y_train, cv=5, scoring="accuracy")
    print(f"  5-Fold CV Accuracy: {cv_scores.mean():.4f} (±{cv_scores.std():.4f})")

    return model, scaler


def train(data_path: str = SYNTHETIC_DATA_PATH, finetune_path: str = None):
    """
    Main training orchestrator.

    Hybrid training logic:
    1. Load synthetic training data as the base dataset
    2. If finetune_path is provided (real user data with ≥21 readings):
       - Merge with synthetic data (weighted: real data gets 3x weight via oversampling)
       - This lets the model learn from real African user patterns
       - Feature schema must match exactly
    3. Train both forecast and risk models
    4. Save models and scalers
    """
    print("=" * 55)
    print("Bluely ML Training Pipeline")
    print("=" * 55)

    # ── 1. Load base data ──
    if not os.path.exists(data_path):
        print(f"\n  Synthetic data not found at: {data_path}")
        print(f"  Run 'python generate_synthetic_data.py' first.")
        sys.exit(1)

    print(f"\n[1/4] Loading training data from: {data_path}")
    df = load_data(data_path)
    print(f"  Loaded {len(df):,} rows, {len(FEATURE_NAMES)} features")

    # ── 2. Hybrid: merge real user data if available ──
    if finetune_path and os.path.exists(finetune_path):
        print(f"\n[1b] Loading real user data for fine-tuning: {finetune_path}")
        real_df = load_data(finetune_path)
        real_count = len(real_df)
        print(f"  Real data: {real_count:,} rows")

        # Oversample real data 3x to give it more weight during training
        # This helps the model prioritize real patterns over synthetic ones
        real_upsampled = pd.concat([real_df] * 3, ignore_index=True)
        df = pd.concat([df, real_upsampled], ignore_index=True).sample(
            frac=1, random_state=42
        ).reset_index(drop=True)
        print(f"  Combined dataset: {len(df):,} rows (real data 3x weighted)")

    # ── 3. Split features and targets ──
    X = df[FEATURE_NAMES].values
    y_forecast = df["future_glucose_30min"].values
    y_risk = df["risk_level"].values.astype(int)

    X_train, X_test, y_fc_train, y_fc_test, y_rk_train, y_rk_test = train_test_split(
        X, y_forecast, y_risk,
        test_size=0.2,
        random_state=42,
    )

    print(f"\n[2/4] Data split:")
    print(f"  Training: {X_train.shape[0]:,} samples")
    print(f"  Test:     {X_test.shape[0]:,} samples")

    # ── 4. Train models ──
    print(f"\n[3/4] Training models...")
    forecast_model, forecast_scaler = train_forecast_model(
        X_train, y_fc_train, X_test, y_fc_test
    )
    risk_model, risk_scaler = train_risk_model(
        X_train, y_rk_train, X_test, y_rk_test
    )

    # ── 5. Save ──
    print(f"\n[4/4] Saving models...")
    os.makedirs(MODEL_DIR, exist_ok=True)

    paths = {
        "bluely_forecast_model.joblib": forecast_model,
        "bluely_forecast_scaler.joblib": forecast_scaler,
        "bluely_risk_model.joblib": risk_model,
        "bluely_risk_scaler.joblib": risk_scaler,
    }
    for filename, obj in paths.items():
        p = os.path.join(MODEL_DIR, filename)
        joblib.dump(obj, p)
        print(f"  Saved: {p}")

    print(f"\n{'=' * 55}")
    print("Training complete!")
    print(f"{'=' * 55}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bluely ML Training Pipeline")
    parser.add_argument(
        "--finetune",
        type=str,
        default=None,
        help="Path to real user data CSV for fine-tuning (optional). "
             "Must have the same feature columns as synthetic data.",
    )
    args = parser.parse_args()
    train(finetune_path=args.finetune)
