# Aquamania Swimming Platform

Aquamania is a full-stack swim school management platform for Aquamania Swimming Limited (Bermuda).

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma ORM
- Auth baseline: JWT + httpOnly cookies

## Workspace Structure

- `apps/web` - parent/admin/instructor frontend shell
- `apps/api` - Express API, Prisma schema, seed data

## Quick Start

1. Install dependencies:
   - `npm install`
2. Create env file for API:
   - Copy `apps/api/.env.example` to `apps/api/.env`
3. Run Prisma generate:
   - `npm run prisma:generate`
4. Create your first migration and apply it:
   - `npm run prisma:migrate -- --name init`
5. Seed data:
   - `npm run prisma:seed`
6. Start both apps:
   - `npm run dev`

Frontend runs on `http://localhost:5173` and API runs on `http://localhost:4000`.

## Seeded Data

- Programme levels: Aquatots, Three Plus, Transitional, Intermediate, Advanced, Adult
- Pool locations: Warwick Academy Pool, National Sports Centre Aquatics Centre
- Term: Summer 2026 (active)
- Admin user:
  - Email: `admin@aquamania.bm`
  - Password: `AquaAdmin2026!`
- Demo instructor user:
  - Email: `instructor@aquamania.bm`
  - Password: `DemoInstructor2026!`
- Sample group: Saturday Aquatots 9:00am

## Current Progress Against Build Sequence

Completed:
- Step 1: Database schema and seed script
- Step 2 baseline: Auth login/logout endpoint and role middleware scaffolding
- Frontend route shell for public/admin/parent/instructor sections with mobile-first layout

Next:
- Parent registration wizard (step 3)
- Admin registration review flow (step 4)

## Deployment Notes

- Frontend target: Netlify
- Backend target: Railway or Render
- Ensure all required environment variables are set before deploy.
