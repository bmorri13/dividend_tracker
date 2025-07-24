import { NextRequest } from 'next/server'
import { fetchFMPQuote, fetchFMPDividends, fetchFMPProfile } from '../utils/fmp'
import { createErrorResponse, createSuccessResponse } from '../utils/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const sharesParam = searchParams.get('shares')

    if (!symbol) {
      return createErrorResponse('symbol query parameter is required', 400)
    }

    if (!sharesParam) {
      return createErrorResponse('shares query parameter is required', 400)
    }

    const shares = parseInt(sharesParam)
    if (isNaN(shares) || shares <= 0) {
      return createErrorResponse('shares must be a positive integer', 400)
    }

    const [{ price }, { annualDividend, dividendYield }, companyName] = await Promise.all([
      fetchFMPQuote(symbol),
      fetchFMPDividends(symbol),
      fetchFMPProfile(symbol)
    ])

    const totalValue = price * shares
    const monthlyDividend = (annualDividend * shares) / 12

    return createSuccessResponse({
      ticker: symbol.toUpperCase(),
      company: companyName,
      shares,
      currentPrice: price,
      dividendYield,
      totalValue,
      monthlyDividend
    })
  } catch (error) {
    console.error('Dividend summary error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch dividend summary',
      500
    )
  }
}