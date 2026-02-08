# Bluely 

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Simeon-Azeh/bluely_main.git)

A web-based diabetes self-management system designed for users in low- and middle-income settings, with initial deployment targeting Cameroon.

## Overview

Bluely is a digital health MVP that enables individuals living with diabetes to:

- **Create an account** and securely authenticate using Firebase
- **Complete onboarding** to personalize their experience
- **Log blood glucose readings** with contextual factors (time, meals, activity)
- **View historical data** in a clean, simple dashboard

## Supervisor

**Bernard Lamptey** - Project Supervisor

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 15 (React 19) |
| **Backend** | Next.js API Routes (Node.js) |
| **Authentication** | Firebase Authentication |
| **Database** | MongoDB with Mongoose ODM |
| **Styling** | Tailwind CSS |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Icons** | React Icons (Feather) |

## Project Structure

```
bluely_main/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── users/         # User management endpoints
│   │   │   └── glucose/       # Glucose readings endpoints
│   │   ├── dashboard/         # Dashboard page
│   │   ├── glucose/           # Log glucose page
│   │   ├── history/           # History page
│   │   ├── settings/          # Settings page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   ├── forgot-password/   # Password reset page
│   │   └── onboarding/        # Onboarding flow
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── layout/            # Layout components
│   ├── contexts/              # React contexts (Auth)
│   └── lib/
│       ├── firebase/          # Firebase configuration
│       └── mongodb/           # MongoDB connection & models
├── public/                    # Static assets
└── .env.local                 # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB database (Atlas recommended)
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Simeon-Azeh/bluely_main.git
   cd bluely_main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # MongoDB
   MONGODB_URI=mongodb+srv://...

   # App
   NEXTAUTH_SECRET=your_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Email/Password authentication
   - Copy your web app configuration to `.env.local`

5. **Set up MongoDB**
   - Create a MongoDB Atlas cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
   - Create a database user with read/write permissions
   - **Important**: Add your IP address to the IP whitelist:
     - Go to Network Access → Add IP Address
     - Add your current IP address (or use `0.0.0.0/0` for development only)
   - Copy your connection string to `.env.local` (replace `<password>` with your database user password)

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Features

### Authentication
- Email/password signup and login
- Password reset functionality
- Protected routes with automatic redirects

### Onboarding
- 3-step personalization flow
- Diabetes type selection
- Target glucose range configuration
- Unit preference (mg/dL or mmol/L)

### Glucose Tracking
- Quick glucose value input
- Reading type selection (fasting, before/after meal, etc.)
- Meal and activity context
- Notes for additional information
- Date/time selection

### Dashboard
- 7-day average glucose
- Time in range percentage
- Min/max readings
- Interactive line chart with target range
- Recent readings list

### History
- Paginated list of all readings
- Date range filtering
- Grouped by day
- Delete functionality
- Color-coded status indicators

### Settings
- Profile management
- Diabetes information
- Target range configuration
- Unit preferences

## Designs

### Figma Mockups
- [View Figma Designs](https://www.figma.com/design/...) *(Add your Figma link here)*

### Screenshots
- **Landing Page**: Clean, welcoming interface with clear value proposition
- **Dashboard**: Comprehensive overview with glucose trends and quick actions
- **Glucose Logging**: Simple input form with contextual options
- **History View**: Organized list of readings with filtering capabilities
- **Settings**: Comprehensive user profile and preferences management

### Circuit Diagram
- **Hardware Integration**: Planned integration with glucometers via Bluetooth/serial connection
- **Data Flow**: Secure transmission from device to cloud database
- **Offline Capability**: Local storage with sync when connectivity is restored

## API Endpoints

### Users
- `GET /api/users?firebaseUid=xxx` - Get user profile
- `POST /api/users` - Create new user
- `PUT /api/users` - Update user profile

### Glucose Readings
- `GET /api/glucose?firebaseUid=xxx` - Get readings (with pagination & date filters)
- `POST /api/glucose` - Create new reading
- `GET /api/glucose/[id]` - Get specific reading
- `PUT /api/glucose/[id]` - Update reading
- `DELETE /api/glucose/[id]` - Delete reading
- `GET /api/glucose/stats?firebaseUid=xxx&days=7` - Get glucose statistics

## Design Principles

- **Simplicity**: Clean, intuitive interface
- **Accessibility**: Large touch targets, clear typography
- **Mobile-first**: Responsive design for all devices
- **Contextual feedback**: Color-coded glucose levels

## Deployment Plan

### Development Environment
- **Local Development**: Node.js + Next.js development server
- **Version Control**: Git with GitHub repository
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

### Staging Environment
- **Platform**: Vercel or Railway for staging deployment
- **Database**: MongoDB Atlas staging cluster
- **Authentication**: Firebase staging project
- **Testing**: End-to-end testing with Cypress or Playwright

### Production Environment
- **Platform**: Vercel for frontend, Railway or Heroku for backend API
- **Database**: MongoDB Atlas production cluster with backup
- **Authentication**: Firebase production project
- **CDN**: Vercel automatic CDN for static assets
- **Monitoring**: Application monitoring with Sentry or similar
- **Analytics**: User analytics with Google Analytics or Mixpanel

### Deployment Steps
1. **Code Review**: Pull request review and approval
2. **Automated Testing**: CI/CD pipeline with GitHub Actions
3. **Staging Deployment**: Automatic deployment to staging on merge to develop branch
4. **Production Deployment**: Manual deployment to production after staging verification
5. **Database Migration**: Automated schema migrations with MongoDB migration tools
6. **Rollback Plan**: Quick rollback capability with previous deployment versions

### Security Considerations
- **Data Encryption**: End-to-end encryption for sensitive health data
- **Compliance**: GDPR and HIPAA compliance for health data
- **Access Control**: Role-based access control and API authentication
- **Regular Audits**: Security audits and penetration testing

### Scaling Strategy
- **Horizontal Scaling**: Load balancer with multiple server instances
- **Database Scaling**: MongoDB sharding for large datasets
- **Caching**: Redis for session and data caching
- **CDN**: Global CDN for static assets and API responses

## License

This project is developed for academic purposes as part of a software engineering project.

## Contributing

This is an MVP demonstration project. Contributions are welcome for educational purposes.

---

**Bluely** - Empowering diabetes self-management 💙
