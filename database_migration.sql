-- Add user_id column to portfolio_holdings table
ALTER TABLE portfolio_holdings 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for better performance on user-specific queries
CREATE INDEX idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);

-- Optional: Add row level security (RLS) policy
-- This ensures users can only access their own data
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own holdings
CREATE POLICY "Users can view own holdings" ON portfolio_holdings
FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own holdings
CREATE POLICY "Users can insert own holdings" ON portfolio_holdings
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own holdings
CREATE POLICY "Users can update own holdings" ON portfolio_holdings
FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own holdings
CREATE POLICY "Users can delete own holdings" ON portfolio_holdings
FOR DELETE USING (auth.uid() = user_id);