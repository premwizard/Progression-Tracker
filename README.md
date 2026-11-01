# 🚀 Progression Tracker

**Progression Tracker** is an enterprise-grade, AI-powered goal planning, progress tracking, and productivity intelligence platform. Built with a modern microservices-ready monorepo structure, it bridges ambitious personal and professional goals, task execution, habit streaks, and AI coaching into a unified, cross-platform ecosystem.

---

## 📌 Executive Overview (For LLMs / ChatGPT Prompting)

> **Quick Summary for AI Context:**
> Progression Tracker is a full-stack goal management and productivity intelligence platform consisting of:
> 1. **Backend**: Python 3.12+ FastAPI async REST API with SQLAlchemy 2.0 (Async), PostgreSQL, Redis rate-limiting/caching, Alembic migrations, and JWT authentication.
> 2. **Web Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, and Lucide icons featuring a dark glassmorphic design system and a `⌘K` command palette.
> 3. **Mobile App**: Cross-platform Flutter 3.x client (Web/Chrome, iOS, Android) powered by Riverpod state management, Dio HTTP client with JWT interceptors, and Hive local offline caching.
> 4. **AI Coach & Goal Planner**: Intelligent task breakdown engine, structured milestone generator, habit coaching, and automated progress analytics.

---

## ✨ Comprehensive Features Breakdown

### 🎯 1. Goal & Milestone Management
- **Hierarchical Goals**: Create long-term objectives with measurable milestones and sub-tasks.
- **Dynamic Progress Engine**: Real-time progress percentage auto-calculated based on task completion and milestone weighting.
- **Goal Categorization & Priority**: Organize goals by domain (Engineering, Career, Health, Learning) with priority tiering (High, Medium, Low).
- **Status Lifecycle**: Track goals across distinct lifecycle stages (`Active`, `In Progress`, `Paused`, `Completed`, `Archived`).

### 🤖 2. AI Coach & Intelligent Goal Planner
- **Intelligent Goal Decomposition**: Converts high-level user intentions (e.g., *"Learn Python"*, *"Run a Marathon"*) into step-by-step actionable roadmaps and milestone blueprints.
- **Context-Aware Coaching**: Delivers personalized recommendations, streak recovery plans, and momentum suggestions based on user completion velocity.
- **Curated Learning & Habit Paths**: Pre-configured domain blueprints for programming, mobile engineering, fitness, and daily habits.

### 📊 3. Analytics & Productivity Engine
- **GitHub-Style Consistency Heatmap**: Visual daily activity grid tracking completions, commits, and habit consistency over days, weeks, and months.
- **Velocity & Completion Metrics**: Interactive charts and data visualizations powered by Recharts comparing target vs. actual completion rates.
- **Streak Engine ("Don't Break the Chain")**: Daily streak tracking with freeze protections and milestone rewards to maintain user momentum.

### 📋 4. Task Management & Kanban Board
- **Task Boards**: Visual Kanban board (`To Do`, `In Progress`, `Completed`) tailored for daily execution.
- **Goal Linking**: Direct association between micro-tasks and parent goals ensuring focused execution.
- **Quick Status Transitions**: Interactive checkoffs and immediate progress ring recalculations.

### ⚡ 5. Command Palette & Navigation
- **Global `⌘K` / `Ctrl+K` Palette**: Instant hotkey access to search across all goals, create tasks, and switch views from anywhere in the app.
- **Glassmorphic UI**: High-end dark aesthetic built with glassmorphic cards, Framer Motion micro-interactions, and skeleton loading states.

### 📱 6. Multi-Platform Support (Flutter Mobile & Web)
- **Shared Mobile Core**: Flutter application running seamlessly on Android, iOS, and Web (Chrome).
- **Offline First**: Hive-based local storage cache keeping data available even without network connectivity.
- **Reactive UI**: Riverpod-managed state ensuring instant UI synchronization across views.

