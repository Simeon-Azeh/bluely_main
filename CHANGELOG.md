# Changelog

All notable changes to the Bluely project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-02

### Changed

#### Project Restructure
- Separated frontend and backend into distinct folders
- Frontend: Next.js application in `/frontend`
- Backend: Node.js Express server in `/backend`

#### Backend Implementation
- Created Express server with TypeScript
- Implemented RESTful API routes:
  - `POST /api/users` - Create new user
  - `GET /api/users/:firebaseUid` - Get user by Firebase UID
  - `PUT /api/users/:firebaseUid` - Update user profile
  - `DELETE /api/users/me` - Delete current user
  - `POST /api/glucose` - Create glucose reading
  - `GET /api/glucose` - Get readings with filters
  - `GET /api/glucose/stats` - Get glucose statistics
  - `GET /api/glucose/:id` - Get specific reading
  - `PUT /api/glucose/:id` - Update reading
  - `DELETE /api/glucose/:id` - Delete reading
- Added Firebase Admin SDK for token verification
- Created authentication middleware
- Created error handling middleware
- Set up MongoDB connection with Mongoose

#### Frontend Updates
- Created centralized API client (`src/lib/api.ts`)
- Updated AuthContext to use API client
- Updated all pages to use API client instead of direct fetch calls:
  - Dashboard page
  - Glucose logging page
  - History page
  - Settings page
  - Onboarding page
- Removed old Next.js API routes
- Removed frontend MongoDB integration (now handled by backend)

#### Configuration
- Added backend environment variables:
  - `PORT` - Server port (default: 5000)
  - `MONGODB_URI` - MongoDB connection string
  - `JWT_SECRET` - JWT signing secret
  - Firebase Admin SDK credentials
- Updated frontend to use `NEXT_PUBLIC_API_URL`

---

## [0.1.0] - 2026-02-02

### Added

#### Project Setup
- Initialized Next.js 15 project with TypeScript and App Router
- Configured Tailwind CSS for styling
- Set up ESLint for code quality
- Created project folder structure

#### Dependencies Installed
- **Core**: next, react, react-dom
- **Authentication**: firebase
- **Database**: mongodb, mongoose
- **UI/Forms**: react-hook-form, @hookform/resolvers, zod
- **Charts**: recharts
- **Utilities**: date-fns, react-icons

#### Firebase Integration
- Created Firebase configuration (`src/lib/firebase/config.ts`)
- Implemented authentication functions (signUp, signIn, logOut, resetPassword)
- Set up Firebase exports (`src/lib/firebase/index.ts`)

#### MongoDB Integration
- Created MongoDB connection utility (`src/lib/mongodb/connection.ts`)
- Defined User model with fields:
  - firebaseUid, email, displayName
  - diabetesType, diagnosisYear
  - targetGlucoseMin, targetGlucoseMax
  - preferredUnit, onboardingCompleted
- Defined GlucoseReading model with fields:
  - userId, firebaseUid, value, unit
  - readingType, mealContext, activityContext
  - notes, recordedAt

#### Authentication Context
- Created AuthContext with AuthProvider
- Implemented useAuth hook for accessing auth state
- Added automatic user creation in MongoDB on signup

#### UI Components
- Created reusable Button component with variants and loading state
- Created Input component with label, error, and helper text
- Created Select component for dropdown selections
- Created Card component with header, title, and content
- Created LoadingSpinner component

#### Layout Components
- Created Navbar with responsive mobile menu
- Created AuthLayout with route protection and redirects

#### Pages Created

**Public Pages:**
- Landing page (`/`) with hero, features, and CTA sections
- Login page (`/login`) with form validation
- Signup page (`/signup`) with password confirmation
- Forgot password page (`/forgot-password`) with email reset

**Protected Pages:**
- Dashboard (`/dashboard`) with:
  - 7-day statistics cards
  - Interactive line chart with target range
  - Recent readings list
- Glucose logging (`/glucose`) with:
  - Value input with validation
  - Reading type selection
  - Meal and activity context
  - Notes field
  - Date/time picker
- History (`/history`) with:
  - Paginated readings list
  - Date range filtering
  - Grouped by day view
  - Delete functionality
- Settings (`/settings`) with:
  - Profile management
  - Diabetes information
  - Target range configuration
- Onboarding (`/onboarding`) with:
  - 3-step wizard flow
  - Diabetes type selection
  - Unit preference selection
  - Target range setup

#### API Routes Created
- `POST /api/users` - Create new user
- `GET /api/users` - Get user by Firebase UID
- `PUT /api/users` - Update user profile
- `POST /api/glucose` - Create glucose reading
- `GET /api/glucose` - Get readings with pagination and date filters
- `GET /api/glucose/[id]` - Get specific reading
- `PUT /api/glucose/[id]` - Update reading
- `DELETE /api/glucose/[id]` - Delete reading
- `GET /api/glucose/stats` - Get glucose statistics

#### Configuration Files
- Created `.env.local` template with Firebase and MongoDB variables
- Created `.env.example` for reference
- Updated `globals.css` with custom styles and glucose level colors

#### Documentation
- Updated README.md with comprehensive project documentation
- Created this CHANGELOG.md file

### Technical Notes
- Using Next.js App Router (app directory)
- All pages use client-side rendering for auth state
- MongoDB connection uses caching for performance
- Form validation using Zod schemas
- Responsive design with mobile-first approach

---

## Future Releases

### Planned for [0.2.0]
- [ ] Email verification flow
- [ ] Export data to CSV
- [ ] Medication tracking
- [ ] Reminder notifications
- [ ] PWA support for offline access

### Planned for [0.3.0]
- [ ] Healthcare provider dashboard
- [ ] Data sharing with providers
- [ ] A1C estimation
- [ ] Meal logging with photos
- [ ] Integration with glucose meters
