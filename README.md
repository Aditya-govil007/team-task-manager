# Team Task Manager MVP

Production-ready MVP with:
- React + Vite + TypeScript + Tailwind frontend
- Express + TypeScript backend
- Prisma + PostgreSQL
- JWT auth + RBAC (Admin/Member)
- Railway deployment config

## 1) Folder Structure

```txt
team-task-manager-mvp/
  client/
    src/
      components/
        Card.tsx
        ProtectedRoute.tsx
      context/
        AuthContext.tsx
      pages/
        DashboardPage.tsx
        LoginPage.tsx
        SignupPage.tsx
      services/
        api.ts
      types/
        index.ts
      App.tsx
      main.tsx
      index.css
    .env.example
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    tsconfig.json
    vite.config.ts
  server/
    prisma/
      schema.prisma
    src/
      config/
        env.ts
        prisma.ts
      controllers/
        auth.controller.ts
        project.controller.ts
        task.controller.ts
      middlewares/
        async.middleware.ts
        auth.middleware.ts
        error.middleware.ts
      routes/
        auth.routes.ts
        project.routes.ts
        task.routes.ts
      types/
        express.d.ts
      app.ts
      index.ts
    .env.example
    package.json
    tsconfig.json
  .gitignore
  nixpacks.toml
  package.json
  railway.json
  README.md
```

## 2) Backend Setup

```bash
npm install
cp server/.env.example server/.env
```

Set real values in `server/.env`, then:

```bash
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
npm run dev:server
```

## 3) Frontend Setup

```bash
cp client/.env.example client/.env
npm run dev:client
```

## 4) Prisma Schema

Implemented in `server/prisma/schema.prisma`:
- `User` (role: ADMIN/MEMBER)
- `Project`
- `ProjectMember` (many-to-many user↔project)
- `Task` (status, assignee, due date)

## 5) Express Server Setup

- Entry point: `server/src/index.ts`
- App config: `server/src/app.ts`
- Middleware:
  - JWT auth (`authenticate`)
  - RBAC (`authorize`)
  - async error wrapper
  - global error handler

### Core REST APIs

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects` (admin only)
- `POST /api/projects/:projectId/members` (admin only)
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`
- `GET /api/tasks/dashboard/summary`

## 6) Tailwind Setup

Configured in:
- `client/tailwind.config.js`
- `client/postcss.config.js`
- `client/src/index.css`

## 7) Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/team_task_manager"
JWT_SECRET="replace-with-strong-secret"
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (`client/.env`)

```env
VITE_API_URL="http://localhost:5000/api"
```

## 8) Railway Deployment Prep

Included:
- `railway.json` with start command
- `nixpacks.toml` for Node 20 build/runtime

### Railway steps

1. Create new Railway project and connect this repo.
2. Add a PostgreSQL service in Railway.
3. Set backend variables:
   - `DATABASE_URL` (from Railway Postgres)
   - `JWT_SECRET`
   - `CORS_ORIGIN` (frontend domain)
   - `PORT` (Railway injects; keep optional)
4. Deploy.
5. For frontend deployment, host `client` separately (Vercel/Netlify/Railway static) and set `VITE_API_URL` to backend URL.
