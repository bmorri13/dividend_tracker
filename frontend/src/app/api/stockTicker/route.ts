import { NextRequest } from 'next/server'
import { fetchFMPQuote } from '../utils/fmp'
import { createErrorResponse, createSuccessResponse } from '../utils/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return createErrorResponse('symbol query parameter is required', 400)
    }

    const { price } = await fetchFMPQuote(symbol)

    return createSuccessResponse({
      symbol: symbol.toUpperCase(),
      price: price.toFixed(2)
    })
  } catch (error) {
    console.error('Stock quote error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch stock quote',
      500
    )
  }
}