"""
Bluely ML Training Pipeline
============================
Trains a Random Forest and Logistic Regression model on the Pima Indians
Diabetes Dataset to classify diabetes risk.

Usage:
    python train.py

Output:
    models/glucose_model.joblib   — serialized Random Forest model
    models/logistic_model.joblib  — serialized Logistic Regression model (baseline)
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
from sklearn.preprocessing import StandardScaler
import joblib

# ── 1. Load dataset ──────────────────────────────────────────────────────────
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'diabetes.csv')
print(f"Loading dataset from {DATA_PATH} ...")
df = pd.read_csv(DATA_PATH)

print(f"Dataset shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"\nClass distribution:\n{df['Outcome'].value_counts()}\n")

# ── 2. Clean missing values ─────────────────────────────────────────────────
# In the Pima dataset, 0 values in these columns are physiologically impossible
# and represent missing data. Replace with NaN then impute with median.
cols_with_zeros = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
df[cols_with_zeros] = df[cols_with_zeros].replace(0, np.nan)

print("Missing values after cleaning zeros:")
print(df[cols_with_zeros].isnull().sum())

df.fillna(df.median(numeric_only=True), inplace=True)
print("\nMissing values after imputation:")
print(df.isnull().sum().sum(), "total\n")

# ── 3. Features and target ──────────────────────────────────────────────────
X = df.drop('Outcome', axis=1)
y = df['Outcome']

feature_names = list(X.columns)
print(f"Features: {feature_names}")
print(f"Target: Outcome (0 = No Diabetes, 1 = Diabetes)\n")

# ── 4. Feature scaling ──────────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ── 5. Train-test split ─────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Training set: {X_train.shape[0]} samples")
print(f"Test set:     {X_test.shape[0]} samples\n")

# ── 6. Train models ─────────────────────────────────────────────────────────

# --- Baseline: Logistic Regression ---
print("=" * 50)
print("Training Logistic Regression (baseline) ...")
lr_model = LogisticRegression(max_iter=1000, random_state=42)
lr_model.fit(X_train, y_train)
lr_pred = lr_model.predict(X_test)

print("\n=== Logistic Regression Results ===")
print(classification_report(y_test, lr_pred, target_names=['No Diabetes', 'Diabetes']))

lr_cv = cross_val_score(lr_model, X_scaled, y, cv=5, scoring='accuracy')
print(f"5-Fold CV Accuracy: {lr_cv.mean():.4f} (+/- {lr_cv.std():.4f})")

# --- Primary: Random Forest ---
print("\n" + "=" * 50)
print("Training Random Forest (primary) ...")
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)

print("\n=== Random Forest Results ===")
print(classification_report(y_test, rf_pred, target_names=['No Diabetes', 'Diabetes']))

rf_cv = cross_val_score(rf_model, X_scaled, y, cv=5, scoring='accuracy')
print(f"5-Fold CV Accuracy: {rf_cv.mean():.4f} (+/- {rf_cv.std():.4f})")

# --- Confusion Matrices ---
print("\nConfusion Matrix (Random Forest):")
print(confusion_matrix(y_test, rf_pred))

# --- Feature Importance ---
print("\nFeature Importance (Random Forest):")
importances = rf_model.feature_importances_
for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
    print(f"  {name:30s} {imp:.4f}")

# ── 7. Compare models ───────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("Model Comparison Summary:")
print(f"{'Metric':<20} {'Logistic Reg':>15} {'Random Forest':>15}")
print("-" * 50)
print(f"{'Accuracy':<20} {accuracy_score(y_test, lr_pred):>15.4f} {accuracy_score(y_test, rf_pred):>15.4f}")
print(f"{'Precision':<20} {precision_score(y_test, lr_pred):>15.4f} {precision_score(y_test, rf_pred):>15.4f}")
print(f"{'Recall':<20} {recall_score(y_test, lr_pred):>15.4f} {recall_score(y_test, rf_pred):>15.4f}")
print(f"{'F1-Score':<20} {f1_score(y_test, lr_pred):>15.4f} {f1_score(y_test, rf_pred):>15.4f}")
print(f"{'CV Accuracy':<20} {lr_cv.mean():>15.4f} {rf_cv.mean():>15.4f}")

# ── 8. Save models ──────────────────────────────────────────────────────────
os.makedirs(os.path.join(os.path.dirname(__file__), 'models'), exist_ok=True)

model_path = os.path.join(os.path.dirname(__file__), 'models', 'glucose_model.joblib')
scaler_path = os.path.join(os.path.dirname(__file__), 'models', 'scaler.joblib')
lr_path = os.path.join(os.path.dirname(__file__), 'models', 'logistic_model.joblib')

joblib.dump(rf_model, model_path)
joblib.dump(scaler, scaler_path)
joblib.dump(lr_model, lr_path)

print(f"\n Random Forest model saved to: {model_path}")
print(f" Scaler saved to:              {scaler_path}")
print(f" Logistic Regression saved to:  {lr_path}")
print("\nTraining complete!")
