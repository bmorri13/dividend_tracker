import { NextRequest } from 'next/server'
import { verifySupabaseJWT, createErrorResponse, createSuccessResponse } from '../../utils/auth'
import { getHoldings, updateHolding } from '../../utils/database'
import { fetchFMPQuote, fetchFMPDividends } from '../../utils/fmp'

export async function POST(request: NextRequest) {
  try {
    const claims = await verifySupabaseJWT(request)
    const holdings = await getHoldings(claims.sub)

    // Refresh all holdings
    const refreshPromises = holdings.map(async (holding) => {
      try {
        const [{ price }, { annualDividend, dividendYield }] = await Promise.all([
          fetchFMPQuote(holding.ticker),
          fetchFMPDividends(holding.ticker)
        ])

        const totalValue = price * holding.shares
        const monthlyDividend = (annualDividend * holding.shares) / 12

        return await updateHolding(holding.id, claims.sub, {
          current_price: price,
          dividend_yield: dividendYield,
          total_value: totalValue,
          monthly_dividend: monthlyDividend
        })
      } catch (error) {
        console.warn(`Failed to refresh holding ${holding.ticker}:`, error)
        return holding // Return original holding if refresh fails
      }
    })

    const refreshedHoldings = await Promise.all(refreshPromises)

    return createSuccessResponse({
      message: 'Portfolio refreshed successfully',
      holdings: refreshedHoldings
    })
  } catch (error) {
    console.error('Refresh portfolio error:', error)
    if (error instanceof Error && error.message.includes('Authorization')) {
      return createErrorResponse(error.message, 401)
    }
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to refresh portfolio',
      500
    )
  }
}