# 📈 Dividend Tracker

A modern, full-stack dividend portfolio tracking application that helps you monitor your dividend-paying investments with real-time market data and beautiful visualizations.

![Tech Stack](https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js)
![Tech Stack](https://img.shields.io/badge/Backend-Go-00ADD8?style=for-the-badge&logo=go)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![API](https://img.shields.io/badge/API-Financial_Modeling_Prep-FF6B6B?style=for-the-badge)

## ✨ Features

### 📊 **Portfolio Management**
- ➕ **Add Stocks**: Search and add dividend-paying stocks with validation
- ✏️ **Edit Holdings**: Update share quantities with real-time recalculation
- 🗑️ **Remove Stocks**: Clean portfolio management with confirmation dialogs
- 💾 **Database Persistence**: All changes automatically saved to Supabase

### 📈 **Real-Time Data**
- 💰 **Live Stock Prices**: Current market prices via Financial Modeling Prep API
- 🎯 **Dividend Yields**: Real-time dividend yield calculations
- 📅 **Historical Data**: Trailing 12-month dividend analysis
- 🔄 **Auto-Refresh**: Portfolio data stays current

### 📱 **Modern UI/UX**
- 🌙 **Dark Theme**: Professional dark mode interface
- 📊 **Interactive Charts**: Pie charts and bar graphs for portfolio visualization
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ⚡ **Loading States**: Smooth loading indicators and error handling

### 🎨 **Visualizations**
- 🥧 **Portfolio Breakdown**: Interactive pie chart showing investment distribution
- 📊 **Monthly Dividends**: Bar chart showing projected monthly income
- 📈 **Performance Metrics**: Total value, yields, and income projections

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
- [Node.js 18+](https://nodejs.org/)
- [Go 1.21+](https://golang.org/)
- [Supabase Account](https://supabase.com/)
- [Financial Modeling Prep API Key](https://financialmodelingprep.com/)

### 1️⃣ Clone Repository
```bash
git clone <your-repo-url>
cd dividend_tracker
```

### 2️⃣ Database Setup
1. Create a new project in [Supabase](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run:
```sql
CREATE TABLE portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(10) NOT NULL,
  company VARCHAR(255) NOT NULL,
  shares INTEGER NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  dividend_yield DECIMAL(5,2) NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  monthly_dividend DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3️⃣ Backend Configuration
```bash
cd backend
cp .env.example .env  # Create your environment file
```

Edit `backend/.env`:
```env
FMP_API_KEY=your_financial_modeling_prep_api_key
DATABASE_URL=postgresql://postgres:password@host:port/postgres?sslmode=require
```

Get your Supabase connection string from **Settings** → **Database** → **Connection string (URI)**

### 4️⃣ Frontend Setup
```bash
cd frontend
npm install
```

### 5️⃣ Run the Application

#### Option A: Docker (Recommended)
```bash
docker-compose up --build
```

#### Option B: Manual Development
```bash
# Terminal 1 - Backend
cd backend
go mod tidy
go run main.go

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 6️⃣ Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `FMP_API_KEY` | Financial Modeling Prep API key | `abc123...` |
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://...` |

#### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8080` |

### API Configuration
The app uses [Financial Modeling Prep](https://financialmodelingprep.com/) for:
- Real-time stock quotes
- Dividend history and yields  
- Company information

## 📚 API Endpoints

### Portfolio Management
- `GET /portfolio` - Get all holdings
- `POST /portfolio` - Add new stock
- `PUT /portfolio/:id` - Update holding
- `DELETE /portfolio/:id` - Remove stock
- `POST /portfolio/refresh` - Refresh all data

### Stock Data
- `GET /stockTicker?symbol=AAPL` - Get stock quote
- `GET /dividends?symbol=AAPL` - Get dividend data
- `GET /dividendSummary?symbol=AAPL&shares=100` - Get complete summary

## 🧪 Development

### Project Structure
```
frontend/src/
├── app/
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/
│   ├── dividend-tracker.tsx    # Main component
│   └── ui/            # Reusable UI components
└── lib/
    ├── api.ts         # API client
    └── utils.ts       # Utilities
```

### Adding New Features
1. **Frontend**: Add components in `frontend/src/components/`
2. **Backend**: Extend API in `backend/main.go`
3. **Database**: Add migrations via Supabase SQL Editor

### Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: Go standard formatting (`go fmt`)
- **Components**: TypeScript with strict types

## 🐳 Docker Deployment

### Production Build
```bash
docker-compose -f docker-compose.prod.yml up --build
```

### Environment Variables for Docker
Create `.env` files:
- `backend/.env` - Backend configuration
- `frontend/.env.local` - Frontend configuration

## 🔒 Security

### Environment Security
- ✅ Environment variables for sensitive data
- ✅ SSL/TLS for database connections
- ✅ API key rotation support
- ✅ CORS configuration

### Database Security
- ✅ Supabase Row Level Security (RLS)
- ✅ Prepared statements for SQL injection prevention
- ✅ Connection pooling and timeouts

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

## 📞 Support

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/dividend-tracker/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/dividend-tracker/discussions)

---

<div align="center">
  <p>Built with ❤️ for dividend investors</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
