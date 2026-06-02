# Backend Setup Guide (Node.js + Railway PostgreSQL)

## Overview

Your backend is at `backend/src/` — it's a complete Node.js/TypeScript API using:
- **Express** — web server
- **Prisma** — database ORM
- **PostgreSQL** — database (hosted on Railway)
- **JWT** — authentication

---

## Step 1 — Install Node.js (if not installed)

1. Go to: https://nodejs.org/
2. Download the **LTS version** (e.g., 20.x)
3. Run the installer with default settings
4. Open **PowerShell** and verify:

```powershell
node --version   # should print v20.x.x
npm --version    # should print 10.x.x
```

---

## Step 2 — Set Up Railway PostgreSQL (free database)

1. Go to **https://railway.app** and sign up (free)
2. Click **"New Project"**
3. Select **"Provision PostgreSQL"**
4. Wait ~30 seconds for it to deploy
5. Click on the **PostgreSQL** service
6. Go to the **"Connect"** tab
7. Copy the **"Postgres Connection URL"** — it looks like:
   ```
   postgresql://postgres:abc123@monorail.proxy.rlwy.net:12345/railway
   ```

---

## Step 3 — Configure the .env File

Open `backend/.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:PORT/railway

JWT_SECRET=your-random-secret-here
JWT_REFRESH_SECRET=your-different-random-secret-here
```

### Generate secure JWT secrets (run in PowerShell):
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run it twice — use one value for `JWT_SECRET`, another for `JWT_REFRESH_SECRET`.

---

## Step 4 — Install Dependencies

Open **PowerShell** in the `backend/` folder:

```powershell
cd C:\Users\Taleemabad\Downloads\Scoreboard\backend
npm install
```

This installs Express, Prisma, JWT, etc. (~2-3 minutes first time).

---

## Step 5 — Set Up the Database

This creates all the tables in your Railway PostgreSQL:

```powershell
npx prisma migrate dev --name init
```

Expected output:
```
✔ Generated Prisma Client
The following migration(s) have been applied:
- 20xx_xx_xx_init
```

---

## Step 6 — Start the API Server

```powershell
npm run dev
```

You should see:
```
✅ API running on http://localhost:3001
   Environment: development
```

---

## Step 7 — Test the API

Open your browser or use PowerShell:

```powershell
# Health check
Invoke-RestMethod http://localhost:3001/api/health

# Register a user
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/auth/register `
  -ContentType "application/json" `
  -Body '{"name":"Admin","email":"admin@example.com","password":"Password123!"}'
```

---

## API Endpoints Summary

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/workspaces` | List workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET  | `/api/workspaces/:id/positions` | List positions |
| POST | `/api/workspaces/:id/positions` | Create position |
| GET  | `/api/positions/:id/candidates` | List candidates |
| POST | `/api/positions/:id/candidates` | Add candidate |
| PATCH| `/api/positions/:id/candidates/:cid/values` | Update cell |
| DELETE | `/api/positions/:id/candidates/:cid` | Delete candidate |

---

## Troubleshooting

### "Cannot connect to database"
- Make sure the `DATABASE_URL` in `.env` is correct
- Railway PostgreSQL might be sleeping (click "Wake up" in Railway dashboard)

### "JWT_SECRET is not defined"
- Make sure you filled in `JWT_SECRET` and `JWT_REFRESH_SECRET` in `.env`

### "Port 3001 already in use"
- Change `PORT=3001` to `PORT=3002` in `.env`

### npm install fails
- Make sure Node.js v18+ is installed: `node --version`

---

## Next Steps After Setup

1. **Connect DEMO.html to the API** — replace localStorage with fetch() calls
2. **Connect the React frontend** — it's already built and just needs the right API URL
3. **Deploy to Railway** — the `Dockerfile` and `railway.toml` are already configured

---

## Database Schema Reference

```
users
  ├── workspaces (many-to-many via workspace_members)
  │   ├── positions
  │   │   ├── columns (8 types: text, status, date, file, percentage, number, email, phone)
  │   │   ├── custom_statuses
  │   │   └── candidates
  │   │       ├── candidate_values (cell data, one per column per candidate)
  │   │       └── files (S3/R2 storage)
  │   └── invitations
  └── audit_log (every data change tracked)
```
