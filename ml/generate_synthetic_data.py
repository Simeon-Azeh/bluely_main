"""
Bluely Synthetic Data Generator
================================
Generates physiologically realistic synthetic diabetes data for model training,
eliminating the need for foreign datasets (Pima Indians, OhioT1DM).

Physiological Assumptions:
--------------------------
1. CIRCADIAN RHYTHM: Glucose follows a 24-hour cycle with a "dawn phenomenon"
   (natural rise between 4-8 AM due to cortisol/growth hormone release).
2. MEAL ABSORPTION: Carbohydrates raise blood glucose. The rise starts within
   ~15 min, peaks at 45-90 min, and decays over 3-4 hours. Higher glycemic
   index foods cause faster, sharper spikes.
3. INSULIN ACTION: Rapid-acting insulin (e.g., NovoRapid) onset ~15 min,
   peak ~1 hr, duration ~4 hrs. Long-acting (e.g., Lantus) provides steady
   basal coverage over ~24 hrs. Each unit lowers glucose by a patient-specific
   "insulin sensitivity factor" (ISF), typically 20-60 mg/dL per unit.
4. EXERCISE EFFECT: Moderate activity lowers glucose during and for 2-4 hours
   after. Intense exercise may cause a temporary spike (stress hormones),
   then a prolonged drop.
5. STRESS & MOOD: Psychological stress raises glucose via cortisol. Poor mood
   correlates with elevated stress hormones.
6. SLEEP QUALITY: Poor sleep increases insulin resistance the following day.
7. NATURAL VARIABILITY: Even with identical inputs, glucose fluctuates due to
   hormonal cycles, hydration, ambient temperature, etc.

Output:
    data/synthetic_training_data.csv — ≥50,000 rows of labeled training data.

Usage:
    python generate_synthetic_data.py
"""

import os
import csv
import math
import random
import numpy as np
from typing import List, Dict, Tuple

# ── Constants ────────────────────────────────────────────────────────────────

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "synthetic_training_data.csv")

# Feature column order — MUST match train_bluely.py and predict_bluely.py
FEATURE_NAMES = [
    "current_glucose",          # Current glucose reading (mg/dL)
    "carbs_last_meal",          # Grams of carbs in the most recent meal
    "minutes_since_meal",       # Minutes elapsed since last meal
    "meal_type",                # Encoded: 0=none, 1=breakfast, 2=lunch, 3=dinner, 4=snack
    "insulin_dose",             # Most recent insulin dose (units)
    "minutes_since_insulin",    # Minutes elapsed since last insulin dose
    "medication_type",          # Encoded: 0=none, 1=rapid, 2=long, 3=mixed, 4=metformin, 5=other
    "activity_intensity",       # Encoded: 0=none, 1=low, 2=medium, 3=high
    "activity_duration",        # Duration of last activity (minutes)
    "minutes_since_activity",   # Minutes elapsed since last activity
    "hour_sin",                 # sin(2π × hour/24) — circadian encoding
    "hour_cos",                 # cos(2π × hour/24) — circadian encoding
    "sleep_quality",            # 1–5 scale (1=poor, 5=excellent)
    "stress_level",             # 1–5 scale (1=calm, 5=very stressed)
    "mood_score",               # 1–5 (1=Rough, 2=Low, 3=Okay, 4=Good, 5=Great)
    "glucose_lag_1",            # Previous glucose reading (mg/dL)
    "glucose_lag_2",            # Reading before that
    "glucose_lag_3",            # Reading before that
    "glucose_trend",            # Linear slope over last 6 readings (mg/dL per step)
    "glucose_std",              # Standard deviation of last 6 readings
    "diabetes_type",            # Encoded: 0=type1, 1=type2, 2=prediabetes, 3=gestational, 4=other
]

TARGET_NAMES = [
    "future_glucose_30min",     # Glucose value 30 minutes from now (regression target)
    "risk_level",               # 0=low, 1=normal, 2=high (classification target)
]

