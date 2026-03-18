# Bluely - Machine Learning & Analytics Module

> Full technical documentation for the ML pipeline, synthetic data generation, physiological modelling, model training, API design, input completeness enforcement, patient personalization, AI insight engine, and backend integration.

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [What Affects Blood Glucose?](#what-affects-blood-glucose)
4. [Feature Schema (21 Features)](#feature-schema-21-features)
5. [Synthetic Data Generation](#synthetic-data-generation)
6. [Model Training Pipeline](#model-training-pipeline)
7. [Prediction Module](#prediction-module)
8. [FastAPI Server (v4.1)](#fastapi-server-v41)
9. [Input Completeness Enforcement](#input-completeness-enforcement)
10. [Patient Personalization Layer](#patient-personalization-layer)
11. [AI Insight Engine (DiaBuddy)](#ai-insight-engine-diabuddy)
12. [Node.js Backend Integration](#nodejs-backend-integration)
13. [Model Evaluation](#model-evaluation)
14. [HbA1c Estimation](#hba1c-estimation)
15. [Weekly Analysis](#weekly-analysis)
16. [Deployment Architecture](#deployment-architecture)
17. [File & Folder Structure](#file--folder-structure)
18. [Clinical Language Guidelines](#clinical-language-guidelines)
19. [Future Enhancements](#future-enhancements)

---

## Overview

Bluely's ML module provides glucose predictions and risk assessment for users managing diabetes. The system is **entirely self-contained** - no foreign datasets (Pima Indians, OhioT1DM, etc.) are used. Instead, all models are trained on **physiologically realistic synthetic data** generated from differential-equation-based glucose simulation.

### Key Principles

1. **No Foreign Data Dependencies** - Training data is generated from physiological models that simulate how glucose responds to meals, medication, activity, sleep, stress, and circadian rhythms. This eliminates questions about dataset relevance to the target population.

2. **Input Completeness** - Every prediction endpoint requires all physiologically relevant inputs (glucose, meal, medication, activity, wellness, history). Missing data returns a 422 error explaining what to log and why, instead of silently guessing.

3. **Hybrid Ready** - Once >=21 real user readings accumulate, models can be fine-tuned with real data blended into the synthetic training set (3x upsampled).

4. **African-Focused Demographics** - Synthetic patient profiles are weighted by diabetes type prevalence relevant to Sub-Saharan Africa: 60% Type 2, 15% Type 1, 15% prediabetes, 7% gestational, 3% other.

5. **Three-Layer Architecture** - Global models provide baseline predictions, patient-specific personalization calibrates them using EWMA-based residual learning, and the AI Insight Engine (DiaBuddy) generates human-readable explanations via LLM with rule-based fallback.

---

## Design Philosophy

### Why Synthetic Data Instead of External Datasets?

| Problem with External Datasets | Our Solution |
|-------------------------------|--------------|
| **Pima Indians**: Only 8 static features, no temporal context, different population demographics | Generate time-series data with 21 features matching our exact app data model |
| **OhioT1DM**: Only 6 Type 1 patients from Ohio, USA - not representative of African populations | Simulate 200 patients across all diabetes types with African-relevant parameters |
| **Both**: Feature mismatch - external datasets don't include meal type, medication timing, mood, sleep quality, stress | Synthetic data includes every feature the app collects |
| **Both**: Cannot control risk distribution or edge cases | Tune simulation parameters to produce realistic distributions |

### Physiological Modelling Approach

Rather than training on someone else's data, we built a **glucose simulation engine** that models the actual biological mechanisms:

```
Glucose(t+1) = Glucose(t)
    + circadian_effect(hour)        # Dawn phenomenon, nighttime dip
    + meal_absorption(carbs, time)  # Gamma-curve carb absorption
    - insulin_action(dose, time)    # Insulin pharmacokinetics
    - exercise_effect(intensity)    # GLUT4 transporter upregulation
    + stress_effect(level)          # Cortisol-mediated gluconeogenesis
    x sleep_modifier(quality)       # Insulin resistance from poor sleep
    + homeostatic_pull(baseline)    # Body's glucose regulation
    + noise                         # Natural biological variability
```

Each component is based on established physiology (cited in code comments).

---

## What Affects Blood Glucose?

The ML system tracks **every major physiological factor** that influences blood glucose levels.

### Factors Tracked by Bluely

| Factor | How It Affects Glucose | Feature(s) in Model | Data Source |
|--------|----------------------|---------------------|-------------|
| **Carbohydrate Intake** | Carbs are digested into glucose, directly raising blood sugar. Peak absorption 30-90 min after eating. | `carbs_last_meal`, `minutes_since_meal`, `meal_type` | Meal logs |
| **Meal Type** | Breakfast causes stronger spikes (overnight insulin resistance). Dinner moderate. Snacks smaller. | `meal_type` (encoded: breakfast=1, lunch=2, dinner=3, snack=4) | Meal logs |
| **Insulin / Medication** | Insulin lowers glucose via cellular uptake. Rapid-acting peaks 1-2h. Metformin reduces hepatic output. Sulfonylureas stimulate secretion. | `insulin_dose`, `minutes_since_insulin`, `medication_type` | Medication logs |
| **Physical Activity** | Exercise increases GLUT4 transporters, lowering glucose. Effect persists hours after. Intense exercise can cause temporary adrenaline spikes. | `activity_intensity`, `activity_duration`, `minutes_since_activity` | Activity logs |
| **Sleep Quality** | Poor sleep increases insulin resistance via cortisol/growth hormone. One night of poor sleep can increase resistance by 25-30%. | `sleep_quality` (1-5 scale) | Lifestyle logs |
| **Stress Level** | Stress triggers cortisol, stimulating gluconeogenesis and reducing insulin sensitivity. | `stress_level` (1-5 scale) | Lifestyle logs |
| **Mood** | Correlates with stress and behavioral patterns. Low moods associate with cortisol elevation. | `mood` (encoded: Rough=1 to Great=5) | Mood logs |
| **Circadian Rhythm** | "Dawn phenomenon" - cortisol/growth hormone surge 4-8 AM raises glucose. Evening shows decline. | `hour_sin`, `hour_cos` (cyclic encoding) | Automatic (clock) |
| **Glucose Trend** | Recent trajectory predicts near-future values. Rising trend suggests continued rise. | `glucose_lag_1/2/3`, `glucose_trend`, `glucose_std` | Glucose history |
| **Diabetes Type** | Type 1 has wider swings. Type 2 has higher baselines. Gestational has pregnancy patterns. | `diabetes_type` (encoded: type1=0...other=4) | User profile |

### Factors NOT Currently Tracked (and Why)

| Factor | Why Not Tracked | Impact |
|--------|----------------|--------|
| **Body weight / BMI** | Not collected in app - would add onboarding friction | Minor for short-term predictions; matters more for long-term risk |
| **Blood pressure** | Requires external device | Indirect; more relevant for cardiovascular risk |
| **Hydration** | Difficult to log accurately | Dehydration concentrates readings but doesn't change actual metabolism significantly |
| **Menstrual cycle** | Privacy-sensitive, not currently collected | Hormonal changes can affect insulin sensitivity by 15-20% during luteal phase |
| **Alcohol intake** | Not currently tracked | Suppresses gluconeogenesis, can cause delayed hypoglycemia |
| **Illness / infection** | Not currently tracked | Raises glucose via inflammatory cytokines |
| **Ambient temperature** | Complex to measure | Extreme heat/cold can affect metabolism slightly |

> **Summary**: The 21-feature model captures the **primary physiological drivers** of glucose change: carbs, insulin, activity, sleep, stress, mood, time-of-day, diabetes type, and glucose history. The only notable gaps are alcohol, menstrual cycle, and illness - all of which are either privacy-sensitive or difficult to log reliably.

---

## Feature Schema (21 Features)

Every prediction uses exactly 21 numerical features, consistent across data generation, training, and live prediction.

| # | Feature | Range | Description |
|---|---------|-------|-------------|
| 1 | `current_glucose` | 40-400 mg/dL | Current blood glucose reading |
| 2 | `carbs_last_meal` | 0-300 g | Carbohydrates in most recent meal |
| 3 | `minutes_since_meal` | 0-999 min | Time since last meal |
| 4 | `meal_type` | 0-4 | none=0, breakfast=1, lunch=2, dinner=3, snack=4 |
| 5 | `insulin_dose` | 0-50 units | Most recent insulin/medication dose |
| 6 | `minutes_since_insulin` | 0-999 min | Time since medication was taken |
| 7 | `medication_type` | 0-5 | none=0, insulin_rapid=1, insulin_long=2, insulin_mixed=3, metformin=4, sulfonylurea/other=5 |
| 8 | `activity_intensity` | 0-3 | none=0, low=1, medium=2, high=3 |
| 9 | `activity_duration` | 0-480 min | Duration of physical activity |
| 10 | `minutes_since_activity` | 0-999 min | Time since activity ended |
| 11 | `hour_sin` | -1 to 1 | sin(2pi x hour / 24) - cyclic time encoding |
| 12 | `hour_cos` | -1 to 1 | cos(2pi x hour / 24) - cyclic time encoding |
| 13 | `sleep_quality` | 1-5 | Self-reported sleep quality |
| 14 | `stress_level` | 1-5 | Self-reported stress level |
| 15 | `mood_score` | 1-5 | Rough=1, Low=2, Okay=3, Good=4, Great=5 |
| 16 | `glucose_lag_1` | 40-400 | Previous glucose reading |
| 17 | `glucose_lag_2` | 40-400 | Glucose 2 steps back |
| 18 | `glucose_lag_3` | 40-400 | Glucose 3 steps back |
| 19 | `glucose_trend` | varies | Linear slope of recent history |
| 20 | `glucose_std` | >=0 | Standard deviation of recent readings |
| 21 | `diabetes_type` | 0-4 | type1=0, type2=1, prediabetes=2, gestational=3, other=4 |

### Why Cyclic Time Encoding?

Hour-of-day is cyclic (23:00 is close to 00:00), so we encode it as sin/cos components. This lets the model learn circadian patterns without artificial discontinuities at midnight.

### Why 3 Lag Features?

Three lag values capture short-term momentum. Combined with `glucose_trend` (slope) and `glucose_std` (variability), the model has a complete picture of recent glucose dynamics.

---

## Synthetic Data Generation

**File**: `ml/generate_synthetic_data.py`

### Patient Simulation

The generator creates 200 virtual patients, each simulated over 10 days at 5-minute resolution (~135,000 total samples). Patient profiles are drawn from diabetes-type-specific parameter distributions:

| Diabetes Type | Weight | Fasting Range | Insulin Sensitivity | Carb Ratio | Variability |
|--------------|--------|---------------|--------------------|-----------:|-------------|
| Type 2 | 60% | 100-180 mg/dL | 30-60 mg/dL per unit | 5-15 g/unit | 0.10-0.30 |
| Type 1 | 15% | 80-200 mg/dL | 20-50 mg/dL per unit | 4-12 g/unit | 0.15-0.40 |
| Prediabetes | 15% | 90-130 mg/dL | 50-80 mg/dL per unit | 8-20 g/unit | 0.05-0.15 |
| Gestational | 7% | 85-140 mg/dL | 35-65 mg/dL per unit | 6-16 g/unit | 0.10-0.25 |
| Other | 3% | 90-160 mg/dL | 30-70 mg/dL per unit | 5-18 g/unit | 0.08-0.25 |

### Physiological Components

Each 5-minute simulation step applies biologically grounded effects:

#### 1. Circadian Rhythm
Models the dawn phenomenon - glucose rises 15-40 mg/dL between 4-10 AM due to cortisol and growth hormone surges.

#### 2. Meal Absorption (Gamma Curve)
Uses gamma distribution to model realistic carbohydrate absorption kinetics - gradual rise, peak at ~30-40 minutes, slow tail. Parameters: k=2.5, theta=15.

#### 3. Insulin Action (Type-Specific Profiles)
- **Rapid-acting**: Peaks at ~60 min, duration ~4 hours
- **Long-acting**: Gentle plateau from 2-20 hours
- **Mixed**: Combination of rapid and long curves
- **Oral medications**: Delayed onset (~60 min), moderate peak, long duration

#### 4. Exercise Effect
Exercise lowers glucose by increasing GLUT4 transporter expression. Effect decays over 2-3 hours post-activity.

#### 5. Stress & Cortisol
Stress levels 4-5 raise glucose via cortisol-mediated gluconeogenesis. Calm (1-2) has mild lowering effect.

#### 6. Sleep Quality Modifier
Poor sleep (quality 1-2) increases insulin resistance by 5-10%, amplifying glucose responses.

#### 7. Homeostatic Regulation
The body's glucose regulation - liver and kidneys pull glucose toward the patient's baseline at a rate of -0.015 x (current - baseline) per step.

### Risk Label Generation

Each sample is labelled based on the 30-minute-ahead glucose value:

| Label | Glucose Range | Distribution |
|-------|-------------|-------------|
| Low (0) | < 75 mg/dL | ~34% |
| Normal (1) | 75-250 mg/dL | ~64% |
| High (2) | > 250 mg/dL | ~2% |

### Running the Generator

```bash
cd ml
python generate_synthetic_data.py
```

Output: `data/synthetic_training_data.csv` (~135,000 rows, 24 columns)

---

## Model Training Pipeline

**File**: `ml/train_bluely.py`

### Two Models Trained

| Model | Algorithm | Purpose | Output |
|-------|-----------|---------|--------|
| **Forecast** | Gradient Boosting Regressor (200 estimators, depth 6) | Predict glucose 30 minutes ahead | Continuous value (mg/dL) |
| **Risk** | Random Forest Classifier (150 estimators, balanced class weights) | Classify glucose risk level | low / normal / high |

### Training Process

```
1. Load synthetic_training_data.csv
2. Extract 21 input features + target columns
3. StandardScaler normalization
4. 80/20 stratified train-test split
5. Train Gradient Boosting Regressor -> forecast model
6. Train Random Forest Classifier -> risk model
7. Evaluate on test set
8. Save models + scalers to ml/models/
```

### Hybrid Fine-Tuning

When real user data becomes available (>=21 readings per patient), the training script supports hybrid mode:

```bash
python train_bluely.py --finetune path/to/real_data.csv
```

This loads synthetic data as the base, loads real user data, upsamples real data 3x, combines both datasets, and retrains on the blend.

### Model Files

| File | Description |
|------|-------------|
| `models/bluely_forecast_model.joblib` | Gradient Boosting Regressor |
| `models/bluely_forecast_scaler.joblib` | StandardScaler for forecast features |
| `models/bluely_risk_model.joblib` | Random Forest Classifier |
| `models/bluely_risk_scaler.joblib` | StandardScaler for risk features |

---

## Prediction Module

**File**: `ml/predict_bluely.py`

This module bridges the API inputs (JSON from Express backend) and the trained models (numpy arrays).

### Key Functions

| Function | Input | Output |
|----------|-------|--------|
| `build_feature_vector(...)` | 16 raw parameters | numpy array (1, 21) |
| `predict_glucose_30min(features)` | Feature vector | (predicted_glucose, confidence) |
| `apply_pk_correction(...)` | 14 parameters | (corrected_glucose, confidence_penalty) |
| `predict_risk(features)` | Feature vector | {risk_level, risk_code, confidence, recommendation} |
| `estimate_hba1c(glucose_values)` | List of glucose readings | {estimated_hba1c, interpretation, ...} |
| `load_forecast_model()` | - | (model, scaler) tuple |
| `load_risk_model()` | - | (model, scaler) tuple |

### Feature Vector Construction

`build_feature_vector()` handles all encoding and derived feature computation:

- **Categorical encoding**: meal_type -> integer, medication_type -> integer, etc.
- **Cyclic time**: hour -> (sin, cos) components
- **Lag features**: Extract last 3 values from glucose history
- **Trend**: Linear regression slope over recent history
- **Variability**: Standard deviation of recent history

### Pharmacokinetic (PK) Correction Layer — `apply_pk_correction()`

Added in **v4.1** to correct for systematic prediction errors caused by gaps in the training data distribution. This is **not a model override** — it is a post-prediction physiological correction that blends the ML output with physics-based expected outcomes, using conservative blend weights so the ML model always contributes at least 40% (except for the highest-risk stacked-bolus scenario).

All formulas use the same gamma-curve and exercise-effect constants as `generate_synthetic_data.py`, ensuring internal physiological consistency.

#### Why It's Needed

The training data simulates insulin as being given **before meals** (pre-bolus pattern). When users take rapid insulin 2+ hours after a meal as a correction bolus, the model sees `minutes_since_insulin=0` but interprets it as meal+insulin starting simultaneously → predicts "stable" incorrectly. The PK correction detects the correction-bolus context and blends in the physiologically expected glucose drop.

#### The 8 Scenarios Handled

| # | Scenario | Trigger Condition | Correction Applied | PK Weight | Confidence Penalty |
|---|----------|-------------------|-------------------|-----------|-------------------|
| **S1** | Correction bolus (high glucose) | `insulin_rapid/mixed`, dose > 0, < 60 min, glucose > 150 | Gamma-curve insulin drop projected 30 min forward | **0.45** | 0.135 |
| **S1b** | Fresh insulin (normal glucose) | `insulin_rapid/mixed`, dose > 0, < 60 min, glucose ≤ 150 | Same gamma-curve, lower weight | **0.25** | 0.075 |
| **S1c** | Insulin 60–120 min ago | `insulin_rapid/mixed`, 60–120 min | Model well-calibrated here; small nudge only | **0.10** | 0.030 |
| **S2** | High-dose stacked bolus | Rapid insulin ≥ 25U (type2) / ≥ 20U (type1) + < 90 min | Amplified correction with over-correction risk flag | **0.60** | **0.35** |
| **S3** | Stress dampening | `stress_level ≥ 4` | Reduces expected insulin drop by 20% (cortisol counteraction) | Modifies drop | — |
| **S4** | Gastroparesis / slow absorption | `carbs > 60g` + 120–200 min post-meal | Reduces insulin drop by 30%; reduces PK weight × 0.70 | × 0.70 | × 0.70 |
| **S5** | Long-acting basal insulin | `insulin_long`, dose > 0, < 240 min | Gentle nudge −3–6 mg/dL | **0.08** | 0.00 |
| **S6** | Oral medication (metformin/sulfonylurea) | Taken < 120 min | Tiny nudge −2–4 mg/dL | **0.06** | 0.00 |
| **S7** | Delayed post-exercise hypoglycemia | `high` intensity, 120–360 min after activity end | +15% on activity drop in the delayed window | × 1.15 activity | 0.05 |
| **S8** | Dawn phenomenon resistance | Hour 04:00–07:00 + predicted dropping | +8 mg/dL counteracting bias | Adjusts output | +0.05 |

#### Insulin Sensitivity Factor (ISF) by Diabetes Type

| Type | ISF (mg/dL per unit) | Notes |
|------|---------------------|-------|
| Type 1 | 30 | Wider swings, faster response |
| Type 2 | 18 | Lower sensitivity |
| Prediabetes | 22 | Intermediate |
| Gestational | 20 | Pregnancy-adjusted |
| Other | 20 | Conservative default |

All values are the **lower bound** of the training data ISF ranges to avoid over-correcting.

#### Blending Philosophy

The final corrected output is always a weighted blend:
```
corrected = (1 - pk_weight) * ml_prediction + pk_weight * physiology_prediction
```

The ML model retains the majority weight in all scenarios. Higher PK weights only apply when the training data under-representation is most severe (fresh correction bolus, high-dose insulin).

#### Verified Test Case

Input scenario: 229 mg/dL current, 20U Actrapid just taken (0 min), medium activity (30 min, 0 min ago), type2:
```
Before PK correction: 234.0 mg/dL | Stable | 95% confidence
After PK correction:  200.1 mg/dL | Dropping | 82% confidence
```
This correctly reflects that 20U of Actrapid will begin lowering an elevated glucose within the 30-minute window.

---

## FastAPI Server (v4.1)

**File**: `ml/server.py`

### Four-Layer Prediction Architecture

The `/predict-glucose-30` endpoint runs four sequential layers:

```
Layer 1 — Global ML Model            (Gradient Boosting, 21 features)
    ↓
Layer 2 — Patient Personalization    (EWMA calibration, ≥21 readings)
    ↓
Layer 2b — PK Physiological Correction (8 scenarios, gamma-curve formulas)
    ↓
Layer 3 — AI Insight Engine          (LLM → DiaBuddy explanation)
```

### Recommendation Branches (v4.1)

The server now generates specific recommendations for **11 clinical scenarios**, ordered by priority:

| Priority | Condition | Recommendation |
|----------|-----------|----------------|
| 1 | Dropping + forecast < 70 | Act now: fast-acting carbs, recheck in 15 min |
| 2 | Dropping + forecast 70–80 | Small snack, monitor every 10–15 min |
| 3 | Dropping + nocturnal (22:00–04:00) + < 100 | Nocturnal hypo risk; bedtime snack + set alarm |
| 4 | Dropping + high-dose insulin + current > 180 | Over-correction risk; hold additional insulin |
| 5 | Dropping + insulin_rapid + current > 180 | Monitor 60–90 min; insulin reaching peak |
| 6 | Dropping + no insulin + current > 180 | Avoid second correction until trend confirmed |
| 7 | Rising + forecast > 250 | Significantly elevated; review with provider |
| 8 | Rising + stress ≥ 4 + forecast > 180 | Cortisol contribution; try walk/breathing |
| 9 | Rising + basal insulin + forecast > 180 | Basal doesn't cover meal spikes; log meal |
| 10 | Rising + forecast > 180 | Upward trend above range; discuss with provider |
| 11 | Stable + high carbs + < 60 min since meal | Post-meal rise may arrive in 20–40 min |
| 12 | Stable + dawn window + current > 140 | Dawn phenomenon; discuss timing with provider |

### Additional Factor Text (v4.1)

Factor descriptions are now contextual and physiologically specific:

- **Stress ≥ 4**: Cortisol / gluconeogenesis mechanism named explicitly
- **Poor sleep**: "insulin resistance may be elevated by 20–30%"
- **Dawn window**: Cortisol + growth hormone mechanism, hours 4–8 AM
- **High-dose insulin**: Over-correction risk and monitoring window stated
- **Gastroparesis flag**: High-carb meal + 120–200 min window flagged
- **Delayed exercise**: Exact post-activity window stated (120–360 min)

### Endpoints

| Method | Endpoint | Description | Input Strictness |
|--------|----------|-------------|-----------------|
| `POST` | `/predict` | Glucose risk classification | **Strict** - all inputs required |
| `POST` | `/predict-glucose-30` | 30-minute glucose forecast | **Strict** - all inputs required |
| `POST` | `/predict-trend` | Trend direction from readings | **Light** - just readings needed |
| `POST` | `/estimate-hba1c` | HbA1c estimation | >=21 glucose values |
| `POST` | `/analyze-weekly` | Weekly glucose analysis (TIR) | >=7 readings |
| `GET` | `/health` | Service health check | None |

### Request/Response: POST /predict (Risk Classification)

**Request:**
```json
{
    "currentGlucose": 165,
    "diabetesType": "type2",
    "meal": {
        "carbsEstimate": 45,
        "mealType": "lunch",
        "minutesSinceMeal": 90
    },
    "medication": {
        "dose": 500,
        "medicationType": "metformin",
        "minutesSinceTaken": 120
    },
    "activity": {
        "intensity": "low",
        "durationMinutes": 20,
        "minutesSinceActivity": 180
    },
    "wellness": {
        "sleepQuality": 4,
        "stressLevel": 2,
        "mood": "Good"
    },
    "glucoseHistory": [140, 155, 160, 162, 165],
    "hour": 14
}
```

**Response (200 - all inputs present):**
```json
{
    "riskLevel": "normal",
    "riskCode": 1,
    "confidence": 0.87,
    "recommendation": "Levels appear stable. Continue logging to track patterns.",
    "inputsComplete": true,
    "missingInputs": null
}
```

**Response (422 - missing inputs):**
```json
{
    "detail": {
        "message": "Cannot generate prediction - missing required inputs...",
        "missingInputs": [
            {
                "field": "meal",
                "label": "Last Meal",
                "reason": "Carbohydrate intake directly affects blood glucose...",
                "href": "/meals",
                "icon": "meal"
            }
        ],
        "missingCount": 1
    }
}
```

### Request/Response: POST /predict-glucose-30 (Forecast)

Same request format as `/predict`. Response:

```json
{
    "predictedGlucose": 172.3,
    "direction": "rising",
    "directionArrow": "^",
    "directionLabel": "Glucose is expected to rise over the next 30 minutes",
    "confidence": 0.82,
    "timeframe": "30 minutes",
    "recommendation": "A mild upward trend is expected. Staying hydrated and active may help.",
    "riskAlert": null,
    "factors": [
        "Prediction from Bluely model (trained on synthetic physiological data)",
        "Post-meal period (90min since meal)"
    ],
    "modelUsed": "bluely_synthetic",
    "inputsComplete": true,
    "missingInputs": null
}
```

### Request/Response: POST /estimate-hba1c

```json
// Request
{ "glucoseValues": [120, 145, 130, 155, 140, ...] }

// Response (>=21 readings)
{
    "estimatedHbA1c": 6.5,
    "averageGlucose": 140.0,
    "glucoseStd": 25.3,
    "readingCount": 45,
    "readingsNeeded": 0,
    "confidenceNote": "Moderate confidence - more readings improve accuracy",
    "interpretation": "Diabetic range - discuss with your healthcare provider"
}
```

### Request/Response: POST /analyze-weekly

```json
// Request
{
    "readings": [
        {"value": 140, "readingType": "fasting", "hour": 7, "day": 0},
        {"value": 180, "readingType": "after_meal", "hour": 13, "day": 0}
    ],
    "diabetesType": "type2"
}

// Response
{
    "averageGlucose": 155.2,
    "glucoseStd": 35.8,
    "timeInRange": 62.5,
    "timeBelowRange": 5.0,
    "timeAboveRange": 32.5,
    "fastingAverage": 125.0,
    "postMealAverage": 185.0,
    "bestDay": "Wednesday",
    "worstDay": "Saturday",
    "insights": [
        "62.5% time-in-range. Aim for >=70% as recommended.",
        "Post-meal average is 185.0 mg/dL - above 180 target."
    ]
}
```

---

## Input Completeness Enforcement

A core design principle: **predictions require ALL physiologically relevant inputs**. No silent defaults, no guessing.

### Why?

Glucose is affected by meals, medication, activity, and wellness **simultaneously**. A prediction that ignores medication status could miss hypoglycemia risk. A prediction without meal data could miss an incoming post-meal spike. Partial-input predictions are not just inaccurate - they can be dangerously misleading.

### What's Validated

| Input Category | Fields Required | Why It Matters |
|---------------|----------------|----------------|
| **Meal** | carbsEstimate, mealType, minutesSinceMeal | Carbs directly raise glucose. Can't predict post-meal spikes without this. |
| **Medication** | dose, medicationType, minutesSinceTaken | Insulin significantly lowers glucose. Missing this -> overestimate glucose or miss hypo risk. |
| **Activity** | intensity, durationMinutes, minutesSinceActivity | Exercise affects glucose uptake by muscles. Even "no activity" is informative. |
| **Wellness** | sleepQuality, stressLevel, mood | Sleep and stress affect insulin resistance via cortisol. |
| **Glucose History** | >=3 prior readings | Needed for lag features, trend, and variability calculations. |

### Frontend Experience

When inputs are missing, the API returns a 422 with:
- A human-readable message explaining why all inputs are needed
- A list of `missingInputs`, each with `label`, `reason`, `href` (to logging page), and `icon`
- The frontend can display these as actionable prompts: "Log your last meal to enable predictions"

---

## Node.js Backend Integration

The Express backend proxies requests to the ML FastAPI server, gathering context from MongoDB automatically.

### Architecture

```
Frontend -> Express Backend -> FastAPI ML Server
                |
           MongoDB (context gathering)
```

### Context Gathering

The `gatherPredictionContext()` function in `predict.controller.ts` queries 7 MongoDB collections in parallel:

| Collection | Query | Used For |
|-----------|-------|----------|
| `User` | By firebaseUid | diabetesType |
| `GlucoseReading` | Last 20, sorted by date | currentGlucose, glucoseHistory |
| `Meal` | Most recent within 4 hours | meal context |
| `MedicationLog` | Most recent within 6 hours | medication context |
| `Activity` | Most recent within 6 hours | activity context |
| `MoodLog` | Most recent | mood |
| `LifestyleLog` | Most recent | sleepQuality, stressLevel |

If any context is missing (e.g., no recent meal logged), that field is sent as `null` to the ML API, which returns a 422 with instructions on what to log.

### API Routes

| Method | Route | Controller | Description |
|--------|-------|-----------|-------------|
| `POST` | `/api/predict` | `getPrediction` | Risk classification with full context |
| `GET` | `/api/predict/history` | `getPredictions` | Prediction history |
| `GET` | `/api/predict/latest` | `getLatestPrediction` | Most recent prediction |
| `GET` | `/api/predict/trends` | `getTrends` | Weekly trend comparison |
| `GET` | `/api/predict/glucose-30` | `getGlucose30` | 30-min forecast with caching |
| `GET` | `/api/predict/forecast-history` | `getForecastHistory` | Forecast log history |
| `GET` | `/api/predict/estimate-hba1c` | `getHbA1cEstimate` | HbA1c estimation |
| `GET` | `/api/predict/analyze-weekly` | `getWeeklyAnalysis` | Weekly TIR analysis |

### Fallback Logic

Every endpoint includes a fallback for when the ML service is unavailable:

- **Risk prediction fallback**: Rule-based classification using glucose thresholds (>250 -> high, <75 -> low)
- **30-min forecast fallback**: Linear extrapolation from recent readings
- **HbA1c fallback**: Local ADAG formula calculation
- **Weekly analysis fallback**: Local statistics computation

---

## Model Evaluation

### Forecast Model (Gradient Boosting Regressor)

Trained on ~135,000 synthetic samples, evaluated on 20% held-out test set:

| Metric | Value |
|--------|-------|
| **MAE** | 2.46 mg/dL |
| **RMSE** | 3.67 mg/dL |
| **R-squared** | 0.9961 |
| **Within +/-20 mg/dL** | 99.8% |

> These results reflect synthetic data where the simulation model and the ML model share the same underlying physics. Real-world performance will differ - the hybrid fine-tuning mechanism addresses this gap.

### Risk Model (Random Forest Classifier)

| Metric | Value |
|--------|-------|
| **Accuracy** | 99.3% |
| **F1 (macro)** | 0.978 |

**Per-class performance:**

| Class | Precision | Recall | F1 | Support |
|-------|-----------|--------|-----|---------|
| Low (0) | 0.99 | 1.00 | 1.00 | ~34% |
| Normal (1) | 0.99 | 0.99 | 0.99 | ~64% |
| High (2) | 0.96 | 0.92 | 0.94 | ~2% |

### Interpreting Synthetic-Data Results

The high accuracy numbers reflect that the model learned the simulation's physics well. This is expected and good - the feature set is expressive enough to capture glucose dynamics. However:

- **Real-world accuracy will be lower** because patients don't follow simulation assumptions perfectly
- **The hybrid fine-tuning mechanism** is designed to close this gap as real data accumulates
- **The fallback logic** ensures predictions remain reasonable even with out-of-distribution inputs

---

## HbA1c Estimation

### What is HbA1c?

HbA1c (glycated hemoglobin) reflects average blood glucose over 2-3 months. Key metric for diabetes management:

| HbA1c | Interpretation |
|-------|---------------|
| < 5.7% | Normal |
| 5.7-6.4% | Prediabetic range |
| >= 6.5% | Diabetic range |

### ADAG Formula

The ADAG (A1c-Derived Average Glucose) study established:

```
HbA1c = (mean_glucose_mg/dL + 46.7) / 28.7
```

### Requirements

- Minimum 21 glucose readings for statistical significance
- More readings spanning varied times (fasting, post-meal, bedtime) improve accuracy
- Ideally covers multiple weeks for a representative average

### Confidence Tiers

| Reading Count | Confidence |
|--------------|------------|
| < 21 | Insufficient - returns count and how many more needed |
| 21-49 | Low confidence - rough estimate |
| 50-99 | Moderate confidence |
| >= 100 | Good confidence |

---

## Weekly Analysis

The weekly analysis endpoint provides **Time-in-Range (TIR)** - the most important metric in modern diabetes management, recommended by the International Consensus on TIR.

### Metrics Computed

| Metric | Description | Target |
|--------|-------------|--------|
| **Time in Range** | % of readings 70-180 mg/dL | >= 70% |
| **Time Below Range** | % of readings < 70 mg/dL | < 4% |
| **Time Above Range** | % of readings > 180 mg/dL | < 25% |
| **Fasting Average** | Mean of fasting-type readings | 80-130 mg/dL |
| **Post-Meal Average** | Mean of after_meal readings | < 180 mg/dL |
| **Day Patterns** | Best/worst days of the week | - |

### Actionable Insights

The endpoint generates human-readable insights, e.g.:
- "62.5% time-in-range. This is improving - aim for >=70% as recommended."
- "Post-meal average is 185 mg/dL - above 180 target. Meal composition and portion control may help."
- "Glucose variability is high (SD: 52 mg/dL). Consistent meal timing may reduce swings."

---

## Deployment Architecture

```
+------------------+     +------------------+     +----------------------+
|                  |     |                  |     |                      |
|   Next.js App    |---->|  Express API     |---->|  FastAPI ML (v3.0)   |
|   (Render)       |     |  (Render)        |     |  (Render)            |
|                  |     |                  |     |                      |
|  - Dashboard     |     |  - User CRUD     |     |  - /predict          |
|  - Cards UI      |     |  - Glucose CRUD  |     |  - /predict-glucose-30|
|  - Prediction    |     |  - Meal CRUD     |     |  - /predict-trend    |
|    display       |     |  - Context       |     |  - /estimate-hba1c   |
|  - Logging forms |     |    gathering     |     |  - /analyze-weekly   |
|                  |     |  - ML proxy      |     |  - /health           |
+------------------+     +--------+---------+     +----------------------+
                                  |
                         +--------v---------+
                         |                  |
                         |   MongoDB Atlas  |
                         |                  |
                         |  - Users         |
                         |  - GlucoseReadings|
                         |  - Meals         |
                         |  - Medications   |
                         |  - MedicationLogs|
                         |  - Activities    |
                         |  - HealthProfiles|
                         |  - MoodLogs      |
                         |  - LifestyleLogs |
                         |  - Predictions   |
                         |  - ForecastLogs  |
                         |  - Notifications |
                         +------------------+
```

### Render Configuration

See `render.yaml` for the full blueprint. Key settings:

| Service | Runtime | Root Dir | Start Command |
|---------|---------|----------|---------------|
| ML | Python 3.12 | `ml` | `gunicorn server:app --workers 2 --worker-class uvicorn.workers.UvicornWorker` |
| Backend | Node 20 | `backend` | `node dist/server.js` |
| Frontend | Static | `frontend` | Static export |

### Environment Variables

**ML Service:**

| Variable | Value |
|----------|-------|
| `PYTHON_VERSION` | `3.12.7` |
| `PORT` | `8000` |

**Backend:**

| Variable | Value |
|----------|-------|
| `ML_API_URL` | `https://bluely-ml.onrender.com` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `FIREBASE_*` | Firebase credentials |

### Deployment Order

1. **ML Service** (`bluely-ml`) - deploy first, note the URL
2. **Backend** (`bluely-backend`) - set `ML_API_URL` to ML URL
3. **Frontend** (`bluely-frontend`) - set `NEXT_PUBLIC_API_URL` to backend URL

---

## File & Folder Structure

```
ml/
|-- generate_synthetic_data.py      # Physiological glucose simulation (200 patients x 10 days)
|-- train_bluely.py                 # Train forecast + risk models (hybrid fine-tuning support)
|-- predict_bluely.py               # Feature engineering + prediction functions
|-- server.py                       # FastAPI v3.0 server (input enforcement)
|-- requirements.txt                # Python dependencies
|-- build.sh                        # Render build script
|-- README.md                       # ML setup instructions
|-- data/
|   +-- synthetic_training_data.csv # Generated training data (~135K rows)
|-- models/
|   |-- bluely_forecast_model.joblib    # Gradient Boosting Regressor
|   |-- bluely_forecast_scaler.joblib   # Forecast feature scaler
|   |-- bluely_risk_model.joblib        # Random Forest Classifier
|   +-- bluely_risk_scaler.joblib       # Risk feature scaler
|
|   # Legacy files (kept for reference, not used by v3):
|-- train.py                        # Old Pima training pipeline
|-- train_ohio.py                   # Old OhioT1DM training pipeline
|-- parse_ohio.py                   # Old OhioT1DM XML parser
|-- predict.py                      # Old Pima prediction helper
+-- server_v2_backup.py             # Previous server version backup
```

---

## Clinical Language Guidelines

All user-facing text follows **safe, observational language patterns**. The system does **not** provide medical advice, instructions, or diagnoses.

### Core Principles

1. **Observational, not instructional** - describe what the data shows, never tell users what to do medically
2. **Trend-based, not absolute** - focus on direction and patterns, not definitive values
3. **Suggestive, not prescriptive** - use "consider", "may", "appears to" rather than "you should", "you must"
4. **Provider-referencing** - escalate to healthcare providers for clinical action

### Prohibited vs. Recommended Language

| Do NOT use | Use instead |
|------------|-------------|
| "You should eat / take medication" | "Consider reviewing this pattern with your provider" |
| "Your glucose is dangerous" | "This reading is above the target range" |
| "Take action immediately" | "Please follow your provider's guidance" |
| "This means you have diabetes" | "Multiple factors indicate a higher risk profile" |

### Disclaimer

Every insight-bearing surface includes:

> **"Insights are based on logged data patterns and are not medical instructions."**

---

## File & Folder Structure

```
ml/
|-- generate_synthetic_data.py      # Physiological glucose simulation (200 patients x 10 days)
|-- train_bluely.py                 # Train forecast + risk models (hybrid fine-tuning support)
|-- predict_bluely.py               # Feature engineering + prediction functions
|-- server.py                       # FastAPI v3.0 server (input enforcement)
|-- requirements.txt                # Python dependencies
|-- build.sh                        # Render build script
|-- README.md                       # ML setup instructions
|-- data/
|   +-- synthetic_training_data.csv # Generated training data (~135K rows)
|-- models/
|   |-- bluely_forecast_model.joblib    # Gradient Boosting Regressor
|   |-- bluely_forecast_scaler.joblib   # Forecast feature scaler
|   |-- bluely_risk_model.joblib        # Random Forest Classifier
|   +-- bluely_risk_scaler.joblib       # Risk feature scaler
|
|   # Legacy files (kept for reference, not used by v3):
|-- train.py                        # Old Pima training pipeline
|-- train_ohio.py                   # Old OhioT1DM training pipeline
|-- parse_ohio.py                   # Old OhioT1DM XML parser
|-- predict.py                      # Old Pima prediction helper
+-- server_v2_backup.py             # Previous server version backup
```

---

## Future Enhancements

| Enhancement | Description | Priority | Status |
|-------------|-------------|----------|--------|
| **Synthetic Data Generation** | Physiological glucose simulation | High | Done |
| **Input Completeness Enforcement** | 422 errors for missing data | High | Done |
| **Risk Classification** | ML-based glucose risk levels | High | Done |
| **30-Min Glucose Forecast** | Gradient Boosting Regressor | High | Done |
| **HbA1c Estimation** | ADAG formula from >=21 readings | High | Done |
| **Weekly Analysis (TIR)** | Time-in-range + insights | High | Done |
| **Trend Prediction** | Statistical trend from readings | High | Done |
| **Clinical Language** | Observational, non-directive text | High | Done |
| **Hybrid Fine-Tuning** | Blend real data with synthetic | High | Ready (--finetune flag) |
| **Patient Personalization** | EWMA-based per-user calibration | High | Done |
| **AI Insight Engine** | LLM-powered DiaBuddy summaries | High | Done |
| **DiaBuddy Frontend** | AI summary card with typing animation | High | Done |
| **PK Correction Layer (v4.1)** | 8-scenario physiological post-prediction correction | High | Done |
| **Extended Recommendations (v4.1)** | 12 clinical scenario branches in server.py | High | Done |
| **Contextual Factor Text (v4.1)** | Mechanism-specific factor descriptions | High | Done |
| **Forecast Card Redesign (v4.1)** | Count-up animation, confidence color coding, animated direction arrow, DiaBuddy polish | High | Done |
| **Alcohol Tracking** | Delayed hypoglycemia prediction | Medium | Planned |
| **Menstrual Cycle** | Luteal-phase insulin resistance | Medium | Planned |
| **Illness Tracking** | Infection-related glucose rises | Medium | Planned |
| **Anomaly Detection** | Unusual pattern alerts | Medium | Planned |
| **SHAP Explainability** | Feature importance per prediction | Medium | Planned |
| **Time-Series Deep Learning** | LSTM/GRU for sequential prediction | Low | Planned |
| **Offline ML** | TensorFlow.js client-side inference | Low | Planned |
| **Meal Image Recognition** | Camera-based carb estimation | Low | Planned |

---

## Patient Personalization Layer

### Architecture

The personalization layer sits between the global model and the output, applying patient-specific calibration to improve prediction accuracy as more data accumulates.

```
Global Model Prediction → Personalization Engine → Calibrated Prediction
                                ↑
                    Patient Profile (JSON)
                    - baseline_glucose_bias
                    - ewma_residual
                    - insulin_sensitivity_factor
                    - carb_response_factor
                    - activity_response_factor
```

### How It Works

1. **Activation Threshold**: Personalization activates after **≥21 glucose readings** per patient
2. **Residual Learning**: Each prediction/actual pair is used to update the patient's profile via EWMA (α=0.15)
3. **Context-Specific Factors**: The system learns individual sensitivity to insulin, carbs, and activity
4. **Calibration Formula**:
   ```
   calibrated = global_prediction
              + baseline_bias
              + ewma_residual * 0.5
              + insulin_adjustment * (insulin_sensitivity - 1.0)
              + carb_adjustment * (carb_response - 1.0)
              + activity_adjustment * (activity_response - 1.0)
   ```
5. **Safety Clamping**: Offset clamped to ±50 mg/dL, final output clamped to 40-400 mg/dL

### Module Files

| File | Purpose |
|------|---------|
| `ml/personalization/__init__.py` | Module exports |
| `ml/personalization/patient_profile.py` | `PatientProfile` dataclass, JSON persistence |
| `ml/personalization/adaptation_trainer.py` | EWMA update logic, context factor learning |
| `ml/personalization/personalization_engine.py` | Calibration engine with physiological constants |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/personalization/update` | Update patient calibration from predicted/actual pair |
| GET | `/personalization/profile/{user_id}` | Retrieve patient personalization profile |

---

## AI Insight Engine (DiaBuddy)

### Overview

DiaBuddy is the AI-powered insight generation system that translates glucose predictions and health data into warm, human-readable summaries. It uses a multi-provider LLM architecture with rule-based fallback.

### Provider Cascade

```
DeepSeek API (preferred, cost-effective)
    ↓ (if unavailable)
OpenAI API (fallback)
    ↓ (if unavailable)
Ollama (local, development)
    ↓ (if unavailable)
Rule-based templates (always works)
```

### Safety Guardrails

All LLM outputs are:
- Prepended with a medical safety system prompt
- Post-processed to remove banned phrases (medication dosage advice, diagnoses)
- Constrained to observational language ("Your glucose appears to..." not "You have...")
- Appended with a disclaimer that this is not medical advice

### Module Files

| File | Purpose |
|------|---------|
| `ml/ai_insights/__init__.py` | Module exports |
| `ml/ai_insights/llm_interface.py` | Multi-provider LLM client (DeepSeek, OpenAI, Ollama) |
| `ml/ai_insights/insight_engine.py` | Main engine: prompt building, LLM call, sanitization, fallback |
| `ml/ai_insights/insight_templates.py` | Rule-based templates for when LLM is unavailable |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai-insight` | Generate AI insight for a single prediction |
| POST | `/diabuddy/summarize` | Generate DiaBuddy health summary from readings |

### Frontend Integration

The `DiaBuddyCard` component (`frontend/src/components/dashboard/DiaBuddyCard.tsx`) provides:
- "Ask DiaBuddy to Summarize" button with sparkle icon
- Loading animation (bouncing dots)
- Typing animation for the AI response
- Source badge (AI or Analysis)
- Compact mode for dashboard, full mode for insights page

---

*Document version: 4.0 - Added patient personalization layer, AI insight engine (DiaBuddy), and three-layer architecture documentation*
*Project: Bluely - Diabetes Self-Management System*
