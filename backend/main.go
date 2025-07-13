package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
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

var db *sql.DB

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

	// Add IPv4 preference to the connection string
	if !strings.Contains(dbURL, "?") {
		dbURL += "?sslmode=require"
	}
	if !strings.Contains(dbURL, "sslmode") {
		dbURL += "&sslmode=require"
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	// Test the connection with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err = db.PingContext(ctx); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	fmt.Println("Connected to database successfully")
	return nil
}

func createHolding(ticker string, shares int, apiKey string) (*PortfolioHolding, error) {
	// Get current stock data
	summary, err := getDividendSummary(ticker, apiKey, shares)
	if err != nil {
		return nil, fmt.Errorf("failed to get stock data: %v", err)
	}

	// Insert into database (Supabase auto-generates UUID for id)
	query := `
		INSERT INTO portfolio_holdings (ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
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

func getHoldings() ([]PortfolioHolding, error) {
	query := `
		SELECT id, ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, created_at, updated_at
		FROM portfolio_holdings
		ORDER BY ticker
	`
	
	rows, err := db.Query(query)
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

func updateHolding(id string, shares int, apiKey string) (*PortfolioHolding, error) {
	// First get the current holding to get the ticker
	var ticker string
	err := db.QueryRow("SELECT ticker FROM portfolio_holdings WHERE id = $1", id).Scan(&ticker)
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
		WHERE id = $6
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

func deleteHolding(id string) error {
	result, err := db.Exec("DELETE FROM portfolio_holdings WHERE id = $1", id)
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

func refreshHoldings(apiKey string) error {
	holdings, err := getHoldings()
	if err != nil {
		return fmt.Errorf("failed to get holdings: %v", err)
	}

	for _, holding := range holdings {
		_, err := updateHolding(holding.ID, holding.Shares, apiKey)
		if err != nil {
			fmt.Printf("Warning: failed to refresh holding %s: %v\n", holding.Ticker, err)
		}
	}

	return nil
}

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Warning: Error loading .env file")
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

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"endpoints": []string{
				"GET /",
				"GET /stockTicker?symbol=<TICKER>",
				"GET /dividends?symbol=<TICKER>",
				"GET /dividendSummary?symbol=<TICKER>&shares=<SHARES>",
				"GET /portfolio",
				"POST /portfolio",
				"PUT /portfolio/:id",
				"DELETE /portfolio/:id",
				"POST /portfolio/refresh",
			},
		})
	})

	// Portfolio CRUD endpoints
	r.GET("/portfolio", func(c *gin.Context) {
		holdings, err := getHoldings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, holdings)
	})

	r.POST("/portfolio", func(c *gin.Context) {
		var req CreateHoldingRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if holding already exists
		holdings, err := getHoldings()
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

		holding, err := createHolding(req.Ticker, req.Shares, apiKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, holding)
	})

	r.PUT("/portfolio/:id", func(c *gin.Context) {
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

		holding, err := updateHolding(id, req.Shares, apiKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, holding)
	})

	r.DELETE("/portfolio/:id", func(c *gin.Context) {
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
			return
		}

		err := deleteHolding(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Holding deleted successfully"})
	})

	r.POST("/portfolio/refresh", func(c *gin.Context) {
		err := refreshHoldings(apiKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		holdings, err := getHoldings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated holdings"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Portfolio refreshed successfully",
			"holdings": holdings,
		})
	})

	r.GET("/stockTicker", func(c *gin.Context) {
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

	r.GET("/dividends", func(c *gin.Context) {
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

	r.GET("/dividendSummary", func(c *gin.Context) {
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
