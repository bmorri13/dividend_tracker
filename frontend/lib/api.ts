const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface StockQuote {
  symbol: string
  price: string
}

export interface DividendData {
  symbol: string
  annual_dividend: string
  stock_price: string
  dividend_yield: string
  dividends_count: number
  evaluated_period: string
}

export interface DividendSummary {
  ticker: string
  company: string
  shares: number
  currentPrice: number
  dividendYield: number
  totalValue: number
  monthlyDividend: number
}

export interface PortfolioHolding {
  id: string
  ticker: string
  company: string
  shares: number
  current_price: number
  dividend_yield: number
  total_value: number
  monthly_dividend: number
  created_at: string
  updated_at: string
}

export interface CreateHoldingRequest {
  ticker: string
  shares: number
}

export interface UpdateHoldingRequest {
  shares: number
}

export class ApiService {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const { supabase } = await import('./supabase')
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    return headers
  }

  private static async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const authHeaders = await this.getAuthHeaders()
    const mergedOptions = {
      ...options,
      headers: {
        ...authHeaders,
        ...options?.headers,
      },
    }
    
    const response = await fetch(url, mergedOptions)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  static async getStockQuote(symbol: string): Promise<StockQuote> {
    const url = `${API_BASE_URL}/api/stockTicker?symbol=${encodeURIComponent(symbol)}`
    return this.fetchJson<StockQuote>(url)
  }

  static async getDividendData(symbol: string): Promise<DividendData> {
    const url = `${API_BASE_URL}/api/dividends?symbol=${encodeURIComponent(symbol)}`
    return this.fetchJson<DividendData>(url)
  }

  static async getDividendSummary(symbol: string, shares: number): Promise<DividendSummary> {
    const url = `${API_BASE_URL}/api/dividendSummary?symbol=${encodeURIComponent(symbol)}&shares=${shares}`
    return this.fetchJson<DividendSummary>(url)
  }

  static async getMultipleDividendSummaries(holdings: Array<{symbol: string, shares: number}>): Promise<DividendSummary[]> {
    const promises = holdings.map(holding => 
      this.getDividendSummary(holding.symbol, holding.shares)
    )
    return Promise.all(promises)
  }

  // Portfolio CRUD operations
  static async getPortfolioHoldings(): Promise<PortfolioHolding[]> {
    const url = `${API_BASE_URL}/api/portfolio`
    return this.fetchJson<PortfolioHolding[]>(url)
  }

  static async createPortfolioHolding(data: CreateHoldingRequest): Promise<PortfolioHolding> {
    const url = `${API_BASE_URL}/api/portfolio`
    return this.fetchJson<PortfolioHolding>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async updatePortfolioHolding(id: string, data: UpdateHoldingRequest): Promise<PortfolioHolding> {
    const url = `${API_BASE_URL}/api/portfolio/${id}`
    return this.fetchJson<PortfolioHolding>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static async deletePortfolioHolding(id: string): Promise<void> {
    const url = `${API_BASE_URL}/api/portfolio/${id}`
    await this.fetchJson(url, {
      method: 'DELETE',
    })
  }

  static async refreshPortfolio(): Promise<{message: string, holdings: PortfolioHolding[]}> {
    const url = `${API_BASE_URL}/api/portfolio/refresh`
    return this.fetchJson(url, {
      method: 'POST',
    })
  }
}