# Diabetes type parameters:
# base_fasting: typical fasting glucose range, insulin_sensitivity: mg/dL drop per 1U insulin
# carb_ratio: mg/dL rise per 1g carbs, variability: noise amplitude
DIABETES_PROFILES = {
    "type1": {
        "fasting_range": (100, 170),    # Type 1: higher fasting due to no endogenous insulin
        "isf_range": (30, 60),           # Insulin sensitivity factor
        "carb_ratio_range": (1.0, 2.5),  # mg/dL rise per gram carb (after scaling)
        "variability": 10.0,             # Natural glucose noise
        "dawn_amplitude": (10, 25),      # Dawn phenomenon magnitude
    },
    "type2": {
        "fasting_range": (95, 150),     # Type 2: insulin resistant but some production
        "isf_range": (15, 40),
        "carb_ratio_range": (0.8, 2.0),
        "variability": 8.0,
        "dawn_amplitude": (8, 20),
    },
    "prediabetes": {
        "fasting_range": (85, 120),     # Prediabetes: borderline values
        "isf_range": (25, 50),
        "carb_ratio_range": (0.6, 1.5),
        "variability": 6.0,
        "dawn_amplitude": (5, 12),
    },
    "gestational": {
        "fasting_range": (80, 120),     # Gestational: varies, often meal-reactive
        "isf_range": (20, 45),
        "carb_ratio_range": (0.8, 2.0),
        "variability": 7.0,
        "dawn_amplitude": (5, 15),
    },
    "other": {
        "fasting_range": (85, 140),
        "isf_range": (20, 50),
        "carb_ratio_range": (0.7, 2.0),
        "variability": 8.0,
        "dawn_amplitude": (5, 15),
    },
}

DIABETES_TYPE_ENCODING = {
    "type1": 0, "type2": 1, "prediabetes": 2, "gestational": 3, "other": 4,
}

MEAL_TYPE_ENCODING = {
    "none": 0, "breakfast": 1, "lunch": 2, "dinner": 3, "snack": 4,
}

MEDICATION_TYPE_ENCODING = {
    "none": 0, "insulin_rapid": 1, "insulin_long": 2,
    "insulin_mixed": 3, "metformin": 4, "other": 5,
}

ACTIVITY_INTENSITY_ENCODING = {
    "none": 0, "low": 1, "medium": 2, "high": 3,
}

# Simulation resolution: 5-minute intervals
STEP_MINUTES = 5
STEPS_PER_HOUR = 60 // STEP_MINUTES
STEPS_PER_DAY = 24 * STEPS_PER_HOUR  # 288 steps per day
PREDICTION_HORIZON = 6  # 6 steps × 5 min = 30 minutes ahead

# ── Physiological Effect Functions ───────────────────────────────────────────


def meal_absorption_curve(minutes_elapsed: float, carbs: float, carb_ratio: float) -> float:
    """
    Model glucose rise from a meal using a gamma-like absorption curve.

    Physiology: Carbohydrates are broken down into glucose in the gut. Absorption
    begins ~15 min after eating, peaks at ~60 min (varies with glycemic index),
    and tapers off over 3-4 hours.

    The curve shape: f(t) = A × t × exp(-t / tau)  (gamma distribution shape)
    where A scales with carbs × carb_ratio, tau controls peak timing.

    Args:
        minutes_elapsed: Minutes since meal was eaten.
        carbs: Grams of carbohydrates in the meal.
        carb_ratio: Patient-specific mg/dL rise per gram of carbs.

    Returns:
        Glucose rise contribution at this time point (mg/dL).
    """
    if minutes_elapsed < 0 or minutes_elapsed > 300:  # No effect after 5 hours
        return 0.0

    # Peak timing ~60 minutes (tau parameter)
    tau = 55.0
    peak_factor = carbs * carb_ratio
    # Normalize so integral matches total expected rise
    t = minutes_elapsed
    effect = peak_factor * (t / tau) * math.exp(1 - t / tau)
    # Scale down so the instantaneous effect at peak = ~40-60% of total rise
    return max(0.0, effect * 0.45)


