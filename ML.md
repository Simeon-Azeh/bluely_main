## App Data Model

## User 
{
  "userId": "string",
  "age": 25,
  "gender": "male",
  "diabetesType": "Type 1 | Type 2 | None",
  "createdAt": "date"
}

## Glucose Reading 

{
  "userId": "string",
  "glucoseLevel": 145,
  "readingType": "fasting | post-meal",
  "timestamp": "date"
}

## Meal 

{
  "userId": "string",
  "carbsEstimate": 60,
  "mealType": "breakfast | lunch | dinner",
  "timestamp": "date"
}

## Activity 

{
  "userId": "string",
  "activityLevel": "low | medium | high",
  "durationMinutes": 30,
  "timestamp": "date"
}

## Prediction Analysis 

{
  "userId": "string",
  "predictedGlucose": 160,
  "riskLevel": "normal | elevated | critical",
  "modelVersion": "v1.0",
  "createdAt": "date"
}

ML Feature Model (what Python uses)

## ML dataset

Feature	Description
age	User age
glucose_prev	Last glucose reading
carbs	Meal carbs
activity	Encoded (0,1,2)
reading_type	Encoded
hour_of_day	Time
target	Glucose level

This is my “data model” for ML

Recommended (Simple & Accepted)

## Pima Indians Diabetes Dataset (UCI / Kaggle)

Why?

Small

Clean

Widely cited

Perfect for capstone

Target:

Predict diabetes risk or glucose level



External dataset used for initial training and validation before fine-tuning with app-collected data.

This is what your Python code will do:

Load dataset

Clean missing values

Select features

Split data (train/test)

Train model

Evaluate accuracy

Save model

Expose prediction function

Create a Python machine learning pipeline using pandas and scikit-learn.
Steps:
1. Load a CSV diabetes dataset
2. Clean missing values
3. Encode categorical variables
4. Split into train and test sets
5. Train a RandomForestClassifier
6. Evaluate accuracy, precision, recall
7. Save the trained model using joblib
Use clear comments and beginner-friendly code.

Create a FastAPI server that loads a trained ML model and exposes a POST /predict endpoint that accepts JSON input and returns a prediction.

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS

### Backend
- Node.js
- Express
- MongoDB
- Firebase Authentication

### Machine Learning & Analytics
- Python
- Pandas
- NumPy
- Scikit-learn
- FastAPI

## AI & Data Analysis
The system integrates a machine learning module for analyzing blood glucose trends and predicting risk levels. Initial training uses publicly available diabetes datasets, with plans to incorporate user-generated data over time.

## Offline Support
The application supports offline data entry using local storage. Data is synchronized with the backend when internet connectivity is restored.



## Methodology

The project follows a mixed software engineering and data-driven methodology. A full-stack web application was developed to collect blood glucose and lifestyle data from users. Data analysis and predictive modeling were implemented using Python-based machine learning techniques. Publicly available diabetes datasets were used for initial model training, after which the system is designed to incorporate user-generated data. Model performance was evaluated using standard classification metrics.

## Data Analysis

Exploratory data analysis was conducted to identify patterns and relationships between blood glucose levels and contributing factors such as meals, physical activity, and time of measurement. Statistical summaries and visualizations were generated to understand data distributions and correlations before model training.

## Model Evaluation

Multiple machine learning algorithms were evaluated, including Logistic Regression and Random Forest classifiers. Model performance was assessed using accuracy, precision, recall, and F1-score. The Random Forest model demonstrated superior performance and was selected for deployment.


Example Dashboard Cards (What You Add)
🟦  Card 1: “Help us personalize your insights”

Shown after 3–5 glucose logs

Fields

Activity level (low / medium / high)

Typical meal type (home-cooked / processed)

Medication? (Yes / No)

## Card 2: “Medication info (Optional)”

Shown only if user says “Yes” to medication

Fields

Medication category (Insulin / Oral / Other)

Frequency (Daily / Occasionally)

Card 3: “Lifestyle check-in”

Monthly or weekly

Fields

Exercise frequency

Sleep quality (1–5)

Stress level (1–5)

This is ML feature gold without being invasive.

Add a dashboard card component that optionally collects lifestyle and medication-related information after initial onboarding.
The card should:
- Be dismissible
- Save data only if the user submits
- Not block app usage
- Store values in MongoDB
Use clear React components and simple validation.
The system uses progressive data collection, where non-essential attributes are collected over time through optional dashboard prompts. This approach reduces onboarding friction while enabling richer data for longitudinal analysis and machine learning.”

{
  "activityLevel": "low | medium | high",
  "medicationCategory": "none | insulin | oral",
  "exerciseFrequency": "rare | moderate | frequent",
  "sleepQuality": 1,
  "stressLevel": 3
}

Marling C, Bunescu R. The OhioT1DM Dataset for Blood Glucose Level Prediction: Update 2020. CEUR Workshop Proc. 2020 Sep;2675:71-74. PMID: 33584164; PMCID: PMC7881904.