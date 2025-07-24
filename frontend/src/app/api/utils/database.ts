import { Pool } from 'pg'

let dbPool: Pool | null = null

function getDatabase() {
  if (!dbPool) {
    const databaseUrl = process.env.DATABASE_URL!
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // For Supabase connections, explicitly handle SSL configuration
    const poolConfig: {
      connectionString: string;
      max: number;
      idleTimeoutMillis: number;
      connectionTimeoutMillis: number;
      ssl?: { rejectUnauthorized: boolean } | false;
    } = {
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
    
    // Override SSL configuration for Supabase to handle certificate issues
    if (databaseUrl.includes('supabase.co')) {
      // Disable SSL entirely for development to avoid certificate issues
      poolConfig.ssl = false
    }
    
    dbPool = new Pool(poolConfig)
  }
  return dbPool
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
  user_id: string
  created_at: string
  updated_at: string
}

export interface CreateHoldingData {
  ticker: string
  company: string
  shares: number
  current_price: number
  dividend_yield: number
  total_value: number
  monthly_dividend: number
  user_id: string
  [key: string]: unknown
}

export async function getHoldings(userId: string): Promise<PortfolioHolding[]> {
  const db = getDatabase()
  const query = `
    SELECT id, ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, 
           user_id, created_at, updated_at
    FROM portfolio_holdings
    WHERE user_id = $1
    ORDER BY ticker
  `
  
  const result = await db.query(query, [userId])
  
  // Convert PostgreSQL string numbers back to JavaScript numbers
  return result.rows.map(row => ({
    ...row,
    shares: parseInt(row.shares, 10),
    current_price: parseFloat(row.current_price),
    dividend_yield: parseFloat(row.dividend_yield),
    total_value: parseFloat(row.total_value),
    monthly_dividend: parseFloat(row.monthly_dividend)
  }))
}

export async function createHolding(holdingData: CreateHoldingData): Promise<PortfolioHolding> {
  const db = getDatabase()
  const query = `
    INSERT INTO portfolio_holdings (ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, user_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING id, ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, user_id, created_at, updated_at
  `
  
  const result = await db.query(query, [
    holdingData.ticker,
    holdingData.company,
    holdingData.shares,
    holdingData.current_price,
    holdingData.dividend_yield,
    holdingData.total_value,
    holdingData.monthly_dividend,
    holdingData.user_id
  ])
  
  // Convert PostgreSQL string numbers back to JavaScript numbers
  const row = result.rows[0]
  return {
    ...row,
    shares: parseInt(row.shares, 10),
    current_price: parseFloat(row.current_price),
    dividend_yield: parseFloat(row.dividend_yield),
    total_value: parseFloat(row.total_value),
    monthly_dividend: parseFloat(row.monthly_dividend)
  }
}

export async function updateHolding(
  id: string, 
  userId: string, 
  updates: Partial<Omit<PortfolioHolding, 'id' | 'user_id' | 'created_at'>>
): Promise<PortfolioHolding> {
  const db = getDatabase()
  const query = `
    UPDATE portfolio_holdings 
    SET shares = $1, current_price = $2, dividend_yield = $3, total_value = $4, monthly_dividend = $5, updated_at = NOW()
    WHERE id = $6 AND user_id = $7
    RETURNING id, ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, user_id, created_at, updated_at
  `
  
  const result = await db.query(query, [
    updates.shares,
    updates.current_price,
    updates.dividend_yield,
    updates.total_value,
    updates.monthly_dividend,
    id,
    userId
  ])
  
  if (result.rows.length === 0) {
    throw new Error('Holding not found')
  }
  
  // Convert PostgreSQL string numbers back to JavaScript numbers
  const row = result.rows[0]
  return {
    ...row,
    shares: parseInt(row.shares, 10),
    current_price: parseFloat(row.current_price),
    dividend_yield: parseFloat(row.dividend_yield),
    total_value: parseFloat(row.total_value),
    monthly_dividend: parseFloat(row.monthly_dividend)
  }
}

export async function deleteHolding(id: string, userId: string): Promise<void> {
  const db = getDatabase()
  const query = `DELETE FROM portfolio_holdings WHERE id = $1 AND user_id = $2`
  
  const result = await db.query(query, [id, userId])
  
  if (result.rowCount === 0) {
    throw new Error('Holding not found')
  }
}

export async function getHoldingByTicker(userId: string, ticker: string): Promise<PortfolioHolding | null> {
  const db = getDatabase()
  const query = `
    SELECT id, ticker, company, shares, current_price, dividend_yield, total_value, monthly_dividend, 
           user_id, created_at, updated_at
    FROM portfolio_holdings
    WHERE user_id = $1 AND ticker = $2
  `
  
  const result = await db.query(query, [userId, ticker])
  
  if (result.rows.length === 0) {
    return null
  }
  
  // Convert PostgreSQL string numbers back to JavaScript numbers
  const row = result.rows[0]
  return {
    ...row,
    shares: parseInt(row.shares, 10),
    current_price: parseFloat(row.current_price),
    dividend_yield: parseFloat(row.dividend_yield),
    total_value: parseFloat(row.total_value),
    monthly_dividend: parseFloat(row.monthly_dividend)
  }
}