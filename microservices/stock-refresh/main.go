package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type PortfolioHolding struct {
	ID              string  `json:"id"`
	Ticker          string  `json:"ticker"`
	Company         string  `json:"company"`
	Shares          int     `json:"shares"`
	CurrentPrice    float64 `json:"current_price"`
	DividendYield   float64 `json:"dividend_yield"`
	TotalValue      float64 `json:"total_value"`
	MonthlyDividend float64 `json:"monthly_dividend"`
	UserID          *string `json:"user_id"`
}

type StockQuote struct {
	Symbol              string  `json:"symbol"`
	Name                string  `json:"name"`
	Price               float64 `json:"price"`
	ChangesPercentage   float64 `json:"changesPercentage"`
	Change              float64 `json:"change"`
	DayLow              float64 `json:"dayLow"`
	DayHigh             float64 `json:"dayHigh"`
	YearHigh            float64 `json:"yearHigh"`
	YearLow             float64 `json:"yearLow"`
	MarketCap           int64   `json:"marketCap"`
	PriceAvg50          float64 `json:"priceAvg50"`
	PriceAvg200         float64 `json:"priceAvg200"`
	Volume              int64   `json:"volume"`
	AvgVolume           int64   `json:"avgVolume"`
	Exchange            string  `json:"exchange"`
	Open                float64 `json:"open"`
	PreviousClose       float64 `json:"previousClose"`
	Eps                 float64 `json:"eps"`
	Pe                  float64 `json:"pe"`
	EarningsAnnouncement string `json:"earningsAnnouncement"`
	SharesOutstanding   int64   `json:"sharesOutstanding"`
	Timestamp           int64   `json:"timestamp"`
}

type DividendData struct {
	Symbol          string  `json:"symbol"`
	Date            string  `json:"date"`
	Label           string  `json:"label"`
	AdjDividend     float64 `json:"adjDividend"`
	Dividend        float64 `json:"dividend"`
	RecordDate      string  `json:"recordDate"`
	PaymentDate     string  `json:"paymentDate"`
	DeclarationDate string  `json:"declarationDate"`
}

type DividendResponse struct {
	Symbol     string         `json:"symbol"`
	Historical []DividendData `json:"historical"`
}

type UpdateResult struct {
	Ticker          string  `json:"ticker"`
	Company         string  `json:"company"`
	OldPrice        float64 `json:"old_price"`
	NewPrice        float64 `json:"new_price"`
	OldYield        float64 `json:"old_yield"`
	NewYield        float64 `json:"new_yield"`
	PriceChanged    bool    `json:"price_changed"`
	YieldChanged    bool    `json:"yield_changed"`
	UpdatedFields   []string `json:"updated_fields"`
}

func main() {
	// Load environment variables
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	// Database connection
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	log.Println("🚀 Starting stock refresh service...")
	log.Println("📊 Connected to database successfully")

	// Get all holdings
	holdings, err := getPortfolioHoldings(db)
	if err != nil {
		log.Fatal("Failed to get portfolio holdings:", err)
	}

	log.Printf("📈 Found %d holdings to refresh", len(holdings))

	results := []UpdateResult{}
	updatedCount := 0

	for _, holding := range holdings {
		log.Printf("Processing %s (%s)...", holding.Ticker, holding.Company)
		
		result := UpdateResult{
			Ticker:          holding.Ticker,
			Company:         holding.Company,
			OldPrice:        holding.CurrentPrice,
			OldYield:        holding.DividendYield,
			UpdatedFields:   []string{},
		}

		// Get current stock quote
		quote, err := getStockQuote(holding.Ticker)
		if err != nil {
			log.Printf("❌ Failed to get quote for %s: %v", holding.Ticker, err)
			continue
		}

		// Get dividend data
		dividendYield, err := getDividendYield(holding.Ticker, quote.Price)
		if err != nil {
			log.Printf("⚠️  Failed to get dividend data for %s: %v", holding.Ticker, err)
			dividendYield = holding.DividendYield // Keep existing value
		}

		// Check for changes
		priceChanged := abs(quote.Price-holding.CurrentPrice) > 0.01
		yieldChanged := abs(dividendYield-holding.DividendYield) > 0.01

		result.NewPrice = quote.Price
		result.NewYield = dividendYield
		result.PriceChanged = priceChanged
		result.YieldChanged = yieldChanged

		if priceChanged || yieldChanged {
			// Update the database
			err = updateHolding(db, holding.ID, quote.Price, dividendYield, holding.Shares)
			if err != nil {
				log.Printf("❌ Failed to update %s: %v", holding.Ticker, err)
				continue
			}

			if priceChanged {
				result.UpdatedFields = append(result.UpdatedFields, "current_price", "total_value")
			}
			if yieldChanged {
				result.UpdatedFields = append(result.UpdatedFields, "dividend_yield", "monthly_dividend")
			}

			log.Printf("✅ Updated %s: Price %.2f→%.2f, Yield %.2f%%→%.2f%%", 
				holding.Ticker, holding.CurrentPrice, quote.Price, 
				holding.DividendYield, dividendYield)
			updatedCount++
		} else {
			log.Printf("➡️  No changes for %s", holding.Ticker)
		}

		results = append(results, result)
		
		// Small delay to respect API rate limits
		time.Sleep(200 * time.Millisecond)
	}

	// Print summary
	log.Printf("\n🎉 Refresh completed!")
	log.Printf("📊 Total holdings processed: %d", len(holdings))
	log.Printf("🔄 Holdings updated: %d", updatedCount)
	log.Printf("⚡ Holdings unchanged: %d", len(holdings)-updatedCount)

	// Print detailed results
	fmt.Println("\n📋 Detailed Results:")
	fmt.Println("==================")
	for _, result := range results {
		status := "UNCHANGED"
		if len(result.UpdatedFields) > 0 {
			status = "UPDATED"
		}
		
		fmt.Printf("%-6s %-20s %s\n", result.Ticker, result.Company, status)
		if result.PriceChanged {
			fmt.Printf("       Price: $%.2f → $%.2f (%.2f%%)\n", 
				result.OldPrice, result.NewPrice, 
				((result.NewPrice-result.OldPrice)/result.OldPrice)*100)
		}
		if result.YieldChanged {
			fmt.Printf("       Yield: %.2f%% → %.2f%%\n", 
				result.OldYield, result.NewYield)
		}
		if len(result.UpdatedFields) > 0 {
			fmt.Printf("       Fields updated: %v\n", result.UpdatedFields)
		}
		fmt.Println()
	}
}

