import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fidqudcxjycexlmjwkvm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZHF1ZGN4anljZXhsbWp3a3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTg3NjEsImV4cCI6MjA2NzkzNDc2MX0.oc97-igqaNtgnubh-jr4_K2dEyqONZdcY4cUdI029mA'

export const supabase = createClient(supabaseUrl, supabaseKey)

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