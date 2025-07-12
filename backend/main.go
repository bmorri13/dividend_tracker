package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
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

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"endpoints": []string{
				"GET /",
				"GET /stockTicker?symbol=<TICKER>",
				"GET /dividends?symbol=<TICKER>",
				"GET /dividendSummary?symbol=<TICKER>&shares=<SHARES>",
			},
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
