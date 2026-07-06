# 🚀 Progression Tracker

An AI-powered goal planning, progress tracking, and productivity intelligence platform built for serious achievers. Progression Tracker connects your goals, tasks, and streaks into a single unified system, powered by an AI coach that remembers everything.

## ✨ Features

- **Goal Tracking**: Set ambitious goals with milestones. Track real-time progress with automatic completion calculation.
- **AI Coach**: Your personal AI coach analyzes your patterns, streaks, and progress to deliver personalized, context-aware recommendations.
- **Data Analytics**: Visualize your growth over days, weeks, and months with interactive bar charts and a GitHub-style consistency heatmap.
- **Streak Engine**: Never break the chain. Daily streak tracking that rewards consistency and builds momentum.
- **Command Palette**: Press `⌘K` anywhere to instantly search across goals, create tasks, or navigate the application.
- **Premium UI**: Crafted with React, Tailwind CSS, and Framer Motion for a fluid, glassmorphic, and highly responsive experience.

## 🏗️ Architecture

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, Lucide Icons
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), PostgreSQL
- **Mobile**: Flutter 3.44, Dart
- **AI Integration**: Custom LangChain agents powered by Gemini 3.1 Pro (High)
- **Deployment**: Docker, docker-compose

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- Flutter SDK (for mobile app)

### Quick Start (Frontend Mock Mode)
You can run the frontend immediately using our mock data engine:

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the application.

### Full Stack Setup (API + Database)
To run the full stack with the FastAPI backend and PostgreSQL database:

1. Copy `.env.example` to `.env` in the `backend/` directory.
2. Start the services:
```bash
docker-compose up -d
```
3. The API will be available at `http://localhost:8000`. 
4. API documentation (Swagger) is auto-generated at `http://localhost:8000/docs`.

## 📂 Project Structure

```
.
├── backend/          # FastAPI application
│   ├── app/          # Core backend logic (auth, goals, analytics, ai)
│   └── alembic/      # Database migrations
├── frontend/         # Next.js frontend application
│   ├── src/app/      # App Router pages (Dashboard, Goals, Tasks, etc)
│   └── src/components/ # Shared UI components (CommandPalette, SkeletonLoader)
├── mobile/           # Flutter native app (iOS & Android)
└── Docs/             # Comprehensive project documentation
```

## 🎨 UI/UX Philosophy

Progression Tracker uses a custom **Glassmorphism** design system with a refined color palette (`var(--color-bg-base)`, `var(--color-primary)`, `var(--color-accent)`). We rely heavily on micro-interactions and smooth transitions (`framer-motion`) to ensure the platform feels alive, responsive, and premium.

## 📄 License
This project is proprietary and confidential. All rights reserved.
