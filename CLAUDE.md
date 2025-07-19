# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a full-stack dividend portfolio tracking application built with:

**Frontend (Next.js 15):**
- React 19 with TypeScript
- Tailwind CSS v4 for styling  
- Radix UI components (`@radix-ui/react-slot`)
- Recharts for data visualization
- Supabase authentication and database client
- Lucide React for icons
- Path aliases configured (`@/*` → `./src/*`)

**Backend (Go 1.21):**
- Gin framework for HTTP server
- PostgreSQL database integration with `lib/pq` driver
- JWT authentication with Supabase using `golang-jwt/jwt/v5`
- Financial Modeling Prep API for stock data
- Environment variables via `godotenv`

**Key Components:**
- `frontend/src/components/dividend-tracker.tsx` - Main dashboard component
- `backend/main.go` - Go API server with all endpoints (monolithic structure)
- `frontend/lib/api.ts` - API service layer
- `frontend/lib/supabase.ts` - Supabase client configuration
- `frontend/src/lib/auth-context.tsx` - Authentication context

---

## Development Commands

**Frontend Development:**
```bash
cd frontend
npm run dev          # Start Next.js dev server (uses --turbopack)
npm run build        # Build for production (standalone output)
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # TypeScript type checking
```

**Backend Development:**
```bash
cd backend
go run main.go       # Start Go server (requires .env file)
go mod tidy          # Clean up dependencies
go build             # Build binary
```

**Docker Development (Fullstack):**
```bash
docker-compose up --build    # Build and run both frontend and backend
docker-compose down          # Stop services
```

---

## Deployment on Proxmox VM with Cloudflare Tunnel

This application is deployed on an Ubuntu-based Proxmox VM using Docker Compose and is fronted by Cloudflare Tunnel.

### Cloudflare Tunnel Setup

**Requirements:**
- `cloudflared` installed as a Docker container
- `CF_TOKEN` stored in the project root `.env` file

**Current Docker Compose Configuration:**
```yaml
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - GIN_MODE=release
      - PORT=8080
    env_file:
      - ./.env
    restart: unless-stopped
    networks:
      - dividend-tracker-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/"]

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:8080
      - PORT=3000
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - dividend-tracker-network

networks:
  dividend-tracker-network:
    driver: bridge
```

**Cloudflare Tunnel Hostname Config (Recommended Setup):**
- `https://yourdomain.com` → points to `frontend:3000`
- `https://yourdomain.com/api` → points to `backend:8080`

Cloudflare can route `/api` traffic to the Go backend while routing root-level `/` traffic to the frontend. This avoids CORS issues and enables a clean public-facing interface.

---

## Environment Setup

The project uses a single `.env` file in the project root containing:
- `FMP_API_KEY` - Financial Modeling Prep API key
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_JWT_SECRET` - Supabase JWT secret for token verification
- `CF_TOKEN` - Cloudflare tunnel token for deployment

The backend Go application will load this root `.env` file for local development, while Docker uses the same file via `env_file` directive.

---

## Database Schema

The application uses a `portfolio_holdings` table with columns:
- `id` (UUID, primary key)
- `ticker` (string)
- `company` (string) 
- `shares` (integer)
- `current_price` (float)
- `dividend_yield` (float)
- `total_value` (float)
- `monthly_dividend` (float)
- `user_id` (UUID, foreign key)
- `created_at`, `updated_at` (timestamps)

---

## API Endpoints

**Authentication Required:**
- `GET /portfolio` - Get user's holdings
- `POST /portfolio` - Create new holding
- `PUT /portfolio/:id` - Update holding shares
- `DELETE /portfolio/:id` - Delete holding
- `POST /portfolio/refresh` - Refresh all holdings with latest data

**Public Endpoints:**
- `GET /stockTicker?symbol=TICKER` - Get stock quote
- `GET /dividends?symbol=TICKER` - Get dividend data
- `GET /dividendSummary?symbol=TICKER&shares=N` - Get calculated summary

---

## Authentication Flow

The application uses Supabase for user authentication. The Go backend validates JWT tokens using the Supabase JWT secret. User sessions are managed client-side with automatic token refresh.

---

## External Dependencies

- **Financial Modeling Prep API** – real-time stock & dividend data
- **Supabase** – authentication and user management
- **PostgreSQL** – portfolio data storage

---

## Testing Instructions for Claude Code Agents

- All functionality should be tested using `docker-compose up` locally.
- End-to-end tests should be driven by **Playwright** using the **MCP server**.
- Validate login, adding holdings, updating, deleting, and refreshing.
- For authentication testing, use:

```plaintext
Email:    bryanmorrison017+div_user1@gmail.com
Password: TESTTESTTEST
```

This test user account has access to demo holdings and can be used to test all portfolio-related API calls.

---

## Local Developer Support

- Local developers can run both frontend and backend using `docker-compose` without requiring Cloudflare Tunnel.
- Update `.env` to point `NEXT_PUBLIC_API_URL=http://localhost:8080` during local testing.

---

## Troubleshooting Tips

- Ensure Docker is running and ports 3000 (frontend) and 8080 (backend) are available.
- Check tunnel logs with:
```bash
docker logs cloudflared-tunnel
```
- If Cloudflare Tunnel fails to connect, re-issue or verify the `CF_TOKEN` from your Cloudflare Zero Trust dashboard.

---

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
