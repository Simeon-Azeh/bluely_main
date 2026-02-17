"""
OhioT1DM XML Parser
=====================
Parses the OhioT1DM dataset XML files into structured pandas DataFrames
for use in temporal glucose prediction models.

Dataset: Marling C, Bunescu R. The OhioT1DM Dataset for Blood Glucose
Level Prediction: Update 2020. CEUR Workshop Proc. 2020;2675:71-74.

Each XML file contains data for one T1D patient with sections:
  glucose_level, finger_stick, basal, temp_basal, bolus, meal,
  sleep, work, stressors, hypo_event, illness, exercise,
  basis_heart_rate, basis_gsr, basis_skin_temperature,
  basis_air_temperature, basis_steps, basis_sleep

Usage:
    from parse_ohio import load_patient, load_all_patients
"""

import os
import xml.etree.ElementTree as ET
from typing import Dict, List, Tuple, Optional
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "ohiot1dm")

PATIENT_IDS = [559, 563, 570, 575, 588, 591]

TS_FORMAT = "%d-%m-%Y %H:%M:%S"


def _parse_events(
    patient_el: ET.Element, section: str, value_attr: str = "value"
) -> pd.DataFrame:
    """Parse a flat <section><event ts=... value=.../></section> block."""
    section_el = patient_el.find(section)
    if section_el is None:
        return pd.DataFrame(columns=["timestamp", value_attr])

    rows = []
    for ev in section_el.findall("event"):
        ts = ev.get("ts")
        val = ev.get(value_attr)
        if ts and val:
            try:
                rows.append(
                    {
                        "timestamp": pd.to_datetime(ts, format=TS_FORMAT),
                        value_attr: float(val),
                    }
                )
            except (ValueError, TypeError):
                continue
    return pd.DataFrame(rows)


def _parse_meal_events(patient_el: ET.Element) -> pd.DataFrame:
    """Parse meal events which have 'type' and 'carbs' attributes."""
    section = patient_el.find("meal")
    if section is None:
        return pd.DataFrame(columns=["timestamp", "meal_type", "carbs"])

    rows = []
    for ev in section.findall("event"):
        ts = ev.get("ts")
        carbs = ev.get("carbs")
        meal_type = ev.get("type", "unknown")
        if ts:
            try:
                rows.append(
                    {
                        "timestamp": pd.to_datetime(ts, format=TS_FORMAT),
                        "meal_type": meal_type,
                        "carbs": float(carbs) if carbs else 0.0,
                    }
                )
            except (ValueError, TypeError):
                continue
    return pd.DataFrame(rows)


def _parse_bolus_events(patient_el: ET.Element) -> pd.DataFrame:
    """Parse bolus events with dose info."""
    section = patient_el.find("bolus")
    if section is None:
        return pd.DataFrame(columns=["timestamp", "dose"])

    rows = []
    for ev in section.findall("event"):
        ts_begin = ev.get("ts_begin") or ev.get("ts")
        dose = ev.get("dose")
        if ts_begin:
            try:
                rows.append(
                    {
                        "timestamp": pd.to_datetime(ts_begin, format=TS_FORMAT),
                        "dose": float(dose) if dose else 0.0,
                    }
                )
            except (ValueError, TypeError):
                continue
    return pd.DataFrame(rows)


def _parse_exercise_events(patient_el: ET.Element) -> pd.DataFrame:
    """Parse exercise events with intensity and duration."""
    section = patient_el.find("exercise")
    if section is None:
        return pd.DataFrame(columns=["timestamp", "intensity", "duration"])

    rows = []
    for ev in section.findall("event"):
        ts = ev.get("ts")
        intensity = ev.get("intensity")
        duration = ev.get("duration")
        if ts:
            try:
                rows.append(
                    {
                        "timestamp": pd.to_datetime(ts, format=TS_FORMAT),
                        "intensity": int(intensity) if intensity else 0,
                        "duration": float(duration) if duration else 0.0,
                    }
                )
            except (ValueError, TypeError):
                continue
    return pd.DataFrame(rows)


def _parse_sleep_events(patient_el: ET.Element) -> pd.DataFrame:
    """Parse sleep events with quality ratings."""
    section = patient_el.find("sleep")
    if section is None:
        return pd.DataFrame(columns=["timestamp", "quality"])

    rows = []
    for ev in section.findall("event"):
        ts = ev.get("ts_end") or ev.get("ts")
        quality = ev.get("quality")
        if ts:
            try:
                rows.append(
                    {
                        "timestamp": pd.to_datetime(ts, format=TS_FORMAT),
                        "quality": int(quality) if quality else 0,
                    }
                )
            except (ValueError, TypeError):
                continue
    return pd.DataFrame(rows)


def load_patient_xml(filepath: str) -> Dict[str, pd.DataFrame]:
    """
    Parse a single OhioT1DM XML file into a dict of DataFrames.

    Returns:
        Dict with keys: 'glucose', 'finger_stick', 'basal', 'bolus',
                         'meal', 'exercise', 'sleep', 'heart_rate',
                         'steps', 'skin_temp'
    """
    tree = ET.parse(filepath)
    root = tree.getroot()

    data = {
        "glucose": _parse_events(root, "glucose_level"),
        "finger_stick": _parse_events(root, "finger_stick"),
        "basal": _parse_events(root, "basal"),
        "bolus": _parse_bolus_events(root),
        "meal": _parse_meal_events(root),
        "exercise": _parse_exercise_events(root),
        "sleep": _parse_sleep_events(root),
        "heart_rate": _parse_events(root, "basis_heart_rate"),
        "steps": _parse_events(root, "basis_steps"),
        "skin_temp": _parse_events(root, "basis_skin_temperature"),
    }

    # Sort all by timestamp
    for key in data:
        if len(data[key]) > 0 and "timestamp" in data[key].columns:
            data[key] = data[key].sort_values("timestamp").reset_index(drop=True)

    return data


def load_patient(
    patient_id: int,
) -> Tuple[Dict[str, pd.DataFrame], Dict[str, pd.DataFrame]]:
    """
    Load training and testing data for a patient.

    Returns:
        (train_data, test_data) — each a dict of DataFrames
    """
    train_path = os.path.join(DATA_DIR, f"{patient_id}-ws-training.xml")
    test_path = os.path.join(DATA_DIR, f"{patient_id}-ws-testing.xml")

    train_data = load_patient_xml(train_path)
    test_data = load_patient_xml(test_path)

    return train_data, test_data


def load_all_patients() -> Dict[int, Tuple[Dict, Dict]]:
    """
    Load all patients.

    Returns:
        Dict[patient_id -> (train_data, test_data)]
    """
    results = {}
    for pid in PATIENT_IDS:
        try:
            results[pid] = load_patient(pid)
            n_glucose = len(results[pid][0]["glucose"])
            print(f"  Patient {pid}: {n_glucose} training glucose readings")
        except FileNotFoundError as e:
            print(f"  Patient {pid}: SKIPPED ({e})")
    return results


def build_temporal_features(
    glucose_df: pd.DataFrame,
    meal_df: pd.DataFrame,
    bolus_df: pd.DataFrame,
    exercise_df: pd.DataFrame,
    sleep_df: pd.DataFrame,
    heart_rate_df: pd.DataFrame,
    steps_df: pd.DataFrame,
    prediction_horizon: int = 6,  # 6 x 5min = 30 minutes ahead
    lookback: int = 12,  # 12 x 5min = 60 minutes history
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Build feature matrix from OhioT1DM data for temporal glucose prediction.

    Features per sample:
        - Last `lookback` glucose values (normalized)
        - Rate of change (slope over lookback window)
        - Glucose std dev over lookback window
        - Hour of day (sin/cos encoded)
        - Day of week
        - Minutes since last meal
        - Carbs in last meal
        - Minutes since last bolus
        - Last bolus dose
        - Recent exercise flag (within 2h)
        - Recent sleep flag (within 30min of sleep event)
        - Average heart rate over lookback (if available)
        - Steps in last hour (if available)

    Target:
        - Glucose value `prediction_horizon` steps ahead

    Returns:
        (X, y) — feature matrix and target vector
    """
    if len(glucose_df) < lookback + prediction_horizon + 1:
        return np.array([]), np.array([])

    glucose_df = glucose_df.copy().sort_values("timestamp").reset_index(drop=True)
    glucose_values = glucose_df["value"].values
    glucose_times = glucose_df["timestamp"].values

    # Pre-convert context timestamps once (avoid repeated pd.to_datetime)
    meal_times_arr = meal_df["timestamp"].values if len(meal_df) > 0 else np.array([])
    meal_carbs_arr = meal_df["carbs"].values if len(meal_df) > 0 and "carbs" in meal_df.columns else np.array([])
    bolus_times_arr = bolus_df["timestamp"].values if len(bolus_df) > 0 else np.array([])
    bolus_dose_arr = bolus_df["dose"].values if len(bolus_df) > 0 and "dose" in bolus_df.columns else np.array([])
    ex_times_arr = exercise_df["timestamp"].values if len(exercise_df) > 0 else np.array([])
    sl_times_arr = sleep_df["timestamp"].values if len(sleep_df) > 0 else np.array([])
    hr_times_arr = heart_rate_df["timestamp"].values if len(heart_rate_df) > 0 else np.array([])
    hr_values_arr = heart_rate_df["value"].values if len(heart_rate_df) > 0 else np.array([])
    st_times_arr = steps_df["timestamp"].values if len(steps_df) > 0 else np.array([])
    st_values_arr = steps_df["value"].values if len(steps_df) > 0 else np.array([])

    features_list = []
    targets = []

    for i in range(lookback, len(glucose_df) - prediction_horizon):
        window = glucose_values[i - lookback : i]
        target = glucose_values[i + prediction_horizon]
        current_time = pd.Timestamp(glucose_times[i])
        current_time_np = glucose_times[i]

        # --- Glucose features ---
        window_norm = (window - window.mean()) / (window.std() + 1e-6)
        slope = np.polyfit(np.arange(lookback), window, 1)[0]
        std = window.std()
        current_glucose = window[-1]

        # --- Time features ---
        hour = current_time.hour
        hour_sin = np.sin(2 * np.pi * hour / 24)
        hour_cos = np.cos(2 * np.pi * hour / 24)
        dow = current_time.dayofweek

        # --- Meal features ---
        mins_since_meal = 999.0
        last_meal_carbs = 0.0
        if len(meal_times_arr) > 0:
            mask = meal_times_arr < current_time_np
            if mask.any():
                idx = np.where(mask)[0][-1]
                delta = (current_time_np - meal_times_arr[idx]) / np.timedelta64(1, "m")
                mins_since_meal = float(delta)
                if len(meal_carbs_arr) > idx:
                    last_meal_carbs = float(meal_carbs_arr[idx])

        # --- Bolus features ---
        mins_since_bolus = 999.0
        last_bolus_dose = 0.0
        if len(bolus_times_arr) > 0:
            mask = bolus_times_arr < current_time_np
            if mask.any():
                idx = np.where(mask)[0][-1]
                delta = (current_time_np - bolus_times_arr[idx]) / np.timedelta64(1, "m")
                mins_since_bolus = float(delta)
                if len(bolus_dose_arr) > idx:
                    last_bolus_dose = float(bolus_dose_arr[idx])

        # --- Exercise features ---
        recent_exercise = 0.0
        if len(ex_times_arr) > 0:
            two_hrs = np.timedelta64(2, "h")
            mask = (ex_times_arr >= (current_time_np - two_hrs)) & (ex_times_arr < current_time_np)
            recent_exercise = 1.0 if mask.any() else 0.0

        # --- Sleep features ---
        recent_sleep = 0.0
        if len(sl_times_arr) > 0:
            thirty_min = np.timedelta64(30, "m")
            mask = (sl_times_arr >= (current_time_np - thirty_min)) & (sl_times_arr <= current_time_np)
            recent_sleep = 1.0 if mask.any() else 0.0

        # --- Heart rate features ---
        avg_hr = 0.0
        if len(hr_times_arr) > 0:
            lookback_td = np.timedelta64(lookback * 5, "m")
            mask = (hr_times_arr >= (current_time_np - lookback_td)) & (hr_times_arr < current_time_np)
            if mask.any():
                avg_hr = float(hr_values_arr[mask].mean())

        # --- Steps features ---
        recent_steps = 0.0
        if len(st_times_arr) > 0:
            one_hr = np.timedelta64(1, "h")
            mask = (st_times_arr >= (current_time_np - one_hr)) & (st_times_arr < current_time_np)
            if mask.any():
                recent_steps = float(st_values_arr[mask].sum())

        # --- Build feature vector ---
        feature = np.concatenate(
            [
                window_norm,  # lookback normalized glucose values
                [
                    current_glucose,
                    slope,
                    std,
                    hour_sin,
                    hour_cos,
                    dow,
                    mins_since_meal,
                    last_meal_carbs,
                    mins_since_bolus,
                    last_bolus_dose,
                    recent_exercise,
                    recent_sleep,
                    avg_hr,
                    recent_steps,
                ],
            ]
        )
        features_list.append(feature)
        targets.append(target)

    return np.array(features_list), np.array(targets)


if __name__ == "__main__":
    print("=" * 60)
    print("OhioT1DM Dataset Parser — Quick Test")
    print("=" * 60)

    print("\nLoading all patients ...")
    all_data = load_all_patients()

    # Test feature extraction on first patient
    pid = PATIENT_IDS[0]
    train_data, test_data = all_data[pid]
    print(f"\nPatient {pid} training data sections:")
    for key, df in train_data.items():
        print(f"  {key:15s}: {len(df)} records")

    print("\nBuilding temporal features ...")
    X, y = build_temporal_features(
        glucose_df=train_data["glucose"],
        meal_df=train_data["meal"],
        bolus_df=train_data["bolus"],
        exercise_df=train_data["exercise"],
        sleep_df=train_data["sleep"],
        heart_rate_df=train_data["heart_rate"],
        steps_df=train_data["steps"],
    )
    print(f"Feature matrix: {X.shape}")
    print(f"Target vector:  {y.shape}")
    print(f"Feature dim:    {X.shape[1]} per sample")
    print(f"\nSample target (first 5): {y[:5]}")