def insulin_action_curve(minutes_elapsed: float, dose: float, isf: float,
                          insulin_type: str) -> float:
    """
    Model glucose-lowering effect of insulin injection.

    Physiology:
    - Rapid-acting (NovoRapid, Humalog): onset ~15 min, peak ~60 min, duration ~4 hrs
    - Long-acting (Lantus, Levemir): onset ~2 hrs, nearly flat profile, duration ~24 hrs
    - Mixed (70/30): combination of intermediate + rapid profiles

    Args:
        minutes_elapsed: Minutes since injection.
        dose: Insulin dose in units.
        isf: Insulin sensitivity factor (mg/dL drop per 1 unit).
        insulin_type: 'insulin_rapid', 'insulin_long', or 'insulin_mixed'.

    Returns:
        Glucose-lowering effect at this time point (mg/dL, positive = lowering).
    """
    if minutes_elapsed < 0:
        return 0.0

    t = minutes_elapsed

    if insulin_type == "insulin_rapid":
        if t > 300:  # No effect after 5 hours
            return 0.0
        tau = 50.0
        effect = dose * isf * (t / tau) * math.exp(1 - t / tau) * 0.35
    elif insulin_type == "insulin_long":
        if t > 1440:  # 24 hours
            return 0.0
        # Nearly flat profile with slow onset
        onset_factor = min(1.0, t / 120.0)  # Ramps up over 2 hours
        effect = dose * isf * 0.015 * onset_factor  # Small steady effect
    elif insulin_type == "insulin_mixed":
        # Combination: rapid component + intermediate component
        rapid_part = 0.0
        if t <= 300:
            tau_r = 55.0
            rapid_part = dose * 0.3 * isf * (t / tau_r) * math.exp(1 - t / tau_r) * 0.3
        intermediate_part = 0.0
        if t <= 720:  # 12 hours
            tau_i = 180.0
            onset = min(1.0, t / 60.0)
            intermediate_part = dose * 0.7 * isf * 0.04 * onset * math.exp(-t / (tau_i * 3))
        effect = rapid_part + intermediate_part
    else:
        return 0.0

    return max(0.0, effect)


def metformin_effect(minutes_elapsed: float) -> float:
    """
    Model glucose-lowering effect of metformin (oral medication).

    Physiology: Metformin reduces hepatic glucose output and improves insulin
    sensitivity. Onset ~1 hour, peak ~2-3 hours, duration ~6-8 hours.
    Effect is modest compared to insulin (~10-30 mg/dL reduction over the day).
    """
    if minutes_elapsed < 0 or minutes_elapsed > 480:  # 8 hours
        return 0.0
    t = minutes_elapsed
    tau = 150.0
    onset = min(1.0, t / 60.0)
    effect = 5.0 * onset * math.exp(-max(0, t - 150) / 200.0)
    return max(0.0, effect)


def exercise_effect(minutes_elapsed: float, intensity: str, duration: float) -> float:
    """
    Model glucose-lowering effect of physical exercise.

    Physiology:
    - Exercise increases glucose uptake by muscles (GLUT4 translocation).
    - Effect begins during exercise and persists 2-4 hours after.
    - Low intensity: gentle, steady reduction (~10-20 mg/dL).
    - Medium intensity: moderate reduction (~20-35 mg/dL).
    - High intensity: may cause brief spike (adrenaline), then prolonged drop.
    """
    if minutes_elapsed < 0 or minutes_elapsed > 360:  # 6 hours post-exercise
        return 0.0

    intensity_factor = {"low": 0.4, "medium": 0.7, "high": 1.0}.get(intensity, 0.5)
    duration_factor = min(duration / 30.0, 2.0)  # Longer exercise = more effect, capped

    t = minutes_elapsed
    # During exercise: rising effect
    if t <= duration:
        ramp = t / max(duration, 1.0)
        base_effect = 15.0 * intensity_factor * duration_factor * ramp
        # High intensity: brief counter-regulatory spike
        if intensity == "high" and t < 15:
            return -5.0  # Temporarily raises glucose
        return base_effect
    else:
        # Post-exercise: decaying effect
        post_t = t - duration
        decay_tau = 120.0  # 2-hour decay
        base_effect = 15.0 * intensity_factor * duration_factor
        return base_effect * math.exp(-post_t / decay_tau)


def circadian_effect(hour: float, dawn_amplitude: float) -> float:
    """
    Model circadian rhythm effect on glucose.

    Physiology: The "dawn phenomenon" causes glucose to rise between 4-8 AM
    due to increased cortisol, growth hormone, and glucagon secretion.
    Evening/night: glucose tends to be lower and more stable.

    Args:
        hour: Hour of day (0-24, float).
        dawn_amplitude: Patient-specific magnitude of dawn effect (mg/dL).

    Returns:
        Glucose adjustment (mg/dL, can be positive or negative).
    """
    # Dawn phenomenon: peaks around 6-7 AM
    dawn = dawn_amplitude * math.exp(-0.5 * ((hour - 6.5) / 1.5) ** 2)

    # Evening dip: slight lowering effect 9PM-midnight
    evening = -5.0 * math.exp(-0.5 * ((hour - 22) / 2.0) ** 2)

    return dawn + evening


def stress_glucose_effect(stress_level: int) -> float:
    """
    Model stress-induced glucose elevation.

    Physiology: Psychological stress triggers cortisol and adrenaline release,
    which promotes hepatic gluconeogenesis (liver dumps glucose into blood).
    Effect: 0-25 mg/dL elevation depending on stress severity.
    """
    # stress_level: 1 (calm) to 5 (very stressed)
    return max(0.0, (stress_level - 2) * 6.0)  # 0, 0, 6, 12, 18 mg/dL


# ── Patient Simulation ───────────────────────────────────────────────────────


def generate_daily_events(diabetes_type: str, day_index: int) -> Dict:
    """
    Generate a realistic daily schedule of meals, medications, exercise, and mood
    for one synthetic patient-day.

    Returns dict with keys: meals, medications, exercises, sleep_quality,
    stress_level, mood_score.
    """
    events = {
        "meals": [],
        "medications": [],
        "exercises": [],
        "sleep_quality": random.randint(1, 5),
        "stress_level": random.randint(1, 5),
        "mood_score": random.randint(1, 5),
    }

    # ── Meals ──
    # Breakfast: 6:30-9:00 AM, carbs 20-80g
    bk_hour = random.uniform(6.5, 9.0)
    bk_carbs = random.uniform(20, 80)
    events["meals"].append({"hour": bk_hour, "carbs": bk_carbs, "type": "breakfast"})

    # Lunch: 11:30 AM - 2:00 PM, carbs 30-100g
    ln_hour = random.uniform(11.5, 14.0)
    ln_carbs = random.uniform(30, 100)
    events["meals"].append({"hour": ln_hour, "carbs": ln_carbs, "type": "lunch"})

    # Dinner: 6:00 - 9:00 PM, carbs 40-120g
    dn_hour = random.uniform(18.0, 21.0)
    dn_carbs = random.uniform(40, 120)
    events["meals"].append({"hour": dn_hour, "carbs": dn_carbs, "type": "dinner"})

    # Snack: 50% chance, random time
    if random.random() < 0.5:
        snack_hour = random.choice([
            random.uniform(10.0, 11.0),   # Mid-morning
            random.uniform(15.0, 16.5),   # Afternoon
            random.uniform(21.0, 22.5),   # Evening
        ])
        snack_carbs = random.uniform(5, 40)
        events["meals"].append({"hour": snack_hour, "carbs": snack_carbs, "type": "snack"})

    # ── Medications ──
    if diabetes_type == "type1":
        # Type 1: rapid insulin before each meal + long-acting once daily
        for meal in events["meals"]:
            if meal["type"] in ("breakfast", "lunch", "dinner"):
                dose = random.uniform(2, 12)
                # Inject 0-15 min before meal
                events["medications"].append({
                    "hour": meal["hour"] - random.uniform(0, 0.25),
                    "dose": round(dose, 1),
                    "type": "insulin_rapid",
                })
        # Long-acting: once a day, usually evening
        events["medications"].append({
            "hour": random.uniform(21.0, 23.0),
            "dose": round(random.uniform(10, 30), 1),
            "type": "insulin_long",
        })
    elif diabetes_type == "type2":
        # Type 2: varies — may be on metformin, insulin, or both
        regimen = random.choice(["metformin_only", "metformin_insulin", "insulin_only"])
        if regimen in ("metformin_only", "metformin_insulin"):
            # Metformin twice daily with meals
            events["medications"].append({
                "hour": events["meals"][0]["hour"],
                "dose": random.choice([500, 850, 1000]),
                "type": "metformin",
            })
            events["medications"].append({
                "hour": events["meals"][2]["hour"],
                "dose": random.choice([500, 850, 1000]),
                "type": "metformin",
            })
        if regimen in ("metformin_insulin", "insulin_only"):
            # Basal insulin once daily
            events["medications"].append({
                "hour": random.uniform(21.0, 23.0),
                "dose": round(random.uniform(10, 40), 1),
                "type": "insulin_long",
            })
            # Sometimes mealtime insulin too
            if random.random() < 0.4:
                for meal in events["meals"]:
                    if meal["type"] in ("breakfast", "dinner"):
                        events["medications"].append({
                            "hour": meal["hour"] - random.uniform(0, 0.15),
                            "dose": round(random.uniform(2, 8), 1),
                            "type": "insulin_rapid",
                        })
    elif diabetes_type == "gestational":
        # Gestational: diet-controlled or insulin
        if random.random() < 0.5:
            events["medications"].append({
                "hour": random.uniform(21.0, 22.5),
                "dose": round(random.uniform(8, 20), 1),
                "type": "insulin_long",
            })
    elif diabetes_type == "prediabetes":
        # Prediabetes: often no medication, sometimes metformin
        if random.random() < 0.3:
            events["medications"].append({
                "hour": events["meals"][0]["hour"],
                "dose": 500,
                "type": "metformin",
            })

    # ── Exercise ──
    # 40% chance of exercise on any given day
    if random.random() < 0.4:
        ex_hour = random.choice([
            random.uniform(6.0, 8.0),    # Morning
            random.uniform(16.0, 18.0),  # Afternoon
            random.uniform(19.0, 20.5),  # Evening
        ])
        ex_intensity = random.choice(["low", "medium", "high"])
        ex_duration = {
            "low": random.uniform(15, 45),
            "medium": random.uniform(20, 60),
            "high": random.uniform(15, 45),
        }[ex_intensity]
        events["exercises"].append({
            "hour": ex_hour,
            "intensity": ex_intensity,
            "duration": round(ex_duration),
        })

    # ── Mood correlates loosely with stress ──
    # High stress → likely lower mood
    if events["stress_level"] >= 4:
        events["mood_score"] = min(events["mood_score"], random.randint(1, 3))
    elif events["stress_level"] <= 2:
        events["mood_score"] = max(events["mood_score"], random.randint(3, 5))

    return events


