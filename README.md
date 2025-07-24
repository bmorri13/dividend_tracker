# 📈 Dividend Portfolio Tracker

A full-stack web application for tracking dividend-paying stocks and monitoring portfolio performance. Built with Next.js (including API routes), TypeScript, and Supabase.

## 🚀 Features

- **Portfolio Management**: Add, edit, and remove dividend stocks from your portfolio
- **Real-time Data**: Live stock quotes and dividend information via Financial Modeling Prep API
- **Performance Analytics**: Track total portfolio value, monthly dividend income, and yield metrics
- **Interactive Charts**: Visualize portfolio composition and dividend trends
- **User Authentication**: Secure login/signup with Supabase authentication
- **Responsive Design**: Modern UI that works on desktop and mobile devices

## 🏗️ Architecture

**Full-Stack Next.js 15 Application**
- React 19 with TypeScript
- Next.js API routes for backend functionality
- Tailwind CSS v4 for styling
- Radix UI components
- Recharts for data visualization
- JWT authentication with Supabase
- Financial Modeling Prep API integration

**Database**
- PostgreSQL via Supabase
- User authentication and session management
- Portfolio holdings storage with Row Level Security

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Docker & Docker Compose** (for containerized deployment)
- **Supabase Account** (for database and authentication)
- **Financial Modeling Prep API Key** (free tier available)

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dividend_tracker
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
# See .env.example for detailed instructions on getting API keys
```

### 3. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the following SQL to create the required table:

```sql
CREATE TABLE portfolio_holdings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    company VARCHAR(255) NOT NULL,
    shares INTEGER NOT NULL CHECK (shares > 0),
    current_price DECIMAL(10,2) NOT NULL,
    dividend_yield DECIMAL(5,2) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    monthly_dividend DECIMAL(10,2) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own holdings
CREATE POLICY \"Users can only access their own holdings\" ON portfolio_holdings
    FOR ALL USING (auth.uid() = user_id);
```

### 4. Get API Keys

**Financial Modeling Prep API:**
1. Sign up at [financialmodelingprep.com](https://financialmodelingprep.com/developer/docs)
2. Get your free API key (250 requests/day)
3. Add to `.env` as `FMP_API_KEY`

**Supabase Configuration:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following to your `.env`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - JWT Secret → `SUPABASE_JWT_SECRET`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Run with Docker (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Access the application at http://localhost:3000
# API routes are available at http://localhost:3000/api/*
```

### 6. Manual Development Setup

```bash
cd frontend
npm install
npm run dev

# Access the application at http://localhost:3000
```

## 🧪 Testing

### Test User Account

For development and testing, you can create a test account or use the credentials in your local `.env.test` file:

```bash
# Copy test environment template
cp .env.test.example .env.test
# Add your test credentials
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# E2E tests with Playwright (when configured)
npm run test:e2e
```

## 📊 API Endpoints

All API endpoints are served through Next.js API routes at `/api/*`:

### Public Endpoints
- `GET /api/stockTicker?symbol=TICKER` - Get stock quote
- `GET /api/dividends?symbol=TICKER` - Get dividend data
- `GET /api/dividendSummary?symbol=TICKER&shares=N` - Get calculated summary

### Protected Endpoints (Require Authentication)
- `GET /api/portfolio` - Get user's holdings
- `POST /api/portfolio` - Create new holding
- `PUT /api/portfolio/[id]` - Update holding shares
- `DELETE /api/portfolio/[id]` - Delete holding
- `POST /api/portfolio/refresh` - Refresh all holdings with latest data

## 🚀 Deployment

### Docker Compose (Recommended)

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d
```

### Environment Variables for Production

Update your `.env` file for production:

```bash
NODE_ENV=production
# Domain configuration is handled by Cloudflare Tunnel
```

### Cloudflare Tunnel (Optional)

For secure public access without exposing ports:

1. Set up Cloudflare Tunnel in Zero Trust Dashboard
2. Add `CF_TOKEN` to your `.env` file
3. Configure hostname routing:
   - `your-domain.com` → `frontend:3000`
   
The tunnel configuration is included in `docker-compose.yml` and will automatically connect when you provide a valid `CF_TOKEN`.

## 🔧 Development Commands

```bash
cd frontend
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production (standalone output)
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # TypeScript type checking
```

**Docker:**
```bash
docker-compose up --build         # Build and run application
docker-compose down               # Stop all services
docker-compose logs frontend      # View application logs
docker-compose logs cloudflare-tunnel  # View tunnel logs
docker-compose -f docker-compose-dev.yml up  # Development mode (no tunnel)
```

## 🛡️ Security

- Environment variables properly isolated in `.env` (never committed)
- Row Level Security (RLS) enabled on database
- JWT token authentication with Supabase
- CORS properly configured
- Input validation and sanitization
- Secure HTTPS connections in production

## 📁 Project Structure

```
dividend_tracker/
├── frontend/                    # Next.js full-stack application
│   ├── src/
│   │   ├── app/                # Next.js app router
│   │   │   ├── api/           # API routes
│   │   │   │   ├── portfolio/ # Portfolio endpoints
│   │   │   │   ├── utils/     # Auth, DB, and API helpers
│   │   │   │   └── ...        # Other API endpoints
│   │   │   └── ...            # Page components
│   │   ├── components/        # React components
│   │   └── lib/               # Client utilities
│   ├── lib/                   # Shared libraries
│   ├── Dockerfile             # Container configuration
│   └── package.json           # Dependencies
├── backend/                    # Legacy Go backend (deprecated)
├── docker-compose.yml         # Production orchestration
├── docker-compose-dev.yml     # Development orchestration
├── .env.example              # Environment template
├── CLAUDE.md                 # AI assistant instructions
└── README.md                 # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**Container Health Check Failures:**
- Ensure all required environment variables are set in `.env`
- Check container logs: `docker-compose logs frontend`
- Verify Supabase credentials are correct
- Increase health check start_period if needed

**API Rate Limits:**
- Financial Modeling Prep free tier: 250 requests/day
- Consider upgrading for higher limits in production

**Docker Issues:**
- Ensure port 3000 is not in use
- Check Docker daemon is running
- Verify environment variables are properly set
- Use `docker-compose build --no-cache` for clean rebuilds

**Frontend Build Issues:**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Create a new issue with detailed error information
- Include relevant logs and environment details

## 🔗 Links

- [Financial Modeling Prep API](https://financialmodelingprep.com/developer/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Compose](https://docs.docker.com/compose/)
- [TypeScript](https://www.typescriptlang.org/)