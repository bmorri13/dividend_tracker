// Debug script to test Supabase authentication
// Run this in browser console after Google auth

console.log('=== Supabase Auth Debug ===');

// Check if we have a session
import { supabase } from './lib/supabase.js';

async function debugAuth() {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session error:', sessionError);
    console.log('Session exists:', !!session);
    
    if (session) {
      console.log('User ID:', session.user.id);
      console.log('User email:', session.user.email);
      console.log('Access token (first 50 chars):', session.access_token.substring(0, 50) + '...');
      console.log('Token type:', session.token_type);
      console.log('Expires at:', new Date(session.expires_at * 1000));
      
      // Test API call
      console.log('\n=== Testing API Call ===');
      const response = await fetch('http://localhost:8080/portfolio', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('API Response body:', responseText);
      
    } else {
      console.log('No session found');
    }
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugAuth();