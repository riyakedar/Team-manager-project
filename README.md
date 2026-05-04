# Team Task Manager

A production-ready team collaboration platform building with React, Node.js, Express, and MongoDB.

## Features
- **Role-Based Access Control**: Admins can manage projects and tasks; Members can view and update statuses.
- **Project Management**: Create projects and invite team members.
- **Real-time Kanban Board**: Synchronized task updates across the team using Socket.IO.
- **Dashboard Analytics**: Real-time stats on task progress and overdue alerts.
- **Secure Authentication**: JWT-based auth with secure cookie storage and bcrypt hashing.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, Socket.IO, JWT.
- **Database**: MongoDB (Mongoose).

## Getting Started

### Prerequisites
- Node.js (Latest LTS)
- MongoDB (Local instance or MongoDB Atlas URI)

### Local Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   MONGODB_URI="your_mongodb_connection_string"
   MONGODB_DB_NAME="team-task-manager"
   JWT_SECRET="your_secure_random_string"
   ```
   For MongoDB Atlas, either include the database name in the URI path, for example `/team-task-manager`, or keep `MONGODB_DB_NAME` set as shown above.
4. Start the development server:
   ```bash
   npm run dev
   ```

   On Windows PowerShell, if `npm` is blocked with `npm.ps1 cannot be loaded because running scripts is disabled`, run the command through npm's CMD shim:
   ```powershell
   npm.cmd run dev
   ```

## Deployment on Railway

1. Push this project to a GitHub repository.
2. In Railway, create a new project and choose **Deploy from GitHub repo**.
3. Select the repository and keep the root directory as `/`.
4. Add these service variables in Railway:
   ```env
   MONGODB_URI="your_mongodb_connection_string"
   MONGODB_DB_NAME="team-task-manager"
   JWT_SECRET="your_secure_random_string"
   GEMINI_API_KEY="your_gemini_api_key"
   ```
5. Railway will read `railway.json` and run:
   ```bash
   npm run build
   npm start
   ```

The app listens on Railway's injected `PORT` and serves the production React build from the same Express service. The healthcheck endpoint is `/api/health`.

## API Endpoints List

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get current user profile

### Projects
- `POST /api/projects` - Create project (Admin only)
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/members` - Add member (Admin only)

### Tasks
- `POST /api/tasks` - Create task (Admin only)
- `GET /api/tasks` - List tasks (Filter by projectId)
- `GET /api/tasks/stats` - Get dashboard statistics
- `PUT /api/tasks/:id` - Update task (Members: status only)
- `DELETE /api/tasks/:id` - Delete task (Admin only)
