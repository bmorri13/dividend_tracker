package main

import (
	"context"
	"crypto/rsa"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type StockQuote struct {
	Symbol string `json:"symbol"`
	Price  string `json:"price"`
}

type DividendData struct {
	Symbol          string `json:"symbol"`
	AnnualDividend  string `json:"annual_dividend"`
	StockPrice      string `json:"stock_price"`
	DividendYield   string `json:"dividend_yield"`
	DividendsCount  int    `json:"dividends_count"`
	EvaluatedPeriod string `json:"evaluated_period"`
}

type DividendSummary struct {
	Ticker          string  `json:"ticker"`
	Company         string  `json:"company"`
	Shares          int     `json:"shares"`
	CurrentPrice    float64 `json:"currentPrice"`
	DividendYield   float64 `json:"dividendYield"`
	TotalValue      float64 `json:"totalValue"`
	MonthlyDividend float64 `json:"monthlyDividend"`
}

type PortfolioHolding struct {
	ID              string    `json:"id" db:"id"`
	Ticker          string    `json:"ticker" db:"ticker"`
	Company         string    `json:"company" db:"company"`
	Shares          int       `json:"shares" db:"shares"`
	CurrentPrice    float64   `json:"current_price" db:"current_price"`
	DividendYield   float64   `json:"dividend_yield" db:"dividend_yield"`
	TotalValue      float64   `json:"total_value" db:"total_value"`
	MonthlyDividend float64   `json:"monthly_dividend" db:"monthly_dividend"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

type CreateHoldingRequest struct {
	Ticker string `json:"ticker" binding:"required"`
	Shares int    `json:"shares" binding:"required,min=1"`
}

type UpdateHoldingRequest struct {
	Shares int `json:"shares" binding:"required,min=1"`
}

type SupabaseJWTClaims struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

type JWK struct {
	Kty string `json:"kty"`
	Use string `json:"use"`
	Kid string `json:"kid"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type JWKSet struct {
	Keys []JWK `json:"keys"`
}

var db *sql.DB
var supabaseJWKS *JWKSet

type FMPQuoteResponse []struct {
	Symbol string  `json:"symbol"`
	Name   string  `json:"name"`
	Price  float64 `json:"price"`
}

type FMPProfileResponse []struct {
	Symbol      string  `json:"symbol"`
	CompanyName string  `json:"companyName"`
	Price       float64 `json:"price"`
}

type FMPDividendResponse []struct {
	Date             string  `json:"date"`
	Label            string  `json:"label"`
	AdjDividend      float64 `json:"adjDividend"`
	Dividend         float64 `json:"dividend"`
	RecordDate       string  `json:"recordDate"`
	PaymentDate      string  `json:"paymentDate"`
	DeclarationDate  string  `json:"declarationDate"`
}

// For development, we'll use the Supabase JWT secret directly
// In production, you should use JWKS verification
func verifySupabaseJWTWithSecret(tokenString, jwtSecret string) (*SupabaseJWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*SupabaseJWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func parseRSAPublicKey(n, e string) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(n)
	if err != nil {
		return nil, err
	}

	eBytes, err := base64.RawURLEncoding.DecodeString(e)
	if err != nil {
		return nil, err
	}

	nInt := new(big.Int).SetBytes(nBytes)
	var eInt int
	for _, b := range eBytes {
		eInt = eInt<<8 + int(b)
	}

	return &rsa.PublicKey{
		N: nInt,
		E: eInt,
	}, nil
}

func verifySupabaseJWT(tokenString string) (*SupabaseJWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("kid header missing")
		}

		for _, key := range supabaseJWKS.Keys {
			if key.Kid == kid {
				return parseRSAPublicKey(key.N, key.E)
			}
		}

		return nil, fmt.Errorf("key not found")
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*SupabaseJWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		
		// Get JWT secret from environment
		jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
		if jwtSecret == "" {
			fmt.Println("Warning: SUPABASE_JWT_SECRET not set")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Server configuration error"})
			c.Abort()
			return
		}
		
		claims, err := verifySupabaseJWTWithSecret(tokenString, jwtSecret)
		if err != nil {
			fmt.Printf("JWT verification error: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.Sub)
		c.Set("user_email", claims.Email)
		c.Next()
	}
}

func fetchFMPQuote(symbol, apiKey string) (float64, string, error) {
	url := fmt.Sprintf("https://financialmodelingprep.com/api/v3/quote/%s?apikey=%s", symbol, apiKey)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return 0, "", fmt.Errorf("failed to fetch quote from FMP: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return 0, "", fmt.Errorf("FMP API returned status %d", resp.StatusCode)
	}

	var fmpResp FMPQuoteResponse
	if err := json.NewDecoder(resp.Body).Decode(&fmpResp); err != nil {
		return 0, "", fmt.Errorf("failed to parse FMP response: %v", err)
	}

	if len(fmpResp) == 0 {
		return 0, "", fmt.Errorf("no quote data found for symbol %s", symbol)
	}

	return fmpResp[0].Price, fmpResp[0].Name, nil
}

func fetchFMPProfile(symbol, apiKey string) (string, error) {
	url := fmt.Sprintf("https://financialmodelingprep.com/api/v3/profile/%s?apikey=%s", symbol, apiKey)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return symbol, nil // Return symbol as fallback
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return symbol, nil // Return symbol as fallback
	}

	var fmpResp FMPProfileResponse
	if err := json.NewDecoder(resp.Body).Decode(&fmpResp); err != nil {
		return symbol, nil // Return symbol as fallback
	}

	if len(fmpResp) == 0 || fmpResp[0].CompanyName == "" {
		return symbol, nil
	}

	return fmpResp[0].CompanyName, nil
}

func fetchFMPDividends(symbol, apiKey string) (float64, float64, error) {
	url := fmt.Sprintf("https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/%s?apikey=%s", symbol, apiKey)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to fetch dividends from FMP: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return 0, 0, fmt.Errorf("FMP dividend API returned status %d", resp.StatusCode)
	}

	var fmpResp struct {
		Symbol     string `json:"symbol"`
		Historical []struct {
			Date             string  `json:"date"`
			Label            string  `json:"label"`
			AdjDividend      float64 `json:"adjDividend"`
			Dividend         float64 `json:"dividend"`
			RecordDate       string  `json:"recordDate"`
			PaymentDate      string  `json:"paymentDate"`
			DeclarationDate  string  `json:"declarationDate"`
		} `json:"historical"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&fmpResp); err != nil {
		return 0, 0, fmt.Errorf("failed to parse FMP dividend response: %v", err)
	}

	if len(fmpResp.Historical) == 0 {
		return 0, 0, nil // No dividends
	}

	// Calculate annual dividend from last 4 quarters
	var annualDividend float64
	oneYearAgo := time.Now().AddDate(-1, 0, 0)
	
	for _, div := range fmpResp.Historical {
		divDate, err := time.Parse("2006-01-02", div.Date)
		if err != nil {
			continue
		}
		if divDate.After(oneYearAgo) {
			annualDividend += div.AdjDividend
		}
	}

	// Get current price to calculate yield
	price, _, err := fetchFMPQuote(symbol, apiKey)
	if err != nil || price == 0 {
		return annualDividend, 0, nil
	}

	dividendYield := (annualDividend / price) * 100
	return annualDividend, dividendYield, nil
}

func getStockQuote(symbol, apiKey string) (*StockQuote, error) {
	price, _, err := fetchFMPQuote(symbol, apiKey)
	if err != nil {
		return nil, err
	}

	return &StockQuote{
		Symbol: symbol,
		Price:  fmt.Sprintf("%.2f", price),
	}, nil
}

func getDividendData(symbol, apiKey string) (*DividendData, error) {
	price, _, err := fetchFMPQuote(symbol, apiKey)
	if err != nil {
		return nil, err
	}

	annualDividend, dividendYield, err := fetchFMPDividends(symbol, apiKey)
	if err != nil {
		return nil, err
	}

	return &DividendData{
		Symbol:          symbol,
		AnnualDividend:  fmt.Sprintf("%.4f", annualDividend),
		StockPrice:      fmt.Sprintf("%.2f", price),
		DividendYield:   fmt.Sprintf("%.2f%%", dividendYield),
		DividendsCount:  1,
		EvaluatedPeriod: "trailing 12 months",
	}, nil
}

func getDividendSummary(symbol, apiKey string, shares int) (*DividendSummary, error) {
	fmt.Printf("Getting data for %s\n", symbol)
	
	currentPrice, _, err := fetchFMPQuote(symbol, apiKey)
	if err != nil {
		fmt.Printf("Error getting quote: %v\n", err)
		return nil, err
	}

	annualDividend, dividendYield, err := fetchFMPDividends(symbol, apiKey)
	if err != nil {
		fmt.Printf("Error getting dividends: %v\n", err)
		return nil, err
	}

	companyName, err := fetchFMPProfile(symbol, apiKey)
	if err != nil {
		companyName = symbol // Fallback to symbol
	}

	totalValue := currentPrice * float64(shares)
	monthlyDividend := (annualDividend * float64(shares)) / 12

	fmt.Printf("Data received for %s: Price=%.2f, Dividend=%.4f, Yield=%.2f%%\n", 
		symbol, currentPrice, annualDividend, dividendYield)

	return &DividendSummary{
		Ticker:          symbol,
		Company:         companyName,
		Shares:          shares,
		CurrentPrice:    currentPrice,
		DividendYield:   float64(int(dividendYield*100))/100, // Round to 2 decimal places
		TotalValue:      totalValue,
		MonthlyDividend: monthlyDividend,
	}, nil
}

// Database functions
func initDB() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is required")
	}

	// Check connection type: direct (port 5432), pooler transaction mode (port 6543), or session mode (port 5432 with pooler)
	isDirectConnection := strings.Contains(dbURL, ":5432") && !strings.Contains(dbURL, "pooler")
	isSessionMode := strings.Contains(dbURL, "pooler") && strings.Contains(dbURL, ":5432")
	isTransactionMode := strings.Contains(dbURL, "pooler") && strings.Contains(dbURL, ":6543")
	
	// Configure URL parameters based on connection type
	// For SCRAM-SHA-256 authentication, we need to ensure proper SSL and auth settings
	if isDirectConnection {
		// Direct connections to Supabase require SSL
		if !strings.Contains(dbURL, "?") {
			dbURL += "?sslmode=require&application_name=dividend_tracker"
		} else {
			if !strings.Contains(dbURL, "sslmode") {
				dbURL += "&sslmode=require"
			}
			if !strings.Contains(dbURL, "application_name") {
				dbURL += "&application_name=dividend_tracker"
			}
		}
	} else if isSessionMode {
		// Session mode (Supavisor) - requires specific parameters for session pooling
		// SCRAM-SHA-256 requires proper SSL configuration
		if !strings.Contains(dbURL, "?") {
			dbURL += "?sslmode=require&application_name=dividend_tracker"
		} else {
			if !strings.Contains(dbURL, "sslmode") {
				dbURL += "&sslmode=require"
			}
			if !strings.Contains(dbURL, "application_name") {
				dbURL += "&application_name=dividend_tracker"
			}
		}
	} else if isTransactionMode {
		// Transaction mode pooler connections - optimized for SCRAM-SHA-256
		if !strings.Contains(dbURL, "connect_timeout") {
			if strings.Contains(dbURL, "?") {
				dbURL += "&connect_timeout=15"
			} else {
				dbURL += "?connect_timeout=15"
			}
		}
		if !strings.Contains(dbURL, "application_name") {
			dbURL += "&application_name=dividend_tracker"
		}
		// For transaction mode, we may need to specify the auth method explicitly
		if !strings.Contains(dbURL, "auth_method") {
			dbURL += "&auth_method=scram-sha-256"
		}
	}

	fmt.Printf("Attempting database connection to: %s\n", strings.Split(dbURL, "@")[1]) // Log without credentials
	
	// Add connection debugging
	if isSessionMode {
		fmt.Println("Detected Supavisor Session Mode connection")
	} else if isTransactionMode {
		fmt.Println("Detected Supavisor Transaction Mode connection")
	} else {
		fmt.Println("Detected Direct connection")
	}
	
	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// Configure connection pool based on connection type
	if isDirectConnection {
		// Direct connection - conservative settings
		db.SetMaxOpenConns(5)
		db.SetMaxIdleConns(2)
		db.SetConnMaxLifetime(5 * time.Minute)
		db.SetConnMaxIdleTime(1 * time.Minute)
	} else if isSessionMode {
		// Session mode - can handle more connections but with longer lifetimes
		db.SetMaxOpenConns(20)
		db.SetMaxIdleConns(5)
		db.SetConnMaxLifetime(30 * time.Minute) // Longer lifetime for session mode
		db.SetConnMaxIdleTime(5 * time.Minute)
	} else {
		// Transaction mode - optimized for Supavisor transaction pooling
		db.SetMaxOpenConns(15)
		db.SetMaxIdleConns(3)
		db.SetConnMaxLifetime(10 * time.Minute)
		db.SetConnMaxIdleTime(1 * time.Minute)
	}

	// Test the connection with timeout and better error handling
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err = db.PingContext(ctx); err != nil {
		// Check if it's a SCRAM authentication error
		if strings.Contains(err.Error(), "SCRAM-SHA-256") {
			return fmt.Errorf("SCRAM-SHA-256 authentication failed. Please verify your DATABASE_URL password is correct in .env file. Original error: %v", err)
		}
		return fmt.Errorf("failed to ping database: %v", err)
	}

	if isSessionMode {
		fmt.Println("Connected to database successfully (Session Mode)")
	} else if isTransactionMode {
		fmt.Println("Connected to database successfully (Transaction Mode)")
	} else {
		fmt.Println("Connected to database successfully (Direct Connection)")
	}
	return nil
}

func createHolding(ticker string, shares int, apiKey string, userID string) (*PortfolioHolding, error) {
	if db == nil {
		return nil, fmt.Errorf("database unavailable - cannot create holdings")
	}
	
	// Get current stock data
	summary, err := getDividendSummary(ticker, apiKey, shares)
	if err != nil {
		return nil, fmt.Errorf("failed to get stock data: %v", err)
	}

	// Insert into database (Supabase auto-generates UUID for id)
	query := `
		INSERT INTO portfolio_holdings (ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, user_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	
	var holding PortfolioHolding
	err = db.QueryRow(query, 
		summary.Ticker,
		summary.Company, 
		summary.Shares,
		summary.CurrentPrice,
		summary.DividendYield,
		summary.TotalValue,
		summary.MonthlyDividend,
		userID,
	).Scan(&holding.ID, &holding.CreatedAt, &holding.UpdatedAt)
	
	if err != nil {
		return nil, fmt.Errorf("failed to insert holding: %v", err)
	}

	// Populate the rest of the fields
	holding.Ticker = summary.Ticker
	holding.Company = summary.Company
	holding.Shares = summary.Shares
	holding.CurrentPrice = summary.CurrentPrice
	holding.DividendYield = summary.DividendYield
	holding.TotalValue = summary.TotalValue
	holding.MonthlyDividend = summary.MonthlyDividend

	return &holding, nil
}

func getHoldings(userID string) ([]PortfolioHolding, error) {
	query := `
		SELECT id, ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, created_at, updated_at
		FROM portfolio_holdings
		WHERE user_id = $1
		ORDER BY ticker
	`
	
	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query holdings: %v", err)
	}
	defer rows.Close()

	var holdings []PortfolioHolding
	for rows.Next() {
		var h PortfolioHolding
		err := rows.Scan(
			&h.ID, &h.Ticker, &h.Company, &h.Shares,
			&h.CurrentPrice, &h.DividendYield, &h.TotalValue,
			&h.MonthlyDividend, &h.CreatedAt, &h.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan holding: %v", err)
		}
		holdings = append(holdings, h)
	}

	return holdings, nil
}

func updateHolding(id string, shares int, apiKey string, userID string) (*PortfolioHolding, error) {
	if db == nil {
		return nil, fmt.Errorf("database unavailable - cannot update holdings")
	}
	
	// First get the current holding to get the ticker
	var ticker string
	err := db.QueryRow("SELECT ticker FROM portfolio_holdings WHERE id = $1 AND user_id = $2", id, userID).Scan(&ticker)
	if err != nil {
		return nil, fmt.Errorf("holding not found: %v", err)
	}

	// Get updated stock data
	summary, err := getDividendSummary(ticker, apiKey, shares)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated stock data: %v", err)
	}

	// Update the holding
	query := `
		UPDATE portfolio_holdings 
		SET shares = $1, current_price = $2, dividend_yield = $3, total_value = $4, monthly_dividend = $5, updated_at = NOW()
		WHERE id = $6 AND user_id = $7
		RETURNING id, ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, created_at, updated_at
	`
	
	var holding PortfolioHolding
	err = db.QueryRow(query,
		summary.Shares,
		summary.CurrentPrice,
		summary.DividendYield,
		summary.TotalValue,
		summary.MonthlyDividend,
		id,
		userID,
	).Scan(
		&holding.ID, &holding.Ticker, &holding.Company, &holding.Shares,
		&holding.CurrentPrice, &holding.DividendYield, &holding.TotalValue,
		&holding.MonthlyDividend, &holding.CreatedAt, &holding.UpdatedAt,
	)
	
	if err != nil {
		return nil, fmt.Errorf("failed to update holding: %v", err)
	}

	return &holding, nil
}

