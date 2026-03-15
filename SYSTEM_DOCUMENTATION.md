# Bluely - Complete System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Features Implemented](#features-implemented)
4. [Testing & Verification](#testing--verification)
5. [Deployment](#deployment)

---

## Overview

Bluely is a comprehensive diabetes management system featuring AI-powered glucose prediction, meal tracking, medication logging, and personalized AI insights via "DiaBuddy".

### Core Components
- **Frontend**: React/Next.js with TailwindCSS
- **Backend**: Express.js with TypeScript, MongoDB
- **ML/AI**: Python FastAPI with scikit-learn models and LLM integration
- **Authentication**: Firebase

---

## System Architecture

### 3-Layer Prediction Model
```
Global Model (OhioT1DM/Synthetic Data)
        ↓
Patient Personalization Engine
        ↓
AI Explanation Layer (DiaBuddy)
```

### Safety Architecture
```
Frontend Input → Safety Gate → Missing Input Check → Quick Log → Re-validate → Prediction
```

**Three-Point Validation**:
1. **Backend Service** (`PredictionSafetyService`) - Checks all required fields
2. **Controller Gate** (`predict.controller.ts`) - Returns 422 if incomplete
3. **Middleware** (`validation.ts`) - Field-level input validation

---

## Features Implemented

### Phase 1: Safety Infrastructure
- [x] `predictionSafety.service.ts` - Central validation service
- [x] Safety gates in `predict.controller.ts` 
- [x] `/predict/quick-log` endpoint for rapid data entry
- [x] `validation.ts` middleware with field validators

### Phase 2: Frontend UI Components
- [x] `MissingInputsCard.tsx` - Shows incomplete inputs with quick-log forms
  - Glucose input with validation (20-600 mg/dL)
  - Meal description with Bluely AI carb estimation
  - Manual carb entry fallback
  - Medication and activity quick-logs
  - Brand color integration (#1F2F98)
  
- [x] `PredictionGateway.tsx` - State machine orchestrating prediction flow
  - States: idle → checking → incomplete → **stale-glucose** → fetching → complete/error
  - Handles 422 incomplete responses, routing to `MissingInputsCard` or `StaleContextCard` based on `glucoseIsStale` flag
  - Triggers re-validation after quick-log

- [x] `StaleContextCard.tsx` - Shown when glucose reading is >10 minutes old
  - Always requires a fresh glucose reading before generating a forecast
  - Displays all in-window context records (meal ≤4h, medication ≤6h, activity ≤6h) with timestamps
  - Per-input Keep / Update / None choices — users only re-log what's actually changed
  - "Just ate" branch: full DiaBuddy AI meal carb estimator with food breakdown and +/− adjusters
  - "Just took" branch: fetches saved medications from API, tap-to-select, plus "when taken" time picker
  - "Log Everything Fresh" escape hatch routes back to `MissingInputsCard`
  
- [x] Dashboard integration - Replaced direct API calls with PredictionGateway

### Phase 3: Forecast Display
- [x] `GlucoseForecastCard.tsx` - Shows 30-minute glucose forecast
  - Predicted value + direction (rising/stable/dropping)
  - Confidence percentage
  - Recommendation and risk alerts
  - DiaBuddy AI explanation display
  - 30-minute countdown timer with notifications
  - "Update Forecast" button upon expiration

### Phase 4: AI Integration
- [x] DiaBuddy meal description parsing - Users describe meal, AI estimates carbs
- [x] Missing data explanation generation
- [x] AI insight display on forecast card
- [x] LLM fallback chain: DeepSeek → OpenAI → Ollama → Rule-based

### Phase 5: Testing & Documentation
- [x] Manual testing guides (TESTING_GUIDE.md, QUICK_START_TESTING.md)
- [x] Test documentation with scenarios and verification steps
- [x] Component test structure reference

---

## Testing & Verification

### Quick Start Verification (5 minutes)
1. **Load Dashboard**
   - Click "Generate Forecast" button
   - System checks for complete inputs
   
2. **Missing Data Flow**
   - System shows MissingInputsCard
   - All missing fields displayed by importance (Critical/High/Medium)
   - Red badges on critical fields
   
3. **Quick Logging**
   - Click "Quick Log" on any field
   - For meals: Describe meal → Click "Estimate" → Bluely provides carb estimate
   - Accept estimate or enter manually
   - Click "Save Data & Re-check"
   
4. **Forecast Generation**
   - System re-validates
   - Shows forecast if complete
   - 30-minute countdown displays
   - DiaBuddy explanation visible

### Full Testing Scenarios (30 minutes)
Refer to TESTING_GUIDE.md for 8 detailed end-to-end scenarios covering:
- First-time user setup
- Missing critical inputs
- Glucose + meal quick-log flow
- Medication logging
- Error handling
- Expired forecast behavior

### Expected Responses

**422 - Incomplete Inputs** (Working as intended)
```json
{
  "status": 422,
  "detail": {
    "message": "Cannot generate prediction — missing required inputs...",
    "missingInputs": [
      {
        "field": "glucose",
        "label": "Recent Glucose Reading",
        "reason": "We need your current glucose level to predict what happens next...",
        "href": "/glucose",
        "icon": "glucose",
        "importance": "critical"
      }
    ]
  }
}
```

**200 - Complete & Predicted**
```json
{
  "status": 200,
  "hasData": true,
  "prediction": {
    "predictedGlucose": 150,
    "direction": "rising",
    "confidence": 0.87,
    "recommendation": "Levels appear to be rising...",
    "aiInsight": "Based on your recent meal and insulin timing..."
  }
}
```

---

## Key Design Decisions

### 1. Brand Color Consistency
- **Primary**: #1F2F98 (Used for high-priority buttons, insights)
- **Critical**: Red (#EF4444) for critical missing inputs
- **Accent**: Blues and greens for success/information states

### 2. Bluely Meal Estimation
Users describe meals naturally (e.g., "Rice with stew and fried plantain"), and the Bluely AI estimates carb content. This reduces friction vs. selecting from predefined dishes.

### 3. Three-Tiered Input Importance
- **Critical** (Red): Cannot predict without these
- **High** (Brand Blue): Significantly impacts accuracy
- **Medium** (Light Blue): Helpful but not required

### 4. Safety Gate Pattern
Returns 422 (Unprocessable Entity) when inputs incomplete — this is **intentional**, not an error. UI interprets it as "please complete these fields".

The 422 payload now includes two additional fields:
- `glucoseIsStale: boolean` — `true` when the most recent glucose reading is >10 minutes old
- `cachedContext: CachedContextEntry | null` — all in-window context records with `minutesAgo` timestamps

**Stale Glucose Flow**
1. Backend finds all required inputs present but glucose is >10 min old → returns 422 with `glucoseIsStale: true` and populated `cachedContext`
2. `PredictionGateway` routes to `StaleContextCard` instead of `MissingInputsCard`
3. User enters a fresh glucose reading, then reviews cached context per-input (Keep / Update / None)
4. On submit, `PredictionGateway` posts all data via `/predict/quick-log`, then re-validates and generates forecast

**predictionSafety.service.ts time windows** (no cascade — each input has its own independent window):
- Glucose: ≤10 min for freshness check; ≤24h for completeness
- Meal: ≤4 hours
- Medication: ≤6 hours
- Activity: ≤6 hours

---

## File Structure Overview

```
frontend/
├── src/components/dashboard/
│   ├── PredictionGateway.tsx      # Main orchestrator
│   ├── MissingInputsCard.tsx      # Missing fields UI
│   ├── StaleContextCard.tsx       # Stale-glucose context review UI
│   ├── GlucoseForecastCard.tsx    # Forecast display
│   └── ...
└── src/app/
    ├── dashboard/page.tsx         # Main page
    ├── meals/page.tsx             # Meal logging with Bluely
    ├── glucose/page.tsx           # Glucose readings
    └── ...

backend/
├── src/services/
│   └── predictionSafety.service.ts    # Central validation
├── src/controllers/
│   └── predict.controller.ts          # API endpoints
├── src/middleware/
│   └── validation.ts                  # Input validation
└── src/routes/
    └── predict.routes.ts              # API routes

ml/
├── predict_bluely.py              # 30-min forecast model
├── personalization/               # Patient adaptation
├── ai_insights/                   # DiaBuddy explanation
└── models/                        # Trained models
```

---

## Deployment Checklist

- [ ] Backend running on port 5000
- [ ] Frontend configured with API rewrites (next.config.ts)
- [ ] ML service running on designated port
- [ ] Firebase authentication configured
- [ ] Environment variables set (.env.local, .env)
- [ ] Database migrations completed
- [ ] API endpoints tested with Postman/curl
- [ ] Frontend manual testing completed (QUICK_START_TESTING.md)
- [ ] App deployed and tested in production

---

## Troubleshooting

### API Returns 404
**Problem**: Frontend calls `/api/predict` but gets 404
**Solution**: Ensure `next.config.ts` has API rewrites:
```typescript
async rewrites() {
  if (process.env.NODE_ENV === 'development') {
    return {
      beforeFiles: [{
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:5000'}/api/:path*`,
      }],
    };
  }
  return { beforeFiles: [] };
}
```

### DiaBuddy Not Responding
**Problem**: Meal estimation times out or fails
**Solution**: Check LLM integration:
1. Verify `/ai-insight` endpoint is working
2. Check LLM connectivity (DeepSeek/OpenAI/Ollama)
3. Fall back to rule-based carb estimation if LLM unavailable

### Missing Inputs Not Showing
**Problem**: All fields appear empty but "Select Data to Log" button disabled
**Solution**: 
1. Check backend returns proper 422 response with missingInputs array
2. Verify MissingInputsCard receives missingInputs prop
3. Check browser console for errors

---

## Version History

**v2.0** - Complete prediction system with Bluely AI
- [x] 3-layer safety validation
- [x] AI meal carb estimation
- [x] DiaBuddy explanations
- [x] Brand color implementation

**v1.0** - Initial glucose tracking
- Basic logging and history

---

## Support & Questions

For detailed testing procedures: See TESTING_GUIDE.md
For API specifications: See ML_DOCUMENTATION.md
For database schema: See models/ folder

---

**Last Updated**: March 14, 2026
**Status**: Production Ready
