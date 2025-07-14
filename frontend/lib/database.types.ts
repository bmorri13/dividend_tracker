export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      portfolio_holdings: {
        Row: {
          id: string
          ticker: string
          company: string
          shares: number
          current_price: number
          dividend_yield: number
          total_value: number
          monthly_dividend: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
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
          user_id: string
        }
        Update: {
          id?: string
          ticker?: string
          company?: string
          shares?: number
          current_price?: number
          dividend_yield?: number
          total_value?: number
          monthly_dividend?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}