### 🔒 7. Security, Performance & Integrations
- **Stateless Auth**: JWT-based Bearer token authentication with secure password hashing (Bcrypt).
- **Rate Limiting & Caching**: Redis-backed sliding-window rate limiting to prevent abuse.
- **Security Headers & Compression**: Automatic Gzip compression, CORS controls, HSTS, and XSS defense headers.
- **External Integrations**: Webhook and GitHub integration endpoints for synchronizing repository activity with goal progress.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Key Libraries & Modules |
| :--- | :--- | :--- |
| **Backend API** | Python 3.12 / FastAPI | SQLAlchemy 2.0 (Async), Pydantic v2, Alembic, Uvicorn, Passlib, PyJWT |
| **Database & Cache**| PostgreSQL 15 & Redis 7 | Asyncpg, Redis-py |
| **Web Frontend** | Next.js 15 (App Router) / React 19 | Tailwind CSS v4, Framer Motion, TanStack Query, Recharts, Lucide Icons, Zod |
| **Mobile App** | Flutter 3.47+ / Dart | Flutter Riverpod, Dio, Hive / Hive Flutter, Google Fonts, FL Chart |
| **DevOps / Infra** | Docker & Docker Compose | Multi-stage Dockerfiles, Postgres & Redis containers |

---

## 📂 Project Structure

```
.
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── ai/               # AI goal decomposition & coaching endpoints
│   │   ├── analytics/        # Streak calculation & heatmap metrics
│   │   ├── api/v1/           # API routes (/auth, /goals, /tasks, /health, etc.)
│   │   ├── auth/             # JWT auth, user registration, token services
│   │   ├── core/             # App configs, security, dependency injection
│   │   ├── database/         # Async engine, session maker, base models
│   │   ├── goals/            # Goal & task services and routers
│   │   ├── integrations/     # GitHub & third-party service sync
│   │   ├── middleware/       # Rate limiting, logging, timing, security headers
│   │   ├── models/           # SQLAlchemy ORM models (User, Goal, Task)
│   │   └── notifications/    # In-app notifications & streak alerts
│   ├── alembic/              # Database migration scripts
│   ├── requirements.txt      # Python dependencies
│   └── docker-compose.yml    # Multi-container orchestration
│
├── frontend/                 # Next.js 15 Web Application
│   ├── src/
│   │   ├── app/              # App Router routes (/dashboard, /goals, /tasks, /analytics, /assistant)
│   │   ├── components/       # Shared UI, CommandPalette, ProgressRing, AI Assistant
│   │   ├── context/          # Auth and global state contexts
│   │   ├── services/         # API client & data fetchers
│   │   └── lib/              # Utility helpers
│   └── package.json          # Node dependencies and scripts
│
├── mobile/                   # Flutter Cross-Platform Client
│   ├── lib/
│   │   ├── core/             # Network (Dio) and storage (Hive) clients
│   │   ├── screens/          # DashboardScreen, ItemDetailScreen
│   │   ├── theme/            # AppTheme light & dark configurations
│   │   └── widgets/          # ProgressCard, ProgressRing, StreakBadge
│   └── pubspec.yaml          # Flutter dependencies
│
└── Docs/                     # 60+ modular technical design documents
```

---

## 🚀 Running the Project

### 1. Backend (FastAPI)

#### Native Python:
```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*API & Docs:* `http://localhost:8000/docs`

#### Docker Compose (includes DB & Redis):
```powershell
cd backend
docker compose up -d
```

### 2. Frontend (Next.js)

```powershell
cd frontend
npm install
npm run dev
```
*Web App:* `http://localhost:3000`

### 3. Mobile App (Flutter in Chrome)

```powershell
cd mobile
flutter pub get
flutter run -d chrome
```

---

## 📡 API Overview (v1)

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | Register a new user |
| `/api/v1/auth/login` | `POST` | Authenticate and obtain JWT Bearer token |
| `/api/v1/goals` | `GET / POST` | List active user goals / Create a new goal |
| `/api/v1/goals/{id}` | `GET / PUT / DELETE` | Retrieve, update, or delete goal details |
| `/api/v1/tasks` | `GET / POST` | Query tasks / Create task linked to a goal |
| `/api/v1/analytics/stats` | `GET` | Retrieve streak counters and velocity data |
| `/api/v1/analytics/heatmap` | `GET` | Retrieve daily activity heatmap dataset |
| `/api/v1/ai/chat` | `POST` | AI Coach chat & structured goal roadmap generation |
| `/api/v1/health` | `GET` | Service health status check |

---

## 📄 License
This project is proprietary and confidential. All rights reserved.
