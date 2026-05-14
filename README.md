# Team Task Manager

A modern full-stack collaborative task management platform built with React, TypeScript, Node.js, Express, Prisma, and PostgreSQL.

The application supports multi-user collaboration with role-based access control, task assignment, project management, analytics, Kanban workflow, dark mode, and team coordination features.

---

# Features

## Authentication & Authorization
- JWT-based authentication
- Secure login/signup flow
- Role-based access control (ADMIN / MEMBER)
- Protected routes and APIs

## Project Management
- Create and manage projects
- Add/remove project members
- Shared collaborative workspace
- Project visibility based on membership

## Task Management
- Create and assign tasks
- Due dates and overdue tracking
- Task status updates
- Member-specific task visibility
- Search and filter tasks
- Kanban board workflow

## Dashboard & Analytics
- Task statistics
- Completion percentage
- Pending/In Progress/Completed counts
- Overdue tracking
- Recent activity feed

## UI/UX
- Responsive modern dashboard
- Dark mode support
- Toast notifications
- Clean Kanban-style interface

---

# Tech Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Hot Toast

## Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

## Deployment
- Vercel (Frontend)
- Render (Backend)
- Neon PostgreSQL

---

# Project Structure

```bash
client/
├── src/
│   ├── pages/
│   ├── components/
│   ├── api/
│   └── context/

server/
├── prisma/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   ├── validators/
│   └── config/
```

---

# Installation & Setup
Clone Repository

```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

---

# Backend Setup
Navigate to server

```bash
cd server
```

Install dependencies

```bash
npm install
```

Configure environment variables

```bash
Create .env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

Run Prisma migrations

```bash
npx prisma migrate dev
```

Start backend server

```bash
npm run dev
```

Backend runs on:

```bash
http://localhost:5000
```

---

# Frontend Setup

Navigate to client

```bash
cd client
```

Install dependencies

```bash
npm install
```

Create .env

```bash
VITE_API_URL=http://localhost:5000/api
```

Start frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```
---

# Role-Based Workflow

## Admin
- Create projects
- Add project members
- Assign tasks
- View all project analytics
- Manage task workflow

## Member

- View joined projects
- View assigned tasks
- Update task status
- Collaborate inside shared workspace

---

# API Overview

Auth

```http
POST /api/auth/signup
POST /api/auth/login
```

Projects

```http
GET    /api/projects
POST   /api/projects
POST   /api/projects/:id/members
GET    /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

Tasks

```http
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id
PATCH  /api/tasks/:id/assign
GET    /api/tasks/my-tasks
```
---

# Key Features Implemented

- Role-based access control
- Shared project collaboration
- Kanban task management
- Dark mode
- Activity tracking
- Analytics dashboard
- Overdue task highlighting
- Search and filtering
- Toast notifications

---

# Deployment Links

Frontend
https://team-task-manager-1-qcxf.onrender.com

Backend
https://team-task-manager-qfy9.onrender.com/

---

# Author

Aditya Govil

GitHub: https://github.com/Aditya-govil007
