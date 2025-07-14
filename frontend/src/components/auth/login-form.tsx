'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signInWithGoogle } = useAuth()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await signInWithGoogle()
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="m12.017 6.906c2.067-.006 3.856.49 5.045 1.44l3.404-3.404c-2.343-2.19-5.4-3.442-8.449-3.442-5 0-9.312 2.91-11.444 7.167l4.041 3.139c.757-2.269 2.993-4.007 5.403-3.9z"
              fill="#ea4335"
            />
            <path
              d="m3.938 5.667c-1.269 2.355-1.269 5.311 0 7.666l4.041-3.139c-.506-1.563-.43-3.313.493-4.813z"
              fill="#fbbc05"
            />
            <path
              d="m12.017 18.094c-2.41.107-4.646-1.631-5.403-3.9l-4.041 3.139c2.132 4.257 6.444 7.167 11.444 7.167 3.025 0 6.056-1.215 8.333-3.583l-3.742-2.907c-1.398 1.015-3.1 1.198-4.591 1.084z"
              fill="#34a853"
            />
            <path
              d="m21.351 11.56c.341-2.186-.054-4.463-1.051-6.292l-3.742 2.907c.696 1.517.696 3.27 0 4.787l3.742 2.907c.997-1.829 1.392-4.106 1.051-6.309z"
              fill="#4285f4"
            />
          </svg>
          Sign in with Google
        </Button>

        <div className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary hover:underline"
          >
            Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  )
}