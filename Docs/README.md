# Progression Tracker Documentation

![Progression Tracker Logo](https://via.placeholder.com/800x200?text=Progression+Tracker)

## Tagline
**AI-Powered Goal Planning, Progress Tracking, Productivity Intelligence Platform**

## Overview
Welcome to the documentation workspace for Progression Tracker. This repository contains the complete software requirements, system architecture, API specifications, and development guidelines required to build, maintain, and scale the application.

## Tech Stack
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Framer Motion
- **Backend**: FastAPI, Python 3.13+, SQLAlchemy, Alembic, Pydantic, Celery/ARQ, Redis, PostgreSQL, WebSockets
- **AI**: LangGraph, PydanticAI, OpenAI-compatible models, MCP, AI Agents, Qdrant
- **Mobile**: Flutter, Riverpod, Dio, Hive
- **Infrastructure**: Docker, Docker Compose, GitHub Actions, Cloudflare, Vercel, Render, AWS

## Folder Structure
All documentation is organized within the `/docs` directory sequentially.

## Quick Start
To get started with development, please read:
1. [Project Overview](01_Project_Overview.md)
2. [System Architecture](04_System_Architecture.md)
3. [API Design](06_API_Design.md)

---

## Best Practices

- Ensure strict adherence to the modular monolith architecture principles.
- Code should be testable, scalable, and self-documenting.
- Follow CI/CD guidelines for deployments and database migrations.
- Always use asynchronous processing for long-running operations.

## Future Improvements

- Transition specific heavy-load modules to independent microservices.
- Introduce advanced caching strategies using Redis clusters.
- Upgrade to newer major versions of the underlying AI agents as they become available.

## References
- [System Architecture](04_System_Architecture.md)
- [Database Design](05_Database_Design.md)
- [API Design](06_API_Design.md)
- [AI Architecture](07_AI_Architecture.md)
