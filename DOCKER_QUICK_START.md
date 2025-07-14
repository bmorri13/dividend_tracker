# 🚀 Quick Start - Docker Setup

## 🏃‍♂️ TL;DR - Get Running Fast

```bash
# Start everything (production mode)
make up

# OR start in development mode with hot reloading
make dev

# Check if everything is working
make health

# View logs
make logs

# Stop everything
make down
```

## 📍 Access Your App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/

## 🔧 Prerequisites Checklist
- ✅ Docker Desktop installed and running
- ✅ All environment variables set in `backend/.env`:
  - `FMP_API_KEY` (Financial Modeling Prep API key)
  - `DATABASE_URL` (Supabase database connection)
  - `SUPABASE_JWT_SECRET` (From Supabase dashboard)

## 🚨 If Something Goes Wrong

### Services Won't Start
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8080

# View detailed logs
make logs
```

### Backend Issues
```bash
# Check backend logs specifically
make logs-be

# Open shell in backend container
make shell-be

# Verify environment variables are loaded
docker-compose exec backend env | grep -E "(FMP_API_KEY|DATABASE_URL|SUPABASE_JWT_SECRET)"
```

### Frontend Issues
```bash
# Check frontend logs
make logs-fe

# Verify it can reach backend
docker-compose exec frontend wget -qO- http://backend:8080/
```

### Authentication Not Working
1. Verify `SUPABASE_JWT_SECRET` is correct in `backend/.env`
2. Check Supabase project settings for Google OAuth
3. Ensure database migration was run (see `verify_migration.sql`)

## 🎯 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `make up` | Start production services |
| `make dev` | Start development with hot reload |
| `make down` | Stop all services |
| `make logs` | View all logs |
| `make health` | Check service status |
| `make clean` | Clean up everything |
| `make restart` | Restart all services |

## 🔄 Development Workflow

1. **Start dev mode**: `make dev`
2. **Make code changes** (auto-reloads)
3. **View logs**: `make logs`
4. **Test changes**: http://localhost:3000
5. **Stop when done**: `make down`

## 🌐 What's Running

- **Backend (Go)**: Authentication, API endpoints, database queries
- **Frontend (Next.js)**: React app with Supabase auth, portfolio UI
- **Network**: Internal Docker network for service communication
- **Health Checks**: Automatic monitoring and restart on failure

## 📋 First Time Setup

1. **Clone and navigate to project**
2. **Ensure all environment variables are set** in `backend/.env`
3. **Run database migration** (if not done already)
4. **Start services**: `make up`
5. **Open app**: http://localhost:3000
6. **Test login** with Google OAuth or email/password

## 🎉 Success!

If everything is working:
- ✅ Frontend loads at http://localhost:3000
- ✅ You can log in with Google or email/password
- ✅ You can add stocks to your portfolio
- ✅ Data persists and is user-specific

**You're ready to track your dividends! 💰**