# Changelog

All notable changes to the Dividend Tracker project will be documented in this file.

## [2.0.0] - 2025-01-14

### 🔐 Added - Authentication & Security
- **User Authentication** with Supabase Auth
- **Google OAuth** integration for easy login
- **Email/Password** registration and login
- **JWT Token Verification** in backend with HMAC signing
- **User Data Isolation** - each user sees only their own portfolio
- **Row Level Security (RLS)** policies in database
- **Protected API Endpoints** with authentication middleware
- **Session Management** with automatic token refresh

### 🐳 Added - Docker Support
- **Complete Docker Setup** with docker-compose
- **Multi-stage Dockerfiles** for optimized builds
- **Development Mode** with hot reloading and volume mounts
- **Production Mode** with standalone builds
- **Health Checks** for automatic service recovery
- **Service Dependencies** with proper startup order
- **Custom Docker Network** for secure service communication
- **Makefile** for easy Docker management (`make up`, `make dev`, etc.)

### 📚 Added - Documentation
- **Comprehensive README** with authentication and Docker instructions
- **DOCKER_QUICK_START.md** - Quick Docker commands and troubleshooting
- **DOCKER_SETUP.md** - Detailed Docker deployment guide
- **security_analysis.md** - Security assessment and recommendations
- **test_auth.md** - Authentication testing checklist
- **database_migration.sql** - Database schema with user_id and RLS
- **verify_migration.sql** - Migration verification queries
- **GET_JWT_SECRET.md** - Guide to get Supabase JWT secret

### 🛠️ Added - Development Tools
- **MCP Integration** with Supabase and Semgrep servers
- **Security Analysis** tools and reports
- **Development Docker Compose** override for hot reloading
- **Enhanced .gitignore** with Docker and security patterns
- **Environment Variable Templates** and configuration guides

### 🔧 Changed - Architecture
- **Frontend**: Added authentication components and context
- **Backend**: Added JWT middleware and user-scoped database queries
- **Database**: Added user_id column and RLS policies to portfolio_holdings table
- **API**: All portfolio endpoints now require authentication
- **State Management**: Added null checks and error handling improvements

### 🐛 Fixed
- **Frontend State Errors**: Fixed "prev is not iterable" errors in state updates
- **Null Pointer Issues**: Added proper null checks throughout the application
- **TypeScript Errors**: Fixed type issues in dialog components
- **Build Configuration**: Updated Next.js config to remove deprecated options

### 🔒 Security Enhancements
- **Environment Variable Security**: All secrets moved to .env files
- **JWT Secret Protection**: Secure token verification with Supabase
- **CORS Configuration**: Proper cross-origin request handling
- **Database Security**: Row-level security and prepared statements
- **User Input Validation**: Enhanced API endpoint validation
- **Error Handling**: Secure error messages without information leakage

## [1.0.0] - Initial Release

### ✨ Features
- **Portfolio Management**: Add, edit, and remove dividend-paying stocks
- **Real-Time Data**: Live stock prices and dividend information via Financial Modeling Prep API
- **Interactive Visualizations**: Pie charts and bar graphs for portfolio analysis
- **Responsive UI**: Dark theme interface with mobile support
- **Database Integration**: Supabase PostgreSQL for data persistence
- **Modern Tech Stack**: Next.js frontend with Go backend

### 🏗️ Architecture
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Go with Gin framework and PostgreSQL
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Charts**: Recharts for data visualization
- **API**: Financial Modeling Prep for market data

---

## Migration Guide from v1.0.0 to v2.0.0

### Required Steps:
1. **Database Migration**: Run `database_migration.sql` to add user authentication support
2. **Environment Variables**: Add `SUPABASE_JWT_SECRET` to your backend/.env file
3. **Google OAuth**: Configure Google provider in Supabase dashboard (optional)
4. **Docker**: Use new Docker setup for simplified deployment

### Breaking Changes:
- All portfolio API endpoints now require authentication
- Database schema updated with user_id column and RLS policies
- Frontend requires authentication before accessing portfolio features

### Backward Compatibility:
- Existing portfolio data will be preserved (user_id will be null until assigned)
- Public API endpoints (stock quotes, dividends) remain unchanged
- Previous manual deployment methods still work alongside new Docker setup