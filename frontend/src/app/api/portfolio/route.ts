import { NextRequest } from 'next/server'
import { verifySupabaseJWT, createErrorResponse, createSuccessResponse } from '../utils/auth'
import { getHoldings, createHolding, getHoldingByTicker } from '../utils/database'
import { fetchFMPQuote, fetchFMPDividends, fetchFMPProfile } from '../utils/fmp'

export async function GET(request: NextRequest) {
  try {
    const claims = await verifySupabaseJWT(request)
    const holdings = await getHoldings(claims.sub)
    return createSuccessResponse(holdings)
  } catch (error) {
    console.error('Get portfolio error:', error)
    if (error instanceof Error && error.message.includes('Authorization')) {
      return createErrorResponse(error.message, 401)
    }
    return createErrorResponse('Failed to fetch portfolio', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const claims = await verifySupabaseJWT(request)
    const body = await request.json()

    const { ticker, shares } = body

    if (!ticker || typeof ticker !== 'string') {
      return createErrorResponse('ticker is required and must be a string', 400)
    }

    if (!shares || typeof shares !== 'number' || shares <= 0) {
      return createErrorResponse('shares is required and must be a positive number', 400)
    }

    // Check if holding already exists
    const existingHolding = await getHoldingByTicker(claims.sub, ticker.toUpperCase())
    if (existingHolding) {
      return createErrorResponse('Stock already exists in portfolio', 409)
    }

    // Get stock data
    const [{ price }, { annualDividend, dividendYield }, companyName] = await Promise.all([
      fetchFMPQuote(ticker),
      fetchFMPDividends(ticker),
      fetchFMPProfile(ticker)
    ])

    const totalValue = price * shares
    const monthlyDividend = (annualDividend * shares) / 12

    const newHolding = await createHolding({
      ticker: ticker.toUpperCase(),
      company: companyName,
      shares,
      current_price: price,
      dividend_yield: dividendYield,
      total_value: totalValue,
      monthly_dividend: monthlyDividend,
      user_id: claims.sub
    })

    return createSuccessResponse(newHolding, 201)
  } catch (error) {
    console.error('Create portfolio holding error:', error)
    if (error instanceof Error && error.message.includes('Authorization')) {
      return createErrorResponse(error.message, 401)
    }
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create holding',
      500
    )
  }
}