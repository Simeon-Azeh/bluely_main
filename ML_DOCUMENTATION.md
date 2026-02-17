# Bluely — Machine Learning & Analytics Module

> Full technical documentation for the ML pipeline, data models, progressive data collection, dashboard integration, and deployment plan.

---

## Table of Contents

1. [Overview](#overview)
2. [Objectives](#objectives)
3. [Data Models & Schema Changes](#data-models--schema-changes)
4. [Progressive Data Collection Strategy](#progressive-data-collection-strategy)
5. [Dashboard Cards Specification](#dashboard-cards-specification)
6. [ML Pipeline](#ml-pipeline)
7. [FastAPI Prediction Server](#fastapi-prediction-server)
8. [Node.js Backend Integration](#nodejs-backend-integration)
9. [Frontend Integration](#frontend-integration)
10. [Model Evaluation](#model-evaluation)
11. [Deployment Architecture](#deployment-architecture)
12. [File & Folder Structure](#file--folder-structure)
13. [Future Enhancements](#future-enhancements)

---

## Overview

Bluely integrates a machine learning module to analyze blood glucose trends and predict risk levels for users managing diabetes. The system uses a **two-phase approach**:

1. **Phase 1 — External Dataset Training**: Train and validate models using the publicly available [Pima Indians Diabetes Dataset](https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database) (UCI/Kaggle). This provides a reliable baseline before any user data is collected.

2. **Phase 2 — User Data Fine-Tuning**: Progressively collect lifestyle and health data from app users through optional, non-intrusive dashboard prompts. Over time, this user-generated data enriches model accuracy for personalized predictions.

---

## Objectives

| Goal | Description |
|------|-------------|
| **Glucose Prediction** | Predict a user's next likely glucose level based on historical readings, meals, activity, and lifestyle factors |
| **Risk Classification** | Classify glucose risk as `normal`, `elevated`, or `critical` |
| **Trend Analysis** | Identify patterns (e.g., post-meal spikes, fasting trends) over time |
| **Personalized Insights** | Deliver actionable recommendations based on predictions |
| **Progressive Collection** | Gather ML-relevant features gradually without blocking app usage |

---

## Data Models & Schema Changes

### Existing Models (Already in MongoDB)

#### User Model (`User`)

| Field | Type | Notes |
|-------|------|-------|
| `firebaseUid` | String | Unique, indexed |
| `email` | String | Unique |
| `displayName` | String | Required |
| `dateOfBirth` | Date | Optional |
| `diabetesType` | Enum | `type1`, `type2`, `gestational`, `prediabetes`, `other` |
| `diagnosisYear` | Number | Optional |
| `targetGlucoseMin` | Number | Default: 70 |
| `targetGlucoseMax` | Number | Default: 180 |
| `preferredUnit` | Enum | `mg/dL` or `mmol/L` |
| `onboardingCompleted` | Boolean | Default: false |

#### Glucose Reading Model (`GlucoseReading`)

| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | Ref → User |
| `firebaseUid` | String | Indexed |
| `value` | Number | 20–600 |
| `unit` | Enum | `mg/dL` or `mmol/L` |
| `readingType` | Enum | `fasting`, `before_meal`, `after_meal`, `bedtime`, `random`, `other` |
| `mealContext` | String | Optional, max 200 chars |
| `activityContext` | String | Optional, max 200 chars |
| `notes` | String | Optional, max 500 chars |
| `recordedAt` | Date | When the reading was taken |

---

### New Models (To Be Added)

#### 1. Meal Model (`Meal`)

Tracks meal information for correlation with glucose readings.

```javascript
// backend/src/models/Meal.ts
{
  userId:         ObjectId,     // Ref → User
  firebaseUid:    String,       // Indexed
  carbsEstimate:  Number,       // Estimated carbs in grams (0–500)
  mealType:       String,       // Enum: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  mealCategory:   String,       // Enum: 'home_cooked' | 'processed' | 'restaurant' | 'other'
  description:    String,       // Optional, max 300 chars
  timestamp:      Date,         // When the meal was eaten
  createdAt:      Date,
  updatedAt:      Date
}
```

**Mongoose Schema:**

```typescript
const MealSchema = new Schema<IMeal>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    firebaseUid:   { type: String, required: true, index: true },
    carbsEstimate: { type: Number, min: 0, max: 500 },
    mealType:      { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
    mealCategory:  { type: String, enum: ['home_cooked', 'processed', 'restaurant', 'other'], default: 'other' },
    description:   { type: String, maxlength: 300, trim: true },
    timestamp:     { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);
```

#### 2. Activity Model (`Activity`)

Tracks physical activity for glucose trend analysis.

```javascript
// backend/src/models/Activity.ts
{
  userId:           ObjectId,     // Ref → User
  firebaseUid:      String,       // Indexed
  activityLevel:    String,       // Enum: 'low' | 'medium' | 'high'
  activityType:     String,       // Optional: 'walking' | 'running' | 'gym' | 'sports' | 'other'
  durationMinutes:  Number,       // 1–480
  timestamp:        Date,
  createdAt:        Date,
  updatedAt:        Date
}
```

**Mongoose Schema:**

```typescript
const ActivitySchema = new Schema<IActivity>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    firebaseUid:     { type: String, required: true, index: true },
    activityLevel:   { type: String, enum: ['low', 'medium', 'high'], required: true },
    activityType:    { type: String, enum: ['walking', 'running', 'gym', 'sports', 'other'] },
    durationMinutes: { type: Number, min: 1, max: 480 },
    timestamp:       { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);
```

#### 3. User Health Profile Model (`UserHealthProfile`)

Stores progressively collected lifestyle and medication data — separate from the core `User` model to keep onboarding lightweight.

```javascript
// backend/src/models/UserHealthProfile.ts
{
  userId:              ObjectId,     // Ref → User
  firebaseUid:         String,       // Unique, indexed

  // Lifestyle
  activityLevel:       String,       // Enum: 'low' | 'medium' | 'high'
  exerciseFrequency:   String,       // Enum: 'rare' | 'moderate' | 'frequent'
  sleepQuality:        Number,       // 1–5 scale
  stressLevel:         Number,       // 1–5 scale
  mealPreference:      String,       // Enum: 'home_cooked' | 'processed' | 'mixed'

  // Medication
  onMedication:        Boolean,      // Default: false
  medicationCategory:  String,       // Enum: 'none' | 'insulin' | 'oral' | 'other'
  medicationFrequency: String,       // Enum: 'daily' | 'occasionally' | 'none'

  // Metadata
  lastPromptShown:     Date,         // When the last data collection card was shown
  promptsDismissed:    Number,       // How many times user dismissed prompts
  profileCompleteness: Number,       // 0–100 percentage
  createdAt:           Date,
  updatedAt:           Date
}
```

**Mongoose Schema:**

```typescript
const UserHealthProfileSchema = new Schema<IUserHealthProfile>(
  {
    userId:              { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firebaseUid:         { type: String, required: true, unique: true, index: true },

    // Lifestyle
    activityLevel:       { type: String, enum: ['low', 'medium', 'high'] },
    exerciseFrequency:   { type: String, enum: ['rare', 'moderate', 'frequent'] },
    sleepQuality:        { type: Number, min: 1, max: 5 },
    stressLevel:         { type: Number, min: 1, max: 5 },
    mealPreference:      { type: String, enum: ['home_cooked', 'processed', 'mixed'] },

    // Medication
    onMedication:        { type: Boolean, default: false },
    medicationCategory:  { type: String, enum: ['none', 'insulin', 'oral', 'other'], default: 'none' },
    medicationFrequency: { type: String, enum: ['daily', 'occasionally', 'none'], default: 'none' },

    // Metadata
    lastPromptShown:     { type: Date },
    promptsDismissed:    { type: Number, default: 0 },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);
```

#### 4. Prediction Model (`PredictionAnalysis`)

Stores ML prediction results per user.

```javascript
// backend/src/models/PredictionAnalysis.ts
{
  userId:           ObjectId,     // Ref → User
  firebaseUid:      String,       // Indexed
  predictedGlucose: Number,       // Predicted glucose value
  riskLevel:        String,       // Enum: 'normal' | 'elevated' | 'critical'
  confidence:       Number,       // 0–1 model confidence score
  features:         Object,       // Snapshot of input features used
  modelVersion:     String,       // e.g., 'v1.0'
  createdAt:        Date
}
```

**Mongoose Schema:**

```typescript
const PredictionAnalysisSchema = new Schema<IPredictionAnalysis>(
  {
    userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    firebaseUid:      { type: String, required: true, index: true },
    predictedGlucose: { type: Number, required: true },
    riskLevel:        { type: String, enum: ['normal', 'elevated', 'critical'], required: true },
    confidence:       { type: Number, min: 0, max: 1 },
    features:         { type: Schema.Types.Mixed },
    modelVersion:     { type: String, default: 'v1.0' },
  },
  { timestamps: true }
);
```

---

## Progressive Data Collection Strategy

The system uses **progressive data collection** — non-essential attributes are collected over time through optional dashboard prompts. This reduces onboarding friction while enabling richer data for ML.

### Collection Triggers

| Trigger | Card Shown | Data Collected |
|---------|------------|----------------|
| User logs **3–5 glucose readings** | Card 1: "Personalize Insights" | Activity level, meal preference, medication (yes/no) |
| User answers **"Yes" to medication** | Card 2: "Medication Info" | Medication category, frequency |
| **Weekly/Monthly** interval | Card 3: "Lifestyle Check-In" | Exercise frequency, sleep quality (1–5), stress level (1–5) |

### Design Principles for Prompts

- **Dismissible**: Users can close without submitting
- **Non-blocking**: App is fully functional without completing prompts
- **Persistent only on submit**: Data saved only when user clicks submit
- **Frequency-limited**: Don't show the same prompt more than once per period
- **Progressive**: Cards build on each other — later cards appear as more data is logged

---

## Dashboard Cards Specification

### Card 1: "Help Us Personalize Your Insights" 🟦

**Trigger**: Shown after user has logged 3–5 glucose readings.

| Field | Type | Options |
|-------|------|---------|
| Activity Level | Select | Low / Medium / High |
| Typical Meal Type | Select | Home-cooked / Processed / Mixed |
| On Medication? | Toggle | Yes / No |

**Behavior:**
- Appears as an optional card on the dashboard
- Has a dismiss (X) button — increments `promptsDismissed` counter
- On submit → saves to `UserHealthProfile` collection
- After submission or 3 dismissals → card is hidden permanently

---

### Card 2: "Medication Info (Optional)" 💊

**Trigger**: Shown only if user selected "Yes" to medication in Card 1.

| Field | Type | Options |
|-------|------|---------|
| Medication Category | Select | Insulin / Oral / Other |
| Frequency | Select | Daily / Occasionally |

**Behavior:**
- Appears only after Card 1 is completed with `onMedication: true`
- Dismissible, data saved only on submit
- Updates existing `UserHealthProfile` document

---

### Card 3: "Lifestyle Check-In" 🏃

**Trigger**: Shown weekly or monthly after initial profile is completed.

| Field | Type | Options |
|-------|------|---------|
| Exercise Frequency | Select | Rare / Moderate / Frequent |
| Sleep Quality | Slider/Rating | 1–5 scale |
| Stress Level | Slider/Rating | 1–5 scale |

**Behavior:**
- Recurring card — reappears on a scheduled basis
- Updates `UserHealthProfile` with latest values
- Updates `lastPromptShown` timestamp to prevent repeated prompting

---

### Card 4: "Glucose Prediction" 🔮 *(New — ML Output Card)*

**Trigger**: Shown when a prediction is available (after sufficient data is collected).

| Field | Display |
|-------|---------|
| Predicted Next Glucose | Large number with unit (e.g., "~148 mg/dL") |
| Risk Level | Color-coded badge: green (normal), yellow (elevated), red (critical) |
| Confidence | Progress bar or percentage |
| Tip | Brief actionable recommendation based on prediction |

**Behavior:**
- Read-only display card (no user input)
- Refreshed when user logs a new glucose reading
- Tapping the card navigates to a detailed insights/analysis page

---

### Card 5: "Weekly Trend Summary" 📊 *(New — Analytics Card)*

**Trigger**: Shown when user has 7+ readings.

| Field | Display |
|-------|---------|
| Trend Direction | ↑ Rising / → Stable / ↓ Declining |
| Average vs Previous Week | Comparison with percentage change |
| Most Common Risk Period | e.g., "Post-lunch readings tend to spike" |
| Recommendation | Contextual tip |

**Behavior:**
- Read-only card computed by backend analytics
- Updates weekly

---

## ML Pipeline

### Dual-Dataset Strategy

The ML system uses **three complementary approaches** to provide meaningful glucose insights:

| Approach | Dataset | Purpose | Model | Output |
|----------|---------|---------|-------|--------|
| **Risk Classification** | Pima Indians Diabetes Dataset (external) | Baseline diabetes risk assessment | Random Forest + Logistic Regression | Risk level (normal / elevated / critical) |
| **Temporal Glucose Prediction** | OhioT1DM Dataset (external) | 30-minute-ahead glucose forecasting | Gradient Boosting Regressor | Predicted glucose value + direction |
| **Trend Prediction** | User-logged glucose readings (in-app) | Real-time directional trend estimation | Statistical regression + contextual adjustments | Direction (rising / stable / dropping) + predicted next value |

#### Why Three Approaches?

The Pima dataset contains **static diagnostic features** (glucose concentration, BMI, insulin levels, age, pregnancy history) collected at a single point in time. These features are valuable for estimating overall diabetes risk but are **insufficient for real-time glucose management** because they lack:

- **Temporal context** — no time-series of readings, no day-of-week or hour-of-day patterns
- **Behavioural context** — no meal timing, medication schedules, or physical activity data
- **Individual variability** — the model generalises across a population and cannot adapt to a single user's patterns

Real-time glucose management requires **temporal modelling** — understanding how a user's glucose changes over time, what events precede spikes or drops, and how medication or meals influence direction. This is addressed by the **trend prediction** pipeline, which operates on the user's own logged data and applies contextual adjustments for:

- Meal proximity (time since last meal)
- Medication timing (insulin, oral medications)
- Activity level (recent exercise or sedentary behaviour)
- Circadian patterns (dawn phenomenon, nighttime stabilisation)

> **Summary**: The Pima model answers *"What is this user's overall risk profile?"*, the OhioT1DM model answers *"What glucose value should we expect in 30 minutes based on CGM + context?"*, and the trend model answers *"Where is this user's glucose heading in the next 1–2 hours based on their own logged data?"*

---

### Dataset 1: Pima Indians Diabetes Dataset (Risk Classification)

| Feature | Description |
|---------|-------------|
| `Pregnancies` | Number of pregnancies |
| `Glucose` | Plasma glucose concentration |
| `BloodPressure` | Diastolic blood pressure (mm Hg) |
| `SkinThickness` | Triceps skin fold thickness (mm) |
| `Insulin` | 2-Hour serum insulin (mu U/ml) |
| `BMI` | Body mass index |
| `DiabetesPedigreeFunction` | Diabetes pedigree function |
| `Age` | Age in years |
| `Outcome` | 0 (no diabetes) / 1 (diabetes) |

> **Justification**: Small, clean, widely cited, and suitable for a capstone-level risk classification model. Used for initial training and validation — not for real-time glucose direction prediction.

### Dataset 2: OhioT1DM Dataset (Temporal Glucose Prediction)

**Citation**: Marling C, Bunescu R. The OhioT1DM Dataset for Blood Glucose Level Prediction: Update 2020. CEUR Workshop Proc. 2020 Sep;2675:71-74. PMID: 33584164; PMCID: PMC7881904.

The OhioT1DM dataset provides **8 weeks of continuous glucose monitor (CGM) data** from 6 Type 1 Diabetes patients along with rich contextual information recorded every 5 minutes.

#### Patient Overview

| Patient ID | Weight (kg) | Insulin Type | Training Readings | Test Readings |
|------------|-------------|--------------|-------------------|---------------|
| 559 | 99 | Novalog | 10,796 | 2,514 |
| 563 | — | Novalog | 12,124 | 2,570 |
| 570 | — | Novalog | 10,982 | 2,745 |
| 575 | — | Novalog | 11,866 | 2,590 |
| 588 | — | Novalog | 12,640 | 2,791 |
| 591 | — | Novalog | 10,847 | 2,760 |

#### XML Data Sections

| Section | Description | Typical Count |
|---------|-------------|---------------|
| `glucose_level` | CGM readings every 5 minutes | ~10,000+ |
| `finger_stick` | Manual blood glucose check | ~170 |
| `basal` | Basal insulin rate | ~160 |
| `temp_basal` | Temporary basal adjustments | ~30 |
| `bolus` | Bolus insulin doses | ~150 |
| `meal` | Meal events with carb count | ~150 |
| `sleep` | Sleep events with quality (1–3) | ~40 |
| `exercise` | Exercise with intensity/duration | ~20 |
| `basis_heart_rate` | Wristband heart rate | ~12,000 |
| `basis_steps` | Step count | ~12,000 |
| `basis_skin_temperature` | Skin temperature | ~12,000 |
| `basis_gsr` | Galvanic skin response | ~12,000 |
| `hypo_event` | Hypoglycaemic episodes | ~5–10 |

#### Temporal Feature Vector (26 features per sample)

| Feature Group | Features | Count |
|---------------|----------|-------|
| **Glucose history** | Last 12 normalized CGM values (60-min lookback) | 12 |
| **Glucose stats** | Current glucose, slope, std deviation | 3 |
| **Time encoding** | Hour (sin/cos), day of week | 3 |
| **Meal context** | Minutes since last meal, carbs in last meal | 2 |
| **Insulin context** | Minutes since last bolus, last bolus dose | 2 |
| **Activity** | Recent exercise flag (within 2h) | 1 |
| **Sleep** | Recent sleep flag (within 30min) | 1 |
| **Physiology** | Average heart rate (lookback window) | 1 |
| **Movement** | Steps in last hour | 1 |

**Target**: Glucose value 6 steps (30 minutes) into the future.

#### Model Performance

| Metric | Training | Test |
|--------|----------|------|
| **MAE** | 13.71 mg/dL | 15.65 mg/dL |
| **RMSE** | 19.19 mg/dL | 22.53 mg/dL |
| **R²** | 0.8995 | 0.8663 |
| **Within ±20 mg/dL** | — | 73.0% |
| **Within ±40 mg/dL** | — | 92.9% |

> **How it complements Pima**: The Pima model uses static diagnostic features to assess overall risk. The OhioT1DM model uses temporally rich CGM data with contextual features (meals, insulin, exercise, heart rate, sleep) to predict what glucose will be in 30 minutes — a capability the Pima model cannot provide. Together, they offer both long-term risk context and short-term actionable prediction.

### Dataset 3: User-Logged Glucose Data (Trend Prediction)

| Feature | Source | Type |
|---------|--------|------|
| Recent glucose values | `GlucoseReading.value` (last N readings) | Float array |
| Reading type | `GlucoseReading.readingType` | Categorical |
| Hour of day | Timestamp of reading | Integer 0–23 |
| Day of week | Timestamp of reading | Integer 0–6 |
| Medication taken | `GlucoseReading.medicationTaken` | Boolean |
| Meal context | `GlucoseReading.mealContext` | String (optional) |
| Activity context | `GlucoseReading.activityContext` | String (optional) |
| Time since last meal | Derived from logs | Float (hours) |
| Activity level | `UserHealthProfile.activityLevel` | Categorical |

> **Justification**: User-generated temporal data enables directional trend estimation that static features alone cannot provide. The system improves over time as more readings are logged.

### ML Feature Vector (Risk Classification)

When using the Pima-trained model via `POST /predict`, the backend constructs a feature vector from available user data:

| Feature | Source | Default |
|---------|--------|---------|
| `pregnancies` | Not collected in-app | 0 |
| `glucose` | Latest `GlucoseReading.value` | 100 |
| `blood_pressure` | Not collected in-app | 72 |
| `skin_thickness` | Not collected in-app | 29 |
| `insulin` | Not collected in-app | 80 |
| `bmi` | Not collected in-app | 32 |
| `diabetes_pedigree` | Not collected in-app | 0.5 |
| `age` | Derived from `User.dateOfBirth` | 30 |

> **Note**: Many Pima features are not collected in-app. Default values represent population medians from the training set. The risk classification output should be interpreted as a *general indicator* informed primarily by the user's glucose reading and age, not a precise clinical diagnosis.

**Target variable**: `Outcome` (0 = no diabetes, 1 = diabetes → mapped to risk levels).

### Pipeline Steps

```
┌─────────────────────────────────────────────────────────────┐
│              Pipeline 1: Risk Classification (Pima)         │
│                                                             │
│  1. Load Dataset (CSV)                                      │
│  2. Clean Missing Values (median imputation)                │
│  3. Feature Scaling (StandardScaler)                        │
│  4. Split Data (80% train / 20% test, stratified)           │
│  5. Train Models                                            │
│     ├── Logistic Regression (baseline)                      │
│     └── Random Forest Classifier (primary)                  │
│  6. Evaluate (accuracy, precision, recall, F1-score)        │
│  7. Save Model + Scaler (joblib serialization)              │
│  8. Expose via FastAPI POST /predict                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│      Pipeline 2: Temporal Prediction (OhioT1DM)            │
│                                                             │
│  1. Parse XML files (6 patients × training/testing)         │
│  2. Extract sections: CGM, meals, bolus, exercise, sleep,   │
│     heart rate, steps                                       │
│  3. Build temporal feature matrix (26 features/sample)      │
│     ├── 12 normalized lookback glucose values               │
│     ├── Slope, std, current glucose                         │
│     ├── Time encoding (sin/cos hour, day of week)           │
│     ├── Context: meal timing, carbs, bolus, exercise, sleep │
│     └── Physiology: heart rate, steps                       │
│  4. Feature Scaling (StandardScaler)                        │
│  5. Train Gradient Boosting Regressor                       │
│  6. Evaluate (MAE, RMSE, R², per-patient MAE)               │
│  7. Save Model + Scaler (joblib serialization)              │
│  8. Available for enhanced trend prediction                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          Pipeline 3: Trend Prediction (User Data)           │
│                                                             │
│  1. Receive recent glucose readings (min 3)                 │
│  2. Linear regression on recent values (slope)              │
│  3. Rate of change (last 3 readings)                        │
│  4. Acceleration (velocity delta)                           │
│  5. Coefficient of variation (variability)                  │
│  6. Contextual adjustments                                  │
│     ├── Meal proximity (+/- glucose)                        │
│     ├── Medication timing (- glucose)                       │
│     ├── Circadian patterns (dawn, nighttime)                │
│     └── Activity level (- glucose)                          │
│  7. Predict direction + next glucose value                  │
│  8. Confidence scoring (data volume + variability)          │
│  9. Risk alerts + observational recommendation              │
│  10. Expose via FastAPI POST /predict-trend                 │
└─────────────────────────────────────────────────────────────┘
```

### Python Training Script

```
ml/
├── data/
│   ├── diabetes.csv              # Pima dataset
│   └── ohiot1dm/                 # OhioT1DM XML files
│       ├── 559-ws-training.xml
│       ├── 559-ws-testing.xml
│       ├── 563-ws-training.xml
│       ├── 563-ws-testing.xml
│       ├── 570-ws-training.xml
│       ├── 570-ws-testing.xml
│       ├── 575-ws-training.xml
│       ├── 575-ws-testing.xml
│       ├── 588-ws-training.xml
│       ├── 588-ws-testing.xml
│       ├── 591-ws-training.xml
│       └── 591-ws-testing.xml
├── models/
│   ├── glucose_model.joblib      # Pima Random Forest model
│   ├── logistic_model.joblib     # Pima Logistic Regression (baseline)
│   ├── scaler.joblib             # Pima feature scaler
│   ├── ohio_glucose_predictor.joblib  # OhioT1DM GBR model
│   └── ohio_scaler.joblib        # OhioT1DM feature scaler
├── train.py                      # Pima training pipeline
├── train_ohio.py                 # OhioT1DM training pipeline
├── parse_ohio.py                 # OhioT1DM XML parser + feature builder
├── predict.py                    # Prediction helper (Pima)
├── server.py                     # FastAPI server
├── requirements.txt              # Python dependencies
└── README.md                     # ML-specific instructions
```

**`train.py` — High-Level Steps:**

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib

# 1. Load dataset
df = pd.read_csv('data/diabetes.csv')

# 2. Clean missing values (replace 0s with NaN for physiological columns, then impute)
cols_with_zeros = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
df[cols_with_zeros] = df[cols_with_zeros].replace(0, np.nan)
df.fillna(df.median(), inplace=True)

# 3. Features and target
X = df.drop('Outcome', axis=1)
y = df['Outcome']

# 4. Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 5. Train models
# Baseline: Logistic Regression
lr_model = LogisticRegression(max_iter=1000)
lr_model.fit(X_train, y_train)
lr_pred = lr_model.predict(X_test)

# Primary: Random Forest
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)

# 6. Evaluate
print("=== Logistic Regression ===")
print(classification_report(y_test, lr_pred))

print("=== Random Forest ===")
print(classification_report(y_test, rf_pred))

# 7. Save best model
joblib.dump(rf_model, 'models/glucose_model.joblib')
print("Model saved to models/glucose_model.joblib")
```

---

## FastAPI Prediction Server

The Python FastAPI server loads the trained model and exposes two prediction endpoints:
- `POST /predict` — Pima-based risk classification
- `POST /predict-trend` — User-data-driven glucose trend prediction

**`server.py` (Risk Classification Endpoint):**

```python
@app.post("/predict", response_model=PredictionOutput)
def predict(input_data: PredictionInput):
    result = predict_risk(
        pregnancies=input_data.pregnancies,
        glucose=input_data.glucose,
        blood_pressure=input_data.blood_pressure,
        skin_thickness=input_data.skin_thickness,
        insulin=input_data.insulin,
        bmi=input_data.bmi,
        diabetes_pedigree=input_data.diabetes_pedigree,
        age=input_data.age,
    )
    return PredictionOutput(**result)
```

**`server.py` (Trend Prediction Endpoint):**

```python
@app.post("/predict-trend", response_model=TrendPredictionOutput)
def predict_trend(input_data: TrendPredictionInput):
    # Statistical trend analysis on recent readings
    # + contextual adjustments (meal, medication, time-of-day, activity)
    # Returns: direction, predictedNextGlucose, confidence, factors, riskAlert
```

**Recommendation Language**: All server-generated text uses **observational, non-directive language** (see Clinical Language Guidelines below).

**Run:** `uvicorn server:app --host 0.0.0.0 --port 8000`

---

## Node.js Backend Integration

The Express backend acts as a proxy between the frontend and the Python ML server.

### New API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/predict` | Proxy prediction request to FastAPI |
| `GET` | `/api/predictions?firebaseUid=xxx` | Get prediction history for user |
| `POST` | `/api/health-profile` | Create or update user health profile |
| `GET` | `/api/health-profile?firebaseUid=xxx` | Get user health profile |
| `POST` | `/api/meals` | Log a meal |
| `GET` | `/api/meals?firebaseUid=xxx` | Get meal history |
| `POST` | `/api/activities` | Log an activity |
| `GET` | `/api/activities?firebaseUid=xxx` | Get activity history |
| `GET` | `/api/analytics/trends?firebaseUid=xxx` | Get weekly trend analysis |
| `POST` | `/api/medications` | Create/update a medication |
| `GET` | `/api/medications?firebaseUid=xxx` | Get user's medications |
| `POST` | `/api/medications/log` | Log a medication dose |
| `GET` | `/api/medications/injection-site?firebaseUid=xxx` | Get injection site recommendation |
| `GET` | `/api/notifications?firebaseUid=xxx` | Get notifications |
| `GET` | `/api/notifications/unread-count?firebaseUid=xxx` | Get unread notification count |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read |

### Prediction Proxy (Node.js → FastAPI)

```typescript
// backend/src/controllers/predict.controller.ts
import axios from 'axios';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export const getPrediction = async (req, res) => {
    try {
        const { firebaseUid } = req.body;

        // 1. Fetch user data from MongoDB
        const user = await User.findOne({ firebaseUid });
        const latestReading = await GlucoseReading.findOne({ firebaseUid }).sort({ recordedAt: -1 });
        const healthProfile = await UserHealthProfile.findOne({ firebaseUid });

        // 2. Build feature vector
        const features = {
            pregnancies: 0,
            glucose: latestReading?.value || 100,
            blood_pressure: 72,
            skin_thickness: 29,
            insulin: 80,
            bmi: 32,
            diabetes_pedigree: 0.5,
            age: calculateAge(user?.dateOfBirth),
        };

        // 3. Call FastAPI
        const mlResponse = await axios.post(`${ML_API_URL}/predict`, features);

        // 4. Save prediction to DB
        const prediction = await PredictionAnalysis.create({
            userId: user._id,
            firebaseUid,
            predictedGlucose: latestReading?.value,
            riskLevel: mlResponse.data.risk_level,
            confidence: mlResponse.data.confidence,
            features,
            modelVersion: 'v1.0',
        });

        // 5. Return result
        res.json({
            prediction: mlResponse.data,
            savedPrediction: prediction,
        });
    } catch (error) {
        res.status(500).json({ error: 'Prediction failed' });
    }
};
```

### Environment Variable

Add to backend `.env`:

```
ML_API_URL=http://localhost:8000
```

For production (if deploying FastAPI on Render/Railway):

```
ML_API_URL=https://bluely-ml.onrender.com
```

---

## Frontend Integration

### New Dashboard Components

```
frontend/src/components/dashboard/
├── InsightsCard.tsx              # Card 1: Personalize Insights
├── MedicationCard.tsx            # Card 2: Medication Info
├── LifestyleCheckIn.tsx          # Card 3: Lifestyle Check-In
├── PredictionCard.tsx            # Card 4: Glucose Prediction (ML output)
├── WeeklyTrendCard.tsx           # Card 5: Weekly Trend Summary
```

### Dashboard Page — Card Rendering Logic

```tsx
// Pseudocode for dashboard card rendering
function Dashboard() {
    const { readingsCount } = useGlucoseData();
    const { healthProfile } = useHealthProfile();
    const { prediction } = usePrediction();

    return (
        <>
            {/* Existing cards */}
            <StatsGrid ... />
            <WeeklyChart ... />
            <RecentReadings ... />
            <MoodTracker ... />

            {/* Progressive collection cards */}
            {readingsCount >= 3 && !healthProfile?.activityLevel && (
                <InsightsCard />
            )}

            {healthProfile?.onMedication && !healthProfile?.medicationCategory && (
                <MedicationCard />
            )}

            {healthProfile?.profileCompleteness > 50 && shouldShowCheckIn(healthProfile) && (
                <LifestyleCheckIn />
            )}

            {/* ML output cards */}
            {prediction && (
                <PredictionCard prediction={prediction} />
            )}

            {readingsCount >= 7 && (
                <WeeklyTrendCard />
            )}
        </>
    );
}
```

---

## Model Evaluation

### Metrics

| Metric | Logistic Regression | Random Forest |
|--------|-------------------|---------------|
| **Accuracy** | ~77% | ~80% |
| **Precision** | ~72% | ~78% |
| **Recall** | ~60% | ~70% |
| **F1-Score** | ~65% | ~74% |

> Random Forest was selected as the primary model due to superior performance across all metrics. These are expected results based on the Pima dataset; actual values will be confirmed during training.

### Evaluation Approach

1. **Train-Test Split**: 80/20 stratified split to maintain class balance
2. **Cross-Validation**: 5-fold cross-validation for robust performance estimates
3. **Confusion Matrix**: Visualize true positives, false positives, true negatives, false negatives
4. **ROC-AUC Curve**: Assess model discrimination ability
5. **Feature Importance**: Rank features by contribution to predictions (Random Forest built-in)

---

## Training Results and Interpretation

### Actual Training Output

The model was trained on the Pima Indians Diabetes Dataset with the following results:

```
Dataset shape: (768, 9)
Class distribution: 500 No Diabetes, 268 Diabetes

Training set: 614 samples
Test set: 154 samples

Random Forest Results:
- Accuracy: 74%
- Precision: 66% (for Diabetes class)
- Recall: 54% (for Diabetes class)
- F1-Score: 59% (for Diabetes class)

Confusion Matrix:
[[85 15]  # True Negatives: 85, False Positives: 15
 [25 29]] # False Negatives: 25, True Positives: 29

Feature Importance:
- Glucose: 31.65%
- BMI: 17.61%
- Age: 11.36%
- Diabetes Pedigree Function: 11.24%
- Insulin: 7.94%
- Pregnancies: 7.11%
- Blood Pressure: 6.95%
- Skin Thickness: 6.13%
```

### Interpretation

**Model Performance**: The Random Forest achieves 74% accuracy on the test set, outperforming the Logistic Regression baseline (70%). This indicates the model can correctly predict diabetes risk in 3 out of 4 cases.

**Confusion Matrix Analysis**:
- **True Negatives (85)**: Correctly identified healthy individuals
- **False Positives (15)**: Healthy individuals incorrectly flagged as at risk
- **False Negatives (25)**: At-risk individuals missed by the model
- **True Positives (29)**: Correctly identified individuals at risk

The model shows better performance at identifying healthy individuals (85% recall for No Diabetes) than detecting diabetes cases (54% recall for Diabetes), which is common in medical datasets with class imbalance.

**Feature Importance**: Glucose levels are the strongest predictor (32%), followed by BMI (18%) and age (11%). This aligns with medical knowledge that blood sugar, body weight, and age are key diabetes risk factors.

### How Random Forest Creates Patterns

Random Forest is an ensemble learning method that builds multiple decision trees and combines their predictions:

1. **Bootstrap Sampling**: Creates multiple subsets of the training data by random sampling with replacement
2. **Random Feature Selection**: At each split in each tree, only a random subset of features is considered
3. **Decision Tree Construction**: Each tree learns patterns by recursively splitting data based on feature thresholds that maximize information gain
4. **Voting/Averaging**: For classification, trees vote on the outcome; for regression, predictions are averaged

**Pattern Recognition**: The model identifies complex interactions between features. For example:
- High glucose + high BMI + older age → High diabetes risk
- Low glucose + normal BMI + young age → Low risk
- Trees learn non-linear relationships and handle missing data well

**Why It Works**: By combining many "weak learners" (individual trees), Random Forest reduces overfitting and improves generalization to new data.

### OhioT1DM Model Evaluation (Gradient Boosting Regressor)

The OhioT1DM temporal model was trained on 69,147 samples from 6 patients and tested on 15,862 samples:

```
Total training samples: 69,147
Total test samples:     15,862
Feature dimension:      26

=== Test Set ===
  MAE:  15.65 mg/dL
  RMSE: 22.53 mg/dL
  R²:   0.8663

  Within ±20 mg/dL: 73.0%
  Within ±40 mg/dL: 92.9%

=== Per-Patient Test MAE ===
  Patient 559: MAE = 15.84 mg/dL (2,496 samples)
  Patient 563: MAE = 14.24 mg/dL (2,552 samples)
  Patient 570: MAE = 14.65 mg/dL (2,727 samples)
  Patient 575: MAE = 16.81 mg/dL (2,572 samples)
  Patient 588: MAE = 14.85 mg/dL (2,773 samples)
  Patient 591: MAE = 17.50 mg/dL (2,742 samples)
```

#### Interpretation

**Model Performance**: A test MAE of 15.65 mg/dL for 30-minute-ahead prediction is competitive with published results on this dataset. 73% of predictions fall within ±20 mg/dL of actual values, and 92.9% within ±40 mg/dL.

**Per-Patient Variation**: MAE ranges from 14.24 (Patient 563) to 17.50 (Patient 591), reflecting individual glucose variability. This is expected in T1D patients with different lifestyle patterns.

**Clinical Relevance**: A 15 mg/dL average error is within clinically acceptable ranges for glucose trend awareness. The model is suitable for informational trend display but not for therapeutic dosing decisions.

---

## Deployment Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│   Next.js App    │────▶│  Express API     │────▶│  FastAPI (ML)    │
│   (Render)       │     │  (Render)        │     │  (Render)        │
│                  │     │                  │     │                  │
│  - Dashboard     │     │  - User CRUD     │     │  - /predict      │
│  - Cards UI      │     │  - Glucose CRUD  │     │  - /predict-trend│
│  - Prediction    │     │  - Health Profile │     │  - /predict-     │
│    display       │     │  - Proxy to ML   │     │    glucose-30    │
│                  │     │  - Analytics     │     │  - /health       │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                         ┌────────▼─────────┐
                         │                  │
                         │   MongoDB Atlas  │
                         │                  │
                         │  - Users         │
                         │  - GlucoseReadings│
                         │  - Meals         │
                         │  - Medications   │
                         │  - MedicationLogs│
                         │  - Activities    │
                         │  - HealthProfiles│
                         │  - Predictions   │
                         │  - ForecastLogs  │
                         │  - Notifications │
                         └──────────────────┘
```

### Deployment Platforms

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Render (Static Site) | Next.js static export |
| Backend API | Render (Web Service) | Node.js Express server |
| ML Server | Render (Web Service) | Python FastAPI + pre-trained models |
| Database | MongoDB Atlas | Shared M0 cluster (free tier) |
| Auth | Firebase | Google Cloud hosted |

### Render Blueprint

The project includes a `render.yaml` blueprint that can auto-configure all three services. Push to GitHub and connect the repo to Render — it will detect the blueprint automatically.

---

### ML Service — Render Deployment (Step-by-Step)

#### Prerequisites

- Pre-trained model files committed to `ml/models/` (`.joblib` files, ~2.7 MB total)
- Python 3.12 specified via `ml/.python-version` or `PYTHON_VERSION` env var

#### Why Python 3.12?

Render defaults to the latest Python (currently 3.14). Scientific packages like `pandas`, `numpy`, and `scikit-learn` use compiled C/Cython extensions that require explicit support for each Python version. **Python 3.14 is too new** — `pandas 2.x` fails to compile its C++ aggregation modules on 3.14 (`CYTHON_UNUSED [[maybe_unused]]` attribute error). Python 3.12 is the latest version with full support from all dependencies.

#### Step 1: Ensure model files are in git

The `.gitignore` excludes `ml/data/` (training datasets, ~27 MB) but **includes** `ml/models/` (pre-trained models, ~2.7 MB). Verify:

```bash
git add ml/models/*.joblib
git status  # Should show the .joblib files as staged
git commit -m "Add pre-trained ML models for deployment"
git push
```

> **Note**: Training datasets (`ml/data/`) are NOT committed to git. They are only needed locally for retraining. The deployed server loads pre-trained `.joblib` files directly.

#### Step 2: Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect your GitHub repo (`Simeon-Azeh/bluely_main`)
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `bluely-ml` |
| **Root Directory** | `ml` |
| **Runtime** | Python |
| **Build Command** | `chmod +x build.sh && ./build.sh` |
| **Start Command** | `gunicorn server:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120` |
| **Plan** | Free (or Starter for better performance) |

#### Step 3: Set environment variables

| Variable | Value | Notes |
|----------|-------|-------|
| `PYTHON_VERSION` | `3.12.7` | **Critical** — prevents the pandas build failure |
| `PORT` | `8000` | Render injects this automatically on paid plans |

#### Step 4: Verify deployment

After deploy completes, test the health endpoint:

```bash
curl https://bluely-ml.onrender.com/health
# Expected: {"status":"ok","models":{"pima":"loaded","ohio":"loaded"}}
```

#### ML Build Script (`ml/build.sh`)

The build script handles installation and optional model training:

```bash
#!/usr/bin/env bash
set -o errexit
pip install --upgrade pip
pip install -r requirements.txt

# If model files are missing (e.g., gitignore issue), retrain from data
if [ ! -f "models/glucose_model.joblib" ]; then
    python train.py      # Only works if data/diabetes.csv exists
fi
if [ ! -f "models/ohio_glucose_predictor.joblib" ]; then
    python train_ohio.py # Only works if data/ohiot1dm/*.xml exists
fi
```

> On Render, the model files come from git. The build script is a safety net — if models are somehow missing AND training data is available, it retrains.

---

### Backend Service — Render Deployment

#### Step 1: Create a Web Service on Render

| Setting | Value |
|---------|-------|
| **Name** | `bluely-backend` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npx tsc` |
| **Start Command** | `node dist/server.js` |
| **Plan** | Free |

#### Step 2: Set environment variables

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20.11.0` |
| `MONGODB_URI` | `mongodb+srv://...` (from MongoDB Atlas) |
| `ML_API_URL` | `https://bluely-ml.onrender.com` (your ML service URL) |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `PORT` | `5000` |

---

### Frontend Service — Render Deployment

#### Option A: Static Site (recommended for free tier)

Requires adding `output: 'export'` to `next.config.ts`:

| Setting | Value |
|---------|-------|
| **Name** | `bluely-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `out` |

#### Option B: Web Service (supports SSR)

| Setting | Value |
|---------|-------|
| **Name** | `bluely-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

#### Environment variables

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20.11.0` |
| `NEXT_PUBLIC_API_URL` | `https://bluely-backend.onrender.com/api` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID |

---

### Deployment Order

Deploy services in this order (each depends on the previous):

1. **ML Service** (`bluely-ml`) — deploy first, note the URL
2. **Backend** (`bluely-backend`) — set `ML_API_URL` to the ML service URL
3. **Frontend** (`bluely-frontend`) — set `NEXT_PUBLIC_API_URL` to the backend URL

### Free Tier Considerations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Services spin down after 15 min inactivity | First request after idle takes 30–60s | Users see a loading state; acceptable for demo/capstone |
| 750 free hours/month shared across all services | 3 services × 24h = 2,160h needed vs 750h available | Services sleep when unused; sufficient for low traffic |
| No persistent disk on free tier | Model files must come from git, not filesystem | Models are committed to `ml/models/` (~2.7 MB) |

---

## File & Folder Structure

### New files to add to the project:

```
bluely_main/
├── render.yaml                            # Render blueprint (3 services)
├── ml/                                    # ML module
│   ├── .python-version                    # Pin Python 3.12.7 for Render
│   ├── build.sh                           # Render build script
│   ├── data/                              # Training data (NOT in git)
│   │   ├── diabetes.csv                   # Pima Indians dataset
│   │   └── ohiot1dm/                      # OhioT1DM XML dataset
│   │       ├── 559-ws-training.xml
│   │       ├── 559-ws-testing.xml
│   │       ├── ... (6 patients × 2 files)
│   │       └── 591-ws-testing.xml
│   ├── models/                            # Pre-trained models (IN git, ~2.7 MB)
│   │   ├── glucose_model.joblib           # Pima Random Forest
│   │   ├── logistic_model.joblib          # Pima Logistic Regression
│   │   ├── scaler.joblib                  # Pima feature scaler
│   │   ├── ohio_glucose_predictor.joblib  # OhioT1DM GBR model
│   │   └── ohio_scaler.joblib             # OhioT1DM feature scaler
│   ├── train.py                           # Pima training pipeline
│   ├── train_ohio.py                      # OhioT1DM training pipeline
│   ├── parse_ohio.py                      # OhioT1DM XML parser
│   ├── predict.py                         # Prediction utility (Pima)
│   ├── server.py                          # FastAPI prediction server
│   ├── requirements.txt                   # Python dependencies (flexible versions)
│   └── README.md                          # ML setup + deploy instructions
│
├── backend/src/
│   ├── models/
│   │   ├── Meal.ts                        # NEW — Meal model
│   │   ├── Activity.ts                    # NEW — Activity model
│   │   ├── UserHealthProfile.ts           # NEW — Health profile model
│   │   ├── PredictionAnalysis.ts          # NEW — Prediction model
│   │   └── index.ts                       # UPDATED — export new models
│   ├── controllers/
│   │   ├── meal.controller.ts             # NEW — Meal CRUD
│   │   ├── activity.controller.ts         # NEW — Activity CRUD
│   │   ├── healthProfile.controller.ts    # NEW — Health profile CRUD
│   │   └── predict.controller.ts          # NEW — ML prediction proxy
│   └── routes/
│       ├── meal.routes.ts                 # NEW
│       ├── activity.routes.ts             # NEW
│       ├── healthProfile.routes.ts        # NEW
│       └── predict.routes.ts              # NEW
│
├── frontend/src/
│   └── components/dashboard/
│       ├── InsightsCard.tsx               # NEW — Card 1
│       ├── MedicationCard.tsx             # NEW — Card 2
│       ├── LifestyleCheckIn.tsx           # NEW — Card 3
│       ├── PredictionCard.tsx             # NEW — Card 4
│       └── WeeklyTrendCard.tsx            # NEW — Card 5
```

### Python Dependencies (`ml/requirements.txt`)

```
pandas==2.2.0
numpy==1.26.4
scikit-learn==1.4.0
joblib==1.3.2
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
```

---

## Methodology

The project follows a **mixed software engineering and data-driven methodology**:

1. A full-stack web application was developed to collect blood glucose and lifestyle data from users.
2. Data analysis and predictive modeling were implemented using Python-based machine learning techniques.
3. Publicly available diabetes datasets (Pima Indians) were used for initial model training.
4. The system is designed to incorporate user-generated data over time via progressive collection.
5. Model performance was evaluated using standard classification metrics (accuracy, precision, recall, F1).
6. The Random Forest model demonstrated superior performance and was selected for deployment.

### Exploratory Data Analysis

- Statistical summaries of glucose distributions by reading type
- Correlation analysis between meals, activity, and glucose levels
- Time-of-day patterns in glucose readings
- Visualization of target range adherence trends

---

## Clinical Language Guidelines

All user-facing text generated by the ML system, backend controllers, and frontend components follows **safe, observational language patterns**. The system does **not** provide medical advice, instructions, or diagnoses.

### Core Principles

1. **Observational, not instructional** — describe what the data shows, never tell users what to do medically
2. **Trend-based, not absolute** — focus on direction and patterns, not definitive values
3. **Suggestive, not prescriptive** — use "consider", "may", "appears to" rather than "you should", "you must"
4. **Provider-referencing** — escalate to healthcare providers for clinical action
5. **Disclaimer-backed** — every insight surface includes a visible disclaimer

### Language Categories

| Category | Pattern | Example |
|----------|---------|---------|
| **Trend-based** | Describe direction without cause attribution | "An upward trend is detected in recent readings" |
| **Risk-oriented** | Flag elevated probability, not certainty | "Some factors suggest an elevated risk pattern" |
| **Influence-based** | Note correlation, not causation | "Meal timing appears to influence post-meal readings" |
| **Comparative** | Reference the user's own baseline | "Higher than your 7-day average for this period" |
| **Suggestion** | Defer to provider for action | "Consider discussing this pattern with your healthcare provider" |
| **Contextual** | Note contributing factors neutrally | "Recent meal detected — glucose often rises in this window" |

### Prohibited Language

| Do NOT use | Use instead |
|------------|-------------|
| "You should eat / take medication / exercise" | "Consider reviewing this pattern with your provider" |
| "Your glucose is bad / dangerous" | "This reading is above / below the target range" |
| "Take action immediately" | "Please follow your provider's guidance for [low/high] readings" |
| "This means you have diabetes" | "Multiple factors indicate a higher risk profile" |
| "Eat a snack to bring your levels up" | "Logging follow-up readings can help identify patterns" |

### Disclaimer Text

Every insight-bearing surface (dashboard cards, notifications, glucose feedback) must include:

> **"Insights are based on logged data patterns and are not medical instructions."**

This appears as a `text-[10px] text-gray-400 text-center` footer on frontend cards and in notification descriptions.

### Example: Full Insight Card Text

> **Pattern Detected**: Post-meal readings show higher values than other periods this week.
>
> Your weekly average is trending upward compared to last week. Reviewing meal and activity logs may help identify contributing patterns.
>
> *Insights are based on logged data patterns and are not medical instructions.*

---

## Future Enhancements

| Enhancement | Description | Priority | Status |
|-------------|-------------|----------|--------|
| **Trend Prediction** | Statistical trend analysis on user glucose data | High | ✅ Implemented |
| **Medication Tracking** | Full medication CRUD + injection site rotation | High | ✅ Implemented |
| **Notifications System** | In-app alerts for out-of-range readings + predictions | High | ✅ Implemented |
| **Clinical Language** | Observational, non-directive text across all insights | High | ✅ Implemented |
| **User Data Fine-Tuning** | Retrain model with aggregated app user data | High | Planned |
| **Time-Series Forecasting** | Use LSTM/GRU for sequential glucose prediction | Medium | Planned |
| **Personalized Models** | Per-user model fine-tuning with transfer learning | Medium | Planned |
| **A1C Estimation** | Estimate HbA1c from average glucose readings | Medium | Planned |
| **Anomaly Detection** | Alert users on unusual glucose patterns | High | Planned |
| **Hardware Integration** | Bluetooth glucometer data import | Low | Planned |
| **Offline ML** | TensorFlow.js for client-side prediction | Low | Planned |
| **Meal Image Recognition** | Camera-based carb estimation | Low | Planned |

---

*Document version: 2.0 — Updated with dual-dataset strategy, trend prediction pipeline, and clinical language guidelines*
*Project: Bluely — Diabetes Self-Management System*
