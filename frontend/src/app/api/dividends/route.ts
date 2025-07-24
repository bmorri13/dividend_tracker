import { NextRequest } from 'next/server'
import { fetchFMPQuote, fetchFMPDividends } from '../utils/fmp'
import { createErrorResponse, createSuccessResponse } from '../utils/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return createErrorResponse('symbol query parameter is required', 400)
    }

    const { price } = await fetchFMPQuote(symbol)
    const { annualDividend, dividendYield } = await fetchFMPDividends(symbol)

    return createSuccessResponse({
      symbol: symbol.toUpperCase(),
      annual_dividend: annualDividend.toFixed(4),
      stock_price: price.toFixed(2),
      dividend_yield: `${dividendYield.toFixed(2)}%`,
      dividends_count: 1,
      evaluated_period: 'trailing 12 months'
    })
  } catch (error) {
    console.error('Dividend data error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch dividend data',
      500
    )
  }
}