func deleteHolding(id string, userID string) error {
	if db == nil {
		return fmt.Errorf("database unavailable - cannot delete holdings")
	}
	
	result, err := db.Exec("DELETE FROM portfolio_holdings WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete holding: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("holding not found")
	}

	return nil
}

func refreshHoldings(apiKey string, userID string) error {
	holdings, err := getHoldings(userID)
	if err != nil {
		return fmt.Errorf("failed to get holdings: %v", err)
	}

	for _, holding := range holdings {
		_, err := updateHolding(holding.ID, holding.Shares, apiKey, userID)
		if err != nil {
			fmt.Printf("Warning: failed to refresh holding %s: %v\n", holding.Ticker, err)
		}
	}

	return nil
}

func main() {
	// Load .env file from project root (for local development)
	// In Docker, environment variables are injected via docker-compose
	err := godotenv.Load("../.env")
	if err != nil {
		// Silently continue - environment variables may be injected by Docker
		fmt.Println("Info: No .env file found, using environment variables")
	}

	apiKey := os.Getenv("FMP_API_KEY")
	if apiKey == "" {
		panic("Missing FMP_API_KEY in .env file")
	}

	// Initialize database
	if err := initDB(); err != nil {
		fmt.Printf("Warning: Failed to initialize database: %v\n", err)
		fmt.Println("Running without database functionality...")
		db = nil
	} else {
		defer db.Close()
	}

	// Check if SUPABASE_JWT_SECRET is set
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if jwtSecret == "" {
		fmt.Println("Warning: SUPABASE_JWT_SECRET environment variable not set")
		fmt.Println("Please add your Supabase JWT secret to the .env file")
	} else {
		fmt.Println("Supabase JWT secret loaded successfully")
	}

	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Root endpoint (health check)
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"endpoints": []string{
				"GET /api/",
				"GET /api/stockTicker?symbol=<TICKER>",
				"GET /api/dividends?symbol=<TICKER>",
				"GET /api/dividendSummary?symbol=<TICKER>&shares=<SHARES>",
				"GET /api/portfolio (requires auth)",
				"POST /api/portfolio (requires auth)",
				"PUT /api/portfolio/:id (requires auth)",
				"DELETE /api/portfolio/:id (requires auth)",
				"POST /api/portfolio/refresh (requires auth)",
			},
		})
	})

	// API group
	api := r.Group("/api")
	
	// API info endpoint
	api.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"endpoints": []string{
				"GET /api/",
				"GET /api/stockTicker?symbol=<TICKER>",
				"GET /api/dividends?symbol=<TICKER>",
				"GET /api/dividendSummary?symbol=<TICKER>&shares=<SHARES>",
				"GET /api/portfolio (requires auth)",
				"POST /api/portfolio (requires auth)",
				"PUT /api/portfolio/:id (requires auth)",
				"DELETE /api/portfolio/:id (requires auth)",
				"POST /api/portfolio/refresh (requires auth)",
			},
		})
	})

	// Portfolio CRUD endpoints (protected)
	protected := api.Group("/portfolio")
	protected.Use(authMiddleware())
	
	protected.GET("", func(c *gin.Context) {
		userID := c.GetString("user_id")
		holdings, err := getHoldings(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, holdings)
	})

	protected.POST("", func(c *gin.Context) {
		userID := c.GetString("user_id")
		var req CreateHoldingRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if holding already exists
		holdings, err := getHoldings(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing holdings"})
			return
		}

		for _, holding := range holdings {
			if holding.Ticker == req.Ticker {
				c.JSON(http.StatusConflict, gin.H{"error": "Stock already exists in portfolio"})
				return
			}
		}

		holding, err := createHolding(req.Ticker, req.Shares, apiKey, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, holding)
	})

	protected.PUT("/:id", func(c *gin.Context) {
		userID := c.GetString("user_id")
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		var req UpdateHoldingRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		holding, err := updateHolding(id, req.Shares, apiKey, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, holding)
	})

	protected.DELETE("/:id", func(c *gin.Context) {
		userID := c.GetString("user_id")
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		err := deleteHolding(id, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Holding deleted successfully"})
	})

	protected.POST("/refresh", func(c *gin.Context) {
		userID := c.GetString("user_id")
		err := refreshHoldings(apiKey, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		holdings, err := getHoldings(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated holdings"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Portfolio refreshed successfully",
			"holdings": holdings,
		})
	})

	api.GET("/stockTicker", func(c *gin.Context) {
		symbol := c.Query("symbol")
		if symbol == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "symbol query parameter is required"})
			return
		}

		quote, err := getStockQuote(symbol, apiKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, quote)
	})

	api.GET("/dividends", func(c *gin.Context) {
		symbol := c.Query("symbol")
		if symbol == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "symbol query parameter is required"})
			return
		}

		dividendData, err := getDividendData(symbol, apiKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, dividendData)
	})

	api.GET("/dividendSummary", func(c *gin.Context) {
		symbol := c.Query("symbol")
		if symbol == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "symbol query parameter is required"})
			return
		}

		sharesStr := c.Query("shares")
		if sharesStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "shares query parameter is required"})
			return
		}

		var shares int
		if _, err := fmt.Sscanf(sharesStr, "%d", &shares); err != nil || shares <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "shares must be a positive integer"})
			return
		}

		fmt.Printf("Attempting to get dividend summary for %s with %d shares\n", symbol, shares)
		
		summary, err := getDividendSummary(symbol, apiKey, shares)
		if err != nil {
			fmt.Printf("Error in getDividendSummary: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, summary)
	})

	r.Run() // 0.0.0.0:8080
}
