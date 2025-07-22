import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export interface PortfolioHolding {
  id?: string
  ticker: string
  company: string
  shares: number
  current_price: number
  dividend_yield: number
  total_value: number
  monthly_dividend: number
  created_at?: string
  updated_at?: string
}