func getPortfolioHoldings(db *sql.DB) ([]PortfolioHolding, error) {
	query := `
		SELECT id, ticker, company, shares, current_price, dividend_yield, 
		       total_value, monthly_dividend, user_id
		FROM portfolio_holdings
		ORDER BY ticker
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var holdings []PortfolioHolding
	for rows.Next() {
		var holding PortfolioHolding
		err := rows.Scan(
			&holding.ID, &holding.Ticker, &holding.Company, &holding.Shares,
			&holding.CurrentPrice, &holding.DividendYield, &holding.TotalValue,
			&holding.MonthlyDividend, &holding.UserID,
		)
		if err != nil {
			return nil, err
		}
		holdings = append(holdings, holding)
	}

	return holdings, nil
}

func getStockQuote(symbol string) (*StockQuote, error) {
	apiKey := os.Getenv("FMP_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("FMP_API_KEY environment variable is required")
	}

	url := fmt.Sprintf("https://financialmodelingprep.com/api/v3/quote/%s?apikey=%s", symbol, apiKey)
	
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var quotes []StockQuote
	if err := json.Unmarshal(body, &quotes); err != nil {
		return nil, err
	}

	if len(quotes) == 0 {
		return nil, fmt.Errorf("no quote data found for %s", symbol)
	}

	return &quotes[0], nil
}

func getDividendYield(symbol string, currentPrice float64) (float64, error) {
	apiKey := os.Getenv("FMP_API_KEY")
	if apiKey == "" {
		return 0, fmt.Errorf("FMP_API_KEY environment variable is required")
	}

	url := fmt.Sprintf("https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/%s?apikey=%s", symbol, apiKey)
	
	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	var dividendResponse DividendResponse
	if err := json.Unmarshal(body, &dividendResponse); err != nil {
		return 0, err
	}

	// Calculate annual dividend from last 12 months
	oneYearAgo := time.Now().AddDate(-1, 0, 0)
	var annualDividend float64

	for _, div := range dividendResponse.Historical {
		divDate, err := time.Parse("2006-01-02", div.Date)
		if err != nil {
			continue
		}
		
		if divDate.After(oneYearAgo) {
			annualDividend += div.AdjDividend
		}
	}

	if currentPrice == 0 {
		return 0, nil
	}

	return (annualDividend / currentPrice) * 100, nil
}

func updateHolding(db *sql.DB, id string, currentPrice, dividendYield float64, shares int) error {
	totalValue := currentPrice * float64(shares)
	monthlyDividend := (dividendYield / 100) * currentPrice * float64(shares) / 12

	query := `
		UPDATE portfolio_holdings 
		SET current_price = $1, dividend_yield = $2, total_value = $3, 
		    monthly_dividend = $4, updated_at = NOW()
		WHERE id = $5
	`

	_, err := db.Exec(query, currentPrice, dividendYield, totalValue, monthlyDividend, id)
	return err
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}