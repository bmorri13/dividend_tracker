-- Verification script for database migration
-- Run this in Supabase SQL Editor to confirm migration was successful

-- 1. Check if user_id column exists in portfolio_holdings table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'portfolio_holdings' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the foreign key constraint exists
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'portfolio_holdings'
    AND kcu.column_name = 'user_id';

-- 3. Check if the index exists
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'portfolio_holdings' 
    AND indexname = 'idx_portfolio_holdings_user_id';

-- 4. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'portfolio_holdings' 
    AND schemaname = 'public';

-- 5. Check if RLS policies exist
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'portfolio_holdings' 
    AND schemaname = 'public'
ORDER BY policyname;

-- 6. Test query to verify structure (should not error)
SELECT 
    'Migration verification complete' as status,
    'All checks above should show the expected results' as note;