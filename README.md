# Metropolitan ERP - Backend API Server

This is the Node.js Express backend API server for the Metropolitan Academy ERP portal. It handles authentication, role-based dash boarding, attendance tracking, lesson timetables, and academic reporting.

## Prerequisites

- **Node.js**: `>= 18.x` (Recommended: v18 or v20 LTS)
- **Database**: MySQL `>= 8.0` (or Railway Hosted MySQL)

## Installation

1. Install the backend dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Create a `.env` file at the root of the `backend/` directory:
   ```bash
   cp .env.example .env
   ```

2. Configure the environment variables inside `.env`:
   ```ini
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=*

   # Database settings
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=school_manage_database

   # JWT Tokens
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d

   # Rate Limit
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX=10000
   ```

## Running the Server

### Local Development
To run the server locally with auto-reloading:
```bash
npm run dev
```

### Production Deployment
To run the server in a production environment:
```bash
npm start
```

## Security Best Practices
- Keep `.env` out of Git repository tracking.
- Do not commit your `node_modules` folder.
- Ensure the database user has limited scopes on host environments.
