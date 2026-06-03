# Password Reset Implementation - Setup Guide

## ✅ What's been done

The password reset functionality has been fully implemented:

1. **Database Schema** - Added `PasswordResetToken` model to store reset tokens
2. **API Endpoints** - Implemented two new routes:
   - `POST /api/auth/forgot-password` - Generate and send reset token via email
   - `POST /api/auth/reset-password` - Validate token and update password
3. **Migration** - Created database migration to add `password_reset_tokens` table
4. **Email Integration** - Uses existing email service to send password reset links

## 🚀 Next Steps - To Get Password Reset Working

### Step 1: Set up a PostgreSQL Database

You have several options:

#### Option A: Railway (Recommended for deployment)
1. Go to https://railway.app
2. Create a new PostgreSQL database
3. Copy the connection URL
4. Update `.env` file: `DATABASE_URL=<your-railway-url>`

#### Option B: Supabase (Free tier available)
1. Go to https://supabase.com
2. Create a new project
3. Copy the connection URL from Project Settings → Database
4. Update `.env` file: `DATABASE_URL=<your-supabase-url>`

#### Option C: Local PostgreSQL
1. Download PostgreSQL for Windows: https://www.postgresql.org/download/windows/
2. Install and set password for `postgres` user
3. Create database: `recruitment_scoreboard`
4. Update `.env`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/recruitment_scoreboard
   ```

### Step 2: Update Environment Variables

Edit `backend/.env` and ensure these are set:

```env
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
EMAIL_FROM=noreply@scoreboard.app
```

For email testing, use **Mailtrap** (free): https://mailtrap.io

### Step 3: Apply the Migration

Once your database is set up and DATABASE_URL is configured:

```powershell
cd backend
npx prisma migrate deploy
```

### Step 4: Verify

Test the password reset flow:
1. Open the app in your browser
2. Go to login page
3. Click "Reset your password"
4. Enter an account email
5. Check Mailtrap inbox (or your email service)
6. Click the reset link
7. Set a new password

## 📂 Files Modified

- `backend/prisma/schema.prisma` - Added PasswordResetToken model
- `backend/src/routes/auth.ts` - Added /forgot-password and /reset-password endpoints
- `backend/prisma/migrations/20260603143318_add_password_reset_token/migration.sql` - New migration file
- `backend/.env` - Updated DATABASE_URL placeholder

## 🐛 Troubleshooting

**"Failed to generate reset code" error:**
- Check DATABASE_URL is valid and database is running
- Verify SMTP credentials are correct for email sending

**Migration fails to apply:**
- Make sure DATABASE_URL points to a running PostgreSQL database
- Check the connection string format is correct

**Emails not received:**
- If using Mailtrap, check the inbox in their dashboard
- Verify SMTP credentials in .env match Mailtrap

## Questions?

The implementation is complete. You just need a database and valid SMTP credentials to activate it.
