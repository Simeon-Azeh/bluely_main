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

### Dataset: Pima Indians Diabetes Dataset

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

> **Justification**: Small, clean, widely cited, and perfect for a capstone project. External dataset used for initial training and validation before fine-tuning with app-collected data.

### ML Feature Vector (App Data)

When using app-collected data, the feature vector sent to the model:

| Feature | Source | Encoding |
|---------|--------|----------|
| `age` | User profile (`dateOfBirth`) | Integer |
| `glucose_prev` | Last glucose reading (`GlucoseReading.value`) | Float |
| `carbs` | Meal carbs estimate (`Meal.carbsEstimate`) | Float |
| `activity` | Activity level (`UserHealthProfile.activityLevel`) | Encoded: low=0, medium=1, high=2 |
| `reading_type` | Reading type (`GlucoseReading.readingType`) | Encoded: fasting=0, before_meal=1, after_meal=2, bedtime=3, random=4 |
| `hour_of_day` | Timestamp of reading | Integer 0–23 |
| `sleep_quality` | From health profile | Integer 1–5 |
| `stress_level` | From health profile | Integer 1–5 |
| `on_medication` | From health profile | Binary: 0 or 1 |
| `exercise_frequency` | From health profile | Encoded: rare=0, moderate=1, frequent=2 |

**Target variable**: `glucose_level` (next glucose reading value) or `risk_level` (classification).

### Pipeline Steps

```
┌─────────────────────────────────────────────────────────────┐
│                     ML Pipeline                             │
│                                                             │
│  1. Load Dataset (CSV / MongoDB export)                     │
│  2. Clean Missing Values (median imputation)                │
│  3. Encode Categorical Variables (label encoding)           │
│  4. Feature Selection (correlation analysis)                │
│  5. Split Data (80% train / 20% test, stratified)           │
│  6. Train Models                                            │
│     ├── Logistic Regression (baseline)                      │
│     └── Random Forest Classifier (primary)                  │
│  7. Evaluate (accuracy, precision, recall, F1-score)        │
│  8. Save Model (joblib serialization)                       │
│  9. Expose via FastAPI POST /predict                        │
└─────────────────────────────────────────────────────────────┘
```

### Python Training Script

```
ml/
├── data/
│   └── diabetes.csv              # Pima dataset
├── models/
│   └── glucose_model.joblib      # Trained model artifact
├── notebooks/
│   └── exploration.ipynb         # EDA notebook
├── train.py                      # Training pipeline
├── predict.py                    # Prediction helper
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

The Python FastAPI server loads the trained model and exposes a prediction endpoint.

**`server.py`:**

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="Bluely ML API", version="1.0.0")

# Load model on startup
model = joblib.load("models/glucose_model.joblib")

class PredictionInput(BaseModel):
    pregnancies: float = 0
    glucose: float
    blood_pressure: float = 72
    skin_thickness: float = 29
    insulin: float = 80
    bmi: float = 32
    diabetes_pedigree: float = 0.5
    age: float

class PredictionOutput(BaseModel):
    predicted_risk: int           # 0 = no risk, 1 = at risk
    risk_level: str               # 'normal' | 'elevated' | 'critical'
    confidence: float             # probability
    recommendation: str

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": "loaded"}

@app.post("/predict", response_model=PredictionOutput)
def predict(input_data: PredictionInput):
    try:
        features = np.array([[
            input_data.pregnancies,
            input_data.glucose,
            input_data.blood_pressure,
            input_data.skin_thickness,
            input_data.insulin,
            input_data.bmi,
            input_data.diabetes_pedigree,
            input_data.age,
        ]])

        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0]

        confidence = float(max(probability))

        if prediction == 0:
            risk_level = "normal"
            recommendation = "Your glucose levels look good. Keep maintaining a balanced diet and regular activity."
        elif confidence < 0.7:
            risk_level = "elevated"
            recommendation = "Consider monitoring more frequently and reducing carb intake in your next meal."
        else:
            risk_level = "critical"
            recommendation = "Your predicted glucose is high. Please consult your healthcare provider and review your medication."

        return PredictionOutput(
            predicted_risk=int(prediction),
            risk_level=risk_level,
            confidence=round(confidence, 3),
            recommendation=recommendation,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

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

---

## Deployment Architecture

## Deployment Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│   Next.js App    │────▶│  Express API     │────▶│  FastAPI (ML)    │
│   (Vercel)       │     │  (Render)        │     │  (Render/Railway)│
│                  │     │                  │     │                  │
│  - Dashboard     │     │  - User CRUD     │     │  - /predict      │
│  - Cards UI      │     │  - Glucose CRUD  │     │  - /health       │
│  - Prediction    │     │  - Health Profile │     │  - Model loaded  │
│    display       │     │  - Proxy to ML   │     │    via joblib     │
│                  │     │  - Analytics     │     │                  │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                         ┌────────▼─────────┐
                         │                  │
                         │   MongoDB Atlas  │
                         │                  │
                         │  - Users         │
                         │  - GlucoseReadings│
                         │  - Meals         │
                         │  - Activities    │
                         │  - HealthProfiles│
                         │  - Predictions   │
                         └──────────────────┘
```

### Deployment Platforms

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel | Auto-deploy from GitHub |
| Backend API | Render | Node.js Express server |
| ML Server | Render (or Railway) | Python FastAPI + model file |
| Database | MongoDB Atlas | Shared cluster |
| Auth | Firebase | Google Cloud hosted |

---

## File & Folder Structure

### New files to add to the project:

```
bluely_main/
├── ml/                                    # NEW — ML module
│   ├── data/
│   │   └── diabetes.csv                   # Pima Indians dataset
│   ├── models/
│   │   └── glucose_model.joblib           # Trained model artifact
│   ├── notebooks/
│   │   └── exploration.ipynb              # EDA & visualization notebook
│   ├── train.py                           # Training pipeline script
│   ├── predict.py                         # Prediction utility
│   ├── server.py                          # FastAPI prediction server
│   ├── requirements.txt                   # Python dependencies
│   └── README.md                          # ML setup instructions
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

## Future Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **User Data Fine-Tuning** | Retrain model with aggregated app user data | High |
| **Time-Series Forecasting** | Use LSTM/GRU for sequential glucose prediction | Medium |
| **Personalized Models** | Per-user model fine-tuning with transfer learning | Medium |
| **Hardware Integration** | Bluetooth glucometer data import | Low |
| **Offline ML** | TensorFlow.js for client-side prediction | Low |
| **A1C Estimation** | Estimate HbA1c from average glucose readings | Medium |
| **Anomaly Detection** | Alert users on unusual glucose patterns | High |
| **Meal Image Recognition** | Camera-based carb estimation | Low |

---

*Document version: 1.0 — February 2026*
*Project: Bluely — Diabetes Self-Management System*
