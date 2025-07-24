import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export interface SupabaseJWTClaims {
  sub: string
  email: string
  role: string
  iat: number
  exp: number
}

export async function verifySupabaseJWT(request: NextRequest): Promise<SupabaseJWTClaims> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Authorization header required')
  }

  const token = authHeader.replace('Bearer ', '')
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  
  if (!jwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET not configured')
  }

  try {
    const claims = jwt.verify(token, jwtSecret) as SupabaseJWTClaims
    return claims
  } catch {
    throw new Error('Invalid token')
  }
}

export function createErrorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status })
}

export function createSuccessResponse(data: unknown, status: number = 200) {
  return Response.json(data, { status })
}