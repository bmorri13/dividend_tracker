# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a full-stack dividend portfolio tracking application built with:

**Frontend & Backend (Next.js 15):**
- React 19 with TypeScript
- Tailwind CSS v4 for styling  
- Radix UI components (`@radix-ui/react-slot`)
- Recharts for data visualization
- Supabase authentication and database client
- Lucide React for icons
- Path aliases configured (`@/*` → `./src/*`)
- Next.js API routes for backend functionality
- JWT authentication with Supabase using `jsonwebtoken`
- Financial Modeling Prep API for stock data

**Key Components:**
- `frontend/src/components/dividend-tracker.tsx` - Main dashboard component
- `frontend/src/app/api/` - Next.js API routes (replaces Go backend)
- `frontend/src/app/api/utils/` - Shared utilities (auth, database, FMP API)
- `frontend/lib/api.ts` - API service layer
- `frontend/lib/supabase.ts` - Supabase client configuration
- `frontend/src/lib/auth-context.tsx` - Authentication context

---

## Development Commands

**Development:**
```bash
cd frontend
npm run dev          # Start Next.js dev server with API routes (uses --turbopack)
npm run build        # Build for production (standalone output)
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # TypeScript type checking
```

**Docker Development:**
```bash
docker-compose up --build    # Build and run the application (production setup)
docker-compose down          # Stop services
```

**Alternative Development Setup:**
```bash
# Development without Cloudflare Tunnel
docker-compose -f docker-compose-dev.yml up --build
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
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    env_file:
      - ./.env
    restart: unless-stopped
    networks:
      - dividend-tracker-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  cloudflare-tunnel:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    volumes:
      - ./cloudflared:/etc/cloudflared
    command: tunnel --loglevel debug run
    environment:
      - TUNNEL_TOKEN=${CF_TOKEN}
    env_file:
      - ./.env
    depends_on:
      frontend:
        condition: service_healthy
    networks:
      - dividend-tracker-network

networks:
  dividend-tracker-network:
    driver: bridge
```

**Cloudflare Tunnel Hostname Config (Simplified Setup):**
- `https://yourdomain.com` → points to `frontend:3000`

With Next.js API routes, all traffic (including `/api/*` routes) is handled by the single frontend service. This eliminates the need for separate backend routing and simplifies the Cloudflare tunnel configuration to a single record.

---

## Environment Setup

The project uses a single `.env` file in the project root containing:
- `FMP_API_KEY` - Financial Modeling Prep API key
- `SUPABASE_JWT_SECRET` - Supabase JWT secret for token verification
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (client-side safe)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (client-side safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for server-side operations
- `CF_TOKEN` - Cloudflare tunnel token for deployment

The Next.js API routes use the Supabase client with service role key for database operations and validate JWT tokens using the `SUPABASE_JWT_SECRET`. See `.env.example` for the complete configuration template.

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

**Authentication Required (Next.js API Routes):**
- `GET /api/portfolio` - Get user's holdings
- `POST /api/portfolio` - Create new holding  
- `PUT /api/portfolio/[id]` - Update holding shares
- `DELETE /api/portfolio/[id]` - Delete holding
- `POST /api/portfolio/refresh` - Refresh all holdings with latest data

**Public Endpoints (Next.js API Routes):**
- `GET /api/stockTicker?symbol=TICKER` - Get stock quote
- `GET /api/dividends?symbol=TICKER` - Get dividend data
- `GET /api/dividendSummary?symbol=TICKER&shares=N` - Get calculated summary

**API Route Structure:**
- Authentication handled via `frontend/src/app/api/utils/auth.ts`
- Database operations via `frontend/src/app/api/utils/database.ts`  
- FMP API integration via `frontend/src/app/api/utils/fmp.ts`

---

## Authentication Flow

The application uses Supabase for user authentication. The Next.js API routes validate JWT tokens using the Supabase JWT secret. User sessions are managed client-side with automatic token refresh.

---

## External Dependencies

- **Financial Modeling Prep API** – real-time stock & dividend data
- **Supabase** – authentication, user management, and PostgreSQL database

---

## Testing Instructions for Claude Code Agents

- All functionality should be tested using `docker-compose up` locally.
- End-to-end tests should be driven by **Playwright** using the **MCP server**.
- Validate login, adding holdings, updating, deleting, and refreshing.
- For authentication testing, create a `.env.test` file (ignored by git) with:

```bash
# .env.test - Testing credentials (create locally, not committed)
TEST_EMAIL=your_test_email@example.com
TEST_PASSWORD=your_test_password
```

This test user account should have access to demo holdings and can be used to test all portfolio-related API calls.

---

## Local Developer Support

- Local developers can run the application using `docker-compose` or `npm run dev` without requiring Cloudflare Tunnel.
- API routes are handled internally by Next.js, so no external API URL configuration is needed.

---

## Troubleshooting Tips

- Ensure Docker is running and port 3000 is available.
- Check tunnel logs with:
```bash
docker logs cloudflared-tunnel
```
- If Cloudflare Tunnel fails to connect, re-issue or verify the `CF_TOKEN` from your Cloudflare Zero Trust dashboard.
- For API route issues, check the Next.js application logs and ensure all required environment variables are set.

---

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
