// FMP API response interfaces - keeping for reference but using dynamic typing for error handling

export async function fetchFMPQuote(symbol: string): Promise<{ price: number; name: string }> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    throw new Error('FMP_API_KEY not configured')
  }

  const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
  
  const response = await fetch(url, { 
    next: { revalidate: 60 } // Cache for 1 minute
  })
  
  if (!response.ok) {
    throw new Error(`FMP API returned status ${response.status}`)
  }

  const data = await response.json()
  
  // Check if FMP returned an error (they return 200 status with error object)
  if (data && 'Error Message' in data) {
    throw new Error(`Failed to fetch quote: ${data['Error Message']}`)
  }
  
  // Ensure data is an array and has content
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No quote data found for symbol ${symbol}`)
  }

  return {
    price: data[0].price,
    name: data[0].name
  }
}

export async function fetchFMPProfile(symbol: string): Promise<string> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    return symbol // Fallback to symbol
  }

  const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`
  
  try {
    const response = await fetch(url, { 
      next: { revalidate: 3600 } // Cache for 1 hour since company names don't change often
    })
    
    if (!response.ok) {
      return symbol
    }

    const data = await response.json()
    
    // Check if FMP returned an error
    if (data && 'Error Message' in data) {
      return symbol // Fallback on error
    }
    
    if (!Array.isArray(data) || data.length === 0 || !data[0].companyName) {
      return symbol
    }

    return data[0].companyName
  } catch {
    return symbol // Fallback to symbol on any error
  }
}

export async function fetchFMPDividends(symbol: string): Promise<{ annualDividend: number; dividendYield: number }> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    throw new Error('FMP_API_KEY not configured')
  }

  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${symbol}?apikey=${apiKey}`
  
  const response = await fetch(url, { 
    next: { revalidate: 3600 } // Cache for 1 hour
  })
  
  if (!response.ok) {
    throw new Error(`FMP dividend API returned status ${response.status}`)
  }

  const data = await response.json()
  
  // Check if FMP returned an error
  if (data && 'Error Message' in data) {
    throw new Error(`Failed to fetch dividends: ${data['Error Message']}`)
  }
  
  if (!data.historical || data.historical.length === 0) {
    return { annualDividend: 0, dividendYield: 0 }
  }

  // Calculate annual dividend from last 4 quarters
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  let annualDividend = 0
  for (const div of data.historical) {
    const divDate = new Date(div.date)
    if (divDate > oneYearAgo) {
      annualDividend += div.adjDividend
    }
  }

  // Get current price to calculate yield
  const { price } = await fetchFMPQuote(symbol)
  const dividendYield = price > 0 ? (annualDividend / price) * 100 : 0

  return {
    annualDividend,
    dividendYield: Math.round(dividendYield * 100) / 100 // Round to 2 decimal places
  }
}