import { NextRequest } from 'next/server'
import { verifySupabaseJWT, createErrorResponse, createSuccessResponse } from '../../utils/auth'
import { updateHolding, deleteHolding, getHoldings } from '../../utils/database'
import { fetchFMPQuote, fetchFMPDividends } from '../../utils/fmp'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await verifySupabaseJWT(request)
    const body = await request.json()
    const { id } = await params

    const { shares } = body

    if (!shares || typeof shares !== 'number' || shares <= 0) {
      return createErrorResponse('shares is required and must be a positive number', 400)
    }

    // Get existing holding to get ticker
    const holdings = await getHoldings(claims.sub)
    const existingHolding = holdings.find(h => h.id === id)
    
    if (!existingHolding) {
      return createErrorResponse('Holding not found', 404)
    }

    // Get updated stock data
    const [{ price }, { annualDividend, dividendYield }] = await Promise.all([
      fetchFMPQuote(existingHolding.ticker),
      fetchFMPDividends(existingHolding.ticker)
    ])

    const totalValue = price * shares
    const monthlyDividend = (annualDividend * shares) / 12

    const updatedHolding = await updateHolding(id, claims.sub, {
      shares,
      current_price: price,
      dividend_yield: dividendYield,
      total_value: totalValue,
      monthly_dividend: monthlyDividend
    })

    return createSuccessResponse(updatedHolding)
  } catch (error) {
    console.error('Update portfolio holding error:', error)
    if (error instanceof Error && error.message.includes('Authorization')) {
      return createErrorResponse(error.message, 401)
    }
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update holding',
      500
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await verifySupabaseJWT(request)
    const { id } = await params

    await deleteHolding(id, claims.sub)

    return createSuccessResponse({ message: 'Holding deleted successfully' })
  } catch (error) {
    console.error('Delete portfolio holding error:', error)
    if (error instanceof Error && error.message.includes('Authorization')) {
      return createErrorResponse(error.message, 401)
    }
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete holding',
      500
    )
  }
}