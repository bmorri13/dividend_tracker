# 📈 Dividend Portfolio Tracker

A full-stack web application for tracking dividend-paying stocks and monitoring portfolio performance. Built with Go, Next.js, and Supabase.

## 🚀 Features

- **Portfolio Management**: Add, edit, and remove dividend stocks from your portfolio
- **Real-time Data**: Live stock quotes and dividend information via Financial Modeling Prep API
- **Performance Analytics**: Track total portfolio value, monthly dividend income, and yield metrics
- **Interactive Charts**: Visualize portfolio composition and dividend trends
- **User Authentication**: Secure login/signup with Supabase authentication
- **Responsive Design**: Modern UI that works on desktop and mobile devices

## 🏗️ Architecture

**Frontend (Next.js 15)**
- React 19 with TypeScript
- Tailwind CSS v4 for styling
- Radix UI components
- Recharts for data visualization
- Supabase authentication client

**Backend (Go 1.21)**
- Gin framework HTTP server
- PostgreSQL database with Supabase
- JWT authentication
- Financial Modeling Prep API integration

**Database**
- PostgreSQL via Supabase
- User authentication and session management
- Portfolio holdings storage

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Go** (v1.21 or higher)
- **Docker & Docker Compose** (for containerized development)
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
3. Copy the Project URL and anon public key to `.env`
4. Navigate to Settings > Database
5. Copy the connection string to `.env` as `DATABASE_URL`

### 5. Run with Docker (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
```

### 6. Manual Development Setup

**Backend:**
```bash
cd backend
go mod tidy
go run main.go
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
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

# Backend tests
cd backend
go test ./...

# E2E tests with Playwright
npm run test:e2e
```

## 📊 API Endpoints

### Public Endpoints
- `GET /` - API information
- `GET /stockTicker?symbol=TICKER` - Get stock quote
- `GET /dividends?symbol=TICKER` - Get dividend data
- `GET /dividendSummary?symbol=TICKER&shares=N` - Get calculated summary

### Protected Endpoints (Require Authentication)
- `GET /portfolio` - Get user's holdings
- `POST /portfolio` - Create new holding
- `PUT /portfolio/:id` - Update holding shares
- `DELETE /portfolio/:id` - Delete holding
- `POST /portfolio/refresh` - Refresh all holdings with latest data

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
GIN_MODE=release
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### Cloudflare Tunnel (Optional)

For secure public access without exposing ports:

1. Set up Cloudflare Tunnel in Zero Trust Dashboard
2. Add `CF_TOKEN` to your `.env` file
3. Configure hostname routing:
   - `your-domain.com` → `frontend:3000`
   - `your-domain.com/api` → `backend:8080`

## 🔧 Development Commands

**Frontend:**
```bash
cd frontend
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # TypeScript type checking
```

**Backend:**
```bash
cd backend
go run main.go       # Start Go server
go mod tidy          # Clean up dependencies
go build             # Build binary
```

**Docker:**
```bash
docker-compose up --build    # Build and run all services
docker-compose down          # Stop all services
docker-compose logs backend  # View backend logs
docker-compose logs frontend # View frontend logs
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
├── backend/                 # Go API server
│   ├── main.go             # Main application entry point
│   ├── Dockerfile          # Backend container configuration
│   └── go.mod              # Go dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and configurations
│   ├── lib/               # Shared libraries
│   ├── Dockerfile         # Frontend container configuration
│   └── package.json       # Node.js dependencies
├── docker-compose.yml      # Multi-container orchestration
├── .env.example           # Environment variables template
├── .env.test.example      # Test environment template
└── README.md              # This file
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

**Database Connection Issues:**
- Verify DATABASE_URL format and credentials
- Check if Supabase project is active
- Ensure port 6543 (transaction mode) or 5432 (session mode) is accessible

**API Rate Limits:**
- Financial Modeling Prep free tier: 250 requests/day
- Consider upgrading for higher limits in production

**Docker Issues:**
- Ensure ports 3000 and 8080 are not in use
- Check Docker daemon is running
- Verify environment variables are properly set

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
- [Go Gin Framework](https://gin-gonic.com/)
- [Docker Compose](https://docs.docker.com/compose/)