def simulate_patient(
    patient_id: int,
    diabetes_type: str,
    num_days: int = 10,
) -> List[Dict]:
    """
    Simulate continuous glucose trace for one patient over multiple days,
    then extract feature rows at realistic reading intervals.

    The glucose simulation uses a differential-equation-like approach:
    At each 5-minute step, glucose is updated by summing contributions from:
    - Homeostatic pull toward fasting baseline
    - Meal absorption (carbs → glucose rise)
    - Insulin/medication action (glucose lowering)
    - Exercise effect (glucose lowering, sometimes brief spike)
    - Circadian rhythm (dawn phenomenon)
    - Stress effect
    - Sleep quality effect (modulates next-day insulin resistance)
    - Random physiological noise

    Returns:
        List of dicts, each representing one feature row with targets.
    """
    profile = DIABETES_PROFILES[diabetes_type]
    base_fasting = random.uniform(*profile["fasting_range"])
    isf = random.uniform(*profile["isf_range"])
    carb_ratio = random.uniform(*profile["carb_ratio_range"])
    variability = profile["variability"]
    dawn_amp = random.uniform(*profile["dawn_amplitude"])

    # Sleep quality modifier: poor sleep → ~5-10% higher glucose next day
    sleep_resistance_factor = 1.0

    # Glucose trace (5-min resolution)
    glucose_trace = []
    current_glucose = base_fasting + random.gauss(0, 10)

    # All events across all days (flattened with absolute step index)
    all_meals = []
    all_meds = []
    all_exercises = []
    day_metadata = []  # (sleep_quality, stress_level, mood_score) per day

    for day in range(num_days):
        events = generate_daily_events(diabetes_type, day)
        day_metadata.append({
            "sleep_quality": events["sleep_quality"],
            "stress_level": events["stress_level"],
            "mood_score": events["mood_score"],
        })
        base_step = day * STEPS_PER_DAY
        for m in events["meals"]:
            all_meals.append({
                "step": base_step + int(m["hour"] * STEPS_PER_HOUR),
                "carbs": m["carbs"],
                "type": m["type"],
            })
        for med in events["medications"]:
            all_meds.append({
                "step": base_step + int(med["hour"] * STEPS_PER_HOUR),
                "dose": med["dose"],
                "type": med["type"],
            })
        for ex in events["exercises"]:
            all_exercises.append({
                "step": base_step + int(ex["hour"] * STEPS_PER_HOUR),
                "intensity": ex["intensity"],
                "duration": ex["duration"],
            })

    total_steps = num_days * STEPS_PER_DAY

    # ── Run simulation ──
    for step in range(total_steps):
        day_index = step // STEPS_PER_DAY
        hour = (step % STEPS_PER_DAY) * STEP_MINUTES / 60.0

        meta = day_metadata[min(day_index, len(day_metadata) - 1)]

        # 1. Homeostasis: glucose pulled toward fasting baseline
        #    (the body tries to regulate glucose; stronger pull when far from baseline)
        #    Higher rate = faster return to baseline (mimics liver/kidneys/endogenous insulin)
        homeostasis_rate = 0.015 * sleep_resistance_factor
        homeostasis = -homeostasis_rate * (current_glucose - base_fasting)

        # 2. Meal absorption contributions
        meal_effect = 0.0
        for meal in all_meals:
            minutes_since = (step - meal["step"]) * STEP_MINUTES
            meal_effect += meal_absorption_curve(minutes_since, meal["carbs"], carb_ratio)

        # 3. Insulin/medication action
        med_effect = 0.0
        for med in all_meds:
            minutes_since = (step - med["step"]) * STEP_MINUTES
            if med["type"] == "metformin":
                med_effect += metformin_effect(minutes_since)
            else:
                med_effect += insulin_action_curve(minutes_since, med["dose"], isf, med["type"])

        # 4. Exercise effect
        ex_effect = 0.0
        for ex in all_exercises:
            minutes_since = (step - ex["step"]) * STEP_MINUTES
            ex_effect += exercise_effect(minutes_since, ex["intensity"], ex["duration"])

        # 5. Circadian rhythm
        circadian = circadian_effect(hour, dawn_amp)

        # 6. Stress
        stress_eff = stress_glucose_effect(meta["stress_level"])

        # 7. Sleep quality from previous night modulates insulin resistance
        if hour < 1.0 and day_index > 0:
            prev_sleep = day_metadata[day_index - 1]["sleep_quality"]
            # Poor sleep (1-2) increases resistance; good sleep (4-5) normalizes
            sleep_resistance_factor = 1.0 + (3 - prev_sleep) * 0.03

        # 8. Random physiological noise
        noise = random.gauss(0, variability * 0.15)

        # ── Update glucose ──
        delta = (
            homeostasis
            + meal_effect * 0.08       # Meal absorption contribution per 5-min step
            - med_effect * 0.18        # Medication glucose-lowering per step
            - ex_effect * 0.10         # Exercise effect per step
            + circadian * 0.02         # Gradual circadian shift
            + stress_eff * 0.01        # Gradual stress effect
            + noise
        )

        current_glucose += delta

        # Clamp to physiologically possible range
        current_glucose = max(40.0, min(400.0, current_glucose))

        glucose_trace.append(current_glucose)

    # ── Extract feature rows at reading intervals ──
    # Simulate readings every 15-30 minutes (not every 5 min — realistic user behavior)
    rows = []
    reading_interval_steps = random.choice([3, 4, 5, 6])  # 15, 20, 25, or 30 min intervals

    # Need at least 3 lag values + prediction horizon
    start_step = max(reading_interval_steps * 3, 6)

    for step in range(start_step, total_steps - PREDICTION_HORIZON, reading_interval_steps):
        day_index = step // STEPS_PER_DAY
        hour = (step % STEPS_PER_DAY) * STEP_MINUTES / 60.0
        meta = day_metadata[min(day_index, len(day_metadata) - 1)]

        current = glucose_trace[step]
        future = glucose_trace[step + PREDICTION_HORIZON]

        # Lag values
        lag1 = glucose_trace[step - reading_interval_steps]
        lag2 = glucose_trace[step - reading_interval_steps * 2]
        lag3 = glucose_trace[step - reading_interval_steps * 3]

        # Trend: linear slope over last 6 values (or available)
        lookback_values = []
        for lb in range(6):
            lb_step = step - lb * reading_interval_steps
            if lb_step >= 0:
                lookback_values.append(glucose_trace[lb_step])
        if len(lookback_values) >= 2:
            x = np.arange(len(lookback_values), dtype=float)
            slope = np.polyfit(x, lookback_values[::-1], 1)[0]
            std = float(np.std(lookback_values))
        else:
            slope = 0.0
            std = 0.0

        # Find most recent meal
        recent_meal = _find_most_recent(all_meals, step, STEP_MINUTES)
        carbs_last = recent_meal["carbs"] if recent_meal else 0.0
        mins_since_meal = recent_meal["minutes"] if recent_meal else 999.0
        meal_type_enc = MEAL_TYPE_ENCODING.get(
            recent_meal["type"] if recent_meal else "none", 0
        )

        # Find most recent medication
        recent_med = _find_most_recent(all_meds, step, STEP_MINUTES)
        insulin_dose = recent_med["dose"] if recent_med else 0.0
        mins_since_insulin = recent_med["minutes"] if recent_med else 999.0
        med_type_enc = MEDICATION_TYPE_ENCODING.get(
            recent_med["type"] if recent_med else "none", 0
        )

        # Find most recent exercise
        recent_ex = _find_most_recent(all_exercises, step, STEP_MINUTES)
        act_intensity_enc = ACTIVITY_INTENSITY_ENCODING.get(
            recent_ex["intensity"] if recent_ex else "none", 0
        )
        act_duration = recent_ex["duration"] if recent_ex else 0.0
        mins_since_activity = recent_ex["minutes"] if recent_ex else 999.0

        # Time encoding
        hour_sin = math.sin(2 * math.pi * hour / 24.0)
        hour_cos = math.cos(2 * math.pi * hour / 24.0)

        # Risk level based on current + future glucose
        risk = _compute_risk_level(current, future)

        row = {
            "current_glucose": round(current, 1),
            "carbs_last_meal": round(carbs_last, 1),
            "minutes_since_meal": round(min(mins_since_meal, 999.0), 1),
            "meal_type": meal_type_enc,
            "insulin_dose": round(insulin_dose, 1),
            "minutes_since_insulin": round(min(mins_since_insulin, 999.0), 1),
            "medication_type": med_type_enc,
            "activity_intensity": act_intensity_enc,
            "activity_duration": round(act_duration, 1),
            "minutes_since_activity": round(min(mins_since_activity, 999.0), 1),
            "hour_sin": round(hour_sin, 6),
            "hour_cos": round(hour_cos, 6),
            "sleep_quality": meta["sleep_quality"],
            "stress_level": meta["stress_level"],
            "mood_score": meta["mood_score"],
            "glucose_lag_1": round(lag1, 1),
            "glucose_lag_2": round(lag2, 1),
            "glucose_lag_3": round(lag3, 1),
            "glucose_trend": round(slope, 4),
            "glucose_std": round(std, 4),
            "diabetes_type": DIABETES_TYPE_ENCODING[diabetes_type],
            # Targets
            "future_glucose_30min": round(future, 1),
            "risk_level": risk,
        }
        rows.append(row)

    return rows


def _find_most_recent(events: List[Dict], current_step: int, step_minutes: int) -> Dict:
    """Find the most recent event before the current step."""
    best = None
    best_minutes = float("inf")
    for ev in events:
        if ev["step"] <= current_step:
            minutes_ago = (current_step - ev["step"]) * step_minutes
            # Only consider events within the last 8 hours (480 min)
            if minutes_ago < 480 and minutes_ago < best_minutes:
                best_minutes = minutes_ago
                best = {**ev, "minutes": minutes_ago}
    return best


def _compute_risk_level(current: float, future: float) -> int:
    """
    Compute glucose risk level based on current and predicted values.

    Risk thresholds (clinically relevant for diabetic patients):
    - Low risk (0): Hypoglycemia danger — glucose dropping toward/below 70 mg/dL.
      This is the most dangerous short-term risk.
    - Normal (1): Glucose in the broad management range (70–250 mg/dL).
      Most daily readings for managed diabetics fall here.
    - High risk (2): Severe hyperglycemia — glucose sustained above 250 mg/dL.
      Indicates immediate need for intervention.

    Note: We use 250 (not 180) as the "high" threshold because 180 is the
    *target* ceiling, not a danger threshold. A reading of 200 after a meal
    is common and expected — classifying it as "high risk" would flood users
    with false alarms. We reserve "high" for clinically concerning levels.

    Returns: 0=low (hypo risk), 1=normal, 2=high (hyper risk)
    """
    if current < 75 or future < 70:
        return 0  # Hypoglycemia risk — most dangerous short-term
    elif future > 250 or (current > 230 and future > 230):
        return 2  # Severe hyperglycemia — needs attention
    else:
        return 1  # Managed range (includes typical post-meal rises)


# ── Main Generation ──────────────────────────────────────────────────────────


def generate_dataset(
    num_patients: int = 200,
    days_per_patient: int = 10,
    output_path: str = OUTPUT_PATH,
) -> str:
    """
    Generate the full synthetic training dataset.

    Args:
        num_patients: Number of synthetic patients to simulate.
        days_per_patient: Days of data per patient.
        output_path: Where to save the CSV.

    Returns:
        Path to the generated CSV file.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Weight distribution reflecting African diabetes demographics:
    # Type 2 is most prevalent (~60%), followed by Type 1 (~15%),
    # prediabetes (~15%), gestational (~7%), other (~3%)
    type_weights = {
        "type2": 0.60,
        "type1": 0.15,
        "prediabetes": 0.15,
        "gestational": 0.07,
        "other": 0.03,
    }
    types = list(type_weights.keys())
    weights = list(type_weights.values())

    all_rows = []
    for pid in range(num_patients):
        dtype = random.choices(types, weights=weights, k=1)[0]
        patient_rows = simulate_patient(pid, dtype, num_days=days_per_patient)
        all_rows.extend(patient_rows)

        if (pid + 1) % 20 == 0:
            print(f"  Simulated patient {pid + 1}/{num_patients} "
                  f"({dtype}) — {len(all_rows):,} total rows so far")

    # Shuffle rows to prevent patient-order leakage
    random.shuffle(all_rows)

    # Write CSV
    columns = FEATURE_NAMES + TARGET_NAMES
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"\n  Dataset saved to: {output_path}")
    print(f"  Total rows: {len(all_rows):,}")
    print(f"  Features: {len(FEATURE_NAMES)}")
    print(f"  Targets: {TARGET_NAMES}")

    # Distribution summary
    risk_counts = {0: 0, 1: 0, 2: 0}
    for row in all_rows:
        risk_counts[row["risk_level"]] += 1
    print(f"\n  Risk distribution:")
    print(f"    Low (hypo):  {risk_counts[0]:,} ({risk_counts[0]/len(all_rows)*100:.1f}%)")
    print(f"    Normal:      {risk_counts[1]:,} ({risk_counts[1]/len(all_rows)*100:.1f}%)")
    print(f"    High (hyper):{risk_counts[2]:,} ({risk_counts[2]/len(all_rows)*100:.1f}%)")

    return output_path


if __name__ == "__main__":
    print("=" * 60)
    print("Bluely Synthetic Diabetes Data Generator")
    print("=" * 60)
    print(f"\nGenerating physiologically realistic synthetic data...")
    print(f"This data replaces foreign datasets for initial model training.\n")
    generate_dataset()
    print(f"\n{'=' * 60}")
    print("Generation complete!")
    print("Next step: python train_bluely.py")
    print(f"{'=' * 60}")
