# 📈 Dividend Tracker

A secure, full-stack dividend portfolio tracking application with user authentication that helps you monitor your dividend-paying investments with real-time market data and beautiful visualizations.

![Tech Stack](https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js)
![Tech Stack](https://img.shields.io/badge/Backend-Go-00ADD8?style=for-the-badge&logo=go)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![API](https://img.shields.io/badge/API-Financial_Modeling_Prep-FF6B6B?style=for-the-badge)
![Auth](https://img.shields.io/badge/Auth-Supabase_Auth-3ECF8E?style=for-the-badge&logo=supabase)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

## ✨ Features

### 🔐 **Secure Authentication**
- 🔑 **Multiple Login Options**: Email/password and Google OAuth
- 👤 **User Registration**: Create accounts with email verification
- 🛡️ **JWT Security**: Secure token-based authentication
- 🔒 **Data Isolation**: Each user sees only their own portfolio data
- 🚪 **Session Management**: Persistent sessions with auto-refresh

### 📊 **Portfolio Management**
- ➕ **Add Stocks**: Search and add dividend-paying stocks with validation
- ✏️ **Edit Holdings**: Update share quantities with real-time recalculation
- 🗑️ **Remove Stocks**: Clean portfolio management with confirmation dialogs
- 💾 **Database Persistence**: All changes automatically saved to Supabase
- 👥 **Multi-User Support**: Secure user-specific data storage

### 📈 **Real-Time Data**
- 💰 **Live Stock Prices**: Current market prices via Financial Modeling Prep API
- 🎯 **Dividend Yields**: Real-time dividend yield calculations
- 📅 **Historical Data**: Trailing 12-month dividend analysis
- 🔄 **Auto-Refresh**: Portfolio data stays current
- 📊 **Market Integration**: Professional-grade financial data

### 📱 **Modern UI/UX**
- 🌙 **Dark Theme**: Professional dark mode interface
- 📊 **Interactive Charts**: Pie charts and bar graphs for portfolio visualization
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ⚡ **Loading States**: Smooth loading indicators and error handling
- 🎨 **Professional Design**: Clean, intuitive interface

### 🎨 **Advanced Visualizations**
- 🥧 **Portfolio Breakdown**: Interactive pie chart showing investment distribution
- 📊 **Monthly Dividends**: Bar chart showing projected monthly income
- 📈 **Performance Metrics**: Total value, yields, and income projections
- 📋 **Detailed Tables**: Comprehensive portfolio overview with sorting

### 🐳 **DevOps Ready**
- 📦 **Docker Support**: Complete containerization with docker-compose
- 🔧 **Development Mode**: Hot reloading for rapid development
- 🚀 **Production Ready**: Optimized builds and deployment
- 📋 **Health Checks**: Automatic service monitoring
- 🛠️ **Easy Management**: Simple Makefile commands

## 🏗️ Architecture

```
dividend_tracker/
├── frontend/          # Next.js React application
│   ├── src/
│   │   ├── app/       # Next.js 13+ app router
│   │   ├── components/# React components
│   │   └── lib/       # Utilities and API client
│   └── package.json
├── backend/           # Go API server
│   ├── main.go        # Main application
│   ├── go.mod         # Go dependencies
│   └── .env           # Environment variables
├── docker-compose.yml # Docker orchestration
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Recommended)
- OR [Node.js 18+](https://nodejs.org/) + [Go 1.21+](https://golang.org/)
- [Supabase Account](https://supabase.com/)
- [Financial Modeling Prep API Key](https://financialmodelingprep.com/)

### 1️⃣ Clone Repository
```bash
git clone <your-repo-url>
cd dividend_tracker
```

### 2️⃣ Supabase Setup
1. Create a new project in [Supabase](https://supabase.com/dashboard)
2. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon public key
   - JWT Secret
3. Go to **SQL Editor** and run the database migration:
```sql
-- Run the contents of database_migration.sql
```

### 3️⃣ Google OAuth Setup (Optional)
1. In Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials

### 4️⃣ Environment Configuration
Edit `backend/.env`:
```env
FMP_API_KEY=your_financial_modeling_prep_api_key
DATABASE_URL=your_supabase_database_url
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

### 5️⃣ Run the Application

#### 🐳 Option A: Docker (Recommended)
```bash
# Start everything with one command
make up

# OR manually
docker-compose up --build
```

#### 💻 Option B: Manual Development
```bash
# Terminal 1 - Backend
cd backend
go mod tidy
go run main.go

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

### 6️⃣ Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **First Login**: Create account or use Google OAuth

## 🐳 Docker Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services (production) |
| `make dev` | Start with hot reloading |
| `make down` | Stop all services |
| `make logs` | View all logs |
| `make health` | Check service status |
| `make clean` | Clean up everything |

See [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md) for detailed Docker usage.

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `FMP_API_KEY` | Financial Modeling Prep API key | ✅ | `abc123...` |
| `DATABASE_URL` | Supabase PostgreSQL connection string | ✅ | `postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres` |
| `SUPABASE_JWT_SECRET` | Supabase JWT verification secret | ✅ | `your-jwt-secret-from-supabase-dashboard` |

#### Frontend (Auto-configured in Docker)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://backend:8080` (Docker) / `http://localhost:8080` (local) |

### API Configuration
- **[Financial Modeling Prep](https://financialmodelingprep.com/)**: Real-time stock quotes, dividend data, company info
- **[Supabase](https://supabase.com/)**: Database, authentication, real-time features

## 📚 API Endpoints

### 🔐 Authentication Required
All portfolio endpoints require valid JWT token in Authorization header.

#### Portfolio Management
- `GET /portfolio` - Get user's holdings
- `POST /portfolio` - Add new stock to portfolio
- `PUT /portfolio/:id` - Update holding shares
- `DELETE /portfolio/:id` - Remove stock from portfolio
- `POST /portfolio/refresh` - Refresh all portfolio data

### 🌐 Public Endpoints
#### Stock Data
- `GET /stockTicker?symbol=AAPL` - Get current stock quote
- `GET /dividends?symbol=AAPL` - Get dividend history and yield
- `GET /dividendSummary?symbol=AAPL&shares=100` - Get complete investment summary

#### Health Check
- `GET /` - API status and endpoint list

## 🧪 Development

### Project Structure
```
dividend_tracker/
├── 📁 frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout with AuthProvider
│   │   │   └── page.tsx       # Protected main page
│   │   ├── components/
│   │   │   ├── auth/          # Authentication components
│   │   │   │   ├── auth-page.tsx     # Login/signup container
│   │   │   │   ├── login-form.tsx    # Login form with Google OAuth
│   │   │   │   └── signup-form.tsx   # Registration form
│   │   │   ├── dividend-tracker.tsx  # Main portfolio component
│   │   │   └── ui/            # Reusable UI components
│   │   ├── lib/
│   │   │   ├── auth-context.tsx      # Authentication state management
│   │   │   ├── api.ts         # API client with JWT tokens
│   │   │   └── utils.ts       # Utilities
│   │   └── database.types.ts  # TypeScript types for Supabase
│   ├── lib/
│   │   └── supabase.ts        # Supabase client configuration
│   ├── Dockerfile             # Frontend Docker image
│   ├── .dockerignore         # Docker ignore rules
│   └── package.json
├── 📁 backend/                # Go API server
│   ├── main.go               # Main application with JWT auth
│   ├── go.mod                # Go dependencies
│   ├── .env                  # Environment variables (not in git)
│   ├── Dockerfile            # Backend Docker image
│   └── .dockerignore         # Docker ignore rules
├── 📁 Docker & DevOps
│   ├── docker-compose.yml    # Production Docker setup
│   ├── docker-compose.dev.yml # Development overrides
│   ├── Makefile              # Easy Docker management
│   ├── DOCKER_SETUP.md       # Comprehensive Docker guide
│   └── DOCKER_QUICK_START.md # Quick Docker reference
├── 📁 Database & Security
│   ├── database_migration.sql # Database setup with RLS
│   ├── verify_migration.sql  # Migration verification
│   ├── security_analysis.md  # Security assessment report
│   └── test_auth.md          # Authentication testing guide
└── 📁 Documentation
    ├── README.md             # This file
    └── GET_JWT_SECRET.md     # JWT secret setup guide
```

### Key Files Added for Authentication
- `frontend/src/lib/auth-context.tsx` - React context for auth state
- `frontend/src/components/auth/` - Login/signup components
- `backend/main.go` - JWT middleware and user-scoped queries
- `database_migration.sql` - Database schema with user_id and RLS
- `security_analysis.md` - Comprehensive security assessment

### Adding New Features
1. **Frontend**: Add components in `frontend/src/components/`
2. **Backend**: Extend API in `backend/main.go`
3. **Database**: Add migrations via Supabase SQL Editor

### Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: Go standard formatting (`go fmt`)
- **Components**: TypeScript with strict types

## 🐳 Docker Deployment

### Development
```bash
# Hot reloading for development
make dev

# OR with docker-compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production
```bash
# Optimized production build
make up

# OR manually
docker-compose up -d --build
```

### Docker Features
- ✅ **Multi-stage builds** for optimized images
- ✅ **Health checks** for automatic recovery
- ✅ **Service dependencies** with proper startup order
- ✅ **Development mode** with volume mounts for hot reloading
- ✅ **Production mode** with standalone builds
- ✅ **Network isolation** with custom Docker network

## 🔒 Security

### Authentication & Authorization
- ✅ **JWT Token Verification** with Supabase secrets
- ✅ **Google OAuth Integration** for secure login
- ✅ **User Data Isolation** - each user sees only their data
- ✅ **Session Management** with automatic token refresh
- ✅ **Protected API Endpoints** with middleware validation

### Environment Security
- ✅ **Environment variables** for all sensitive data
- ✅ **SSL/TLS encryption** for database connections
- ✅ **API key rotation** support
- ✅ **CORS configuration** for frontend security
- ✅ **Docker secrets** ready for production

### Database Security
- ✅ **Row Level Security (RLS)** policies in Supabase
- ✅ **Prepared statements** for SQL injection prevention
- ✅ **Connection pooling** and timeouts
- ✅ **User ID filtering** on all queries
- ✅ **Foreign key constraints** to auth.users table

### Security Analysis
Run the included security analysis:
```bash
# View security report
cat security_analysis.md

# Check authentication implementation
cat test_auth.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Contribution Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Use conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Financial Modeling Prep](https://financialmodelingprep.com/) for market data API
- [Supabase](https://supabase.com/) for database and backend services
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for data visualization

## 📋 File Reference

### 🔧 Configuration Files
- `backend/.env` - Environment variables (create from template)
- `frontend/.mcp.json` - MCP server configuration for development
- `docker-compose.yml` - Production Docker setup
- `docker-compose.dev.yml` - Development Docker overrides

### 📚 Documentation
- `DOCKER_QUICK_START.md` - Quick Docker commands and troubleshooting
- `DOCKER_SETUP.md` - Comprehensive Docker deployment guide
- `security_analysis.md` - Security assessment and recommendations
- `test_auth.md` - Authentication testing checklist

### 🛠️ Database & Setup
- `database_migration.sql` - Initial database schema with RLS
- `verify_migration.sql` - Migration verification queries
- `GET_JWT_SECRET.md` - Guide to get Supabase JWT secret

### ⚙️ Management
- `Makefile` - Docker management commands (`make up`, `make dev`, etc.)

## 🔄 Version History

### v2.0.0 - Authentication & Security (Current)
- ✅ **User Authentication** with Supabase Auth
- ✅ **Google OAuth** integration
- ✅ **JWT Security** with token verification
- ✅ **User Data Isolation** with RLS policies
- ✅ **Docker Support** with development and production modes
- ✅ **Security Analysis** and testing guides

### v1.0.0 - Basic Portfolio Tracker
- ✅ Portfolio management (add/edit/remove stocks)
- ✅ Real-time market data integration
- ✅ Interactive charts and visualizations
- ✅ Responsive dark theme UI

## 📞 Support

- 🐛 **Issues**: Use GitHub Issues for bug reports and feature requests
- 💬 **Questions**: Check existing documentation first, then create an issue
- 🔐 **Security**: For security vulnerabilities, please create a private issue

## 🙏 Acknowledgments

- [Financial Modeling Prep](https://financialmodelingprep.com/) for comprehensive market data API
- [Supabase](https://supabase.com/) for authentication, database, and backend services
- [Next.js](https://nextjs.org/) for the powerful React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Recharts](https://recharts.org/) for beautiful data visualization
- [Docker](https://docker.com/) for containerization and deployment

---

<div align="center">
  <p>🚀 <strong>Ready to track your dividends?</strong></p>
  <p>Run <code>make up</code> and visit <a href="http://localhost:3000">localhost:3000</a></p>
  <p>Built with ❤️ for dividend investors</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
