'use client'

import { useAuth } from "@/lib/auth-context"
import { AuthPage } from "../components/auth/auth-page"
import { LoadingSpinner } from "../components/ui/loading-spinner"
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Page() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is authenticated, redirect to portfolio
    if (user && !loading) {
      router.push('/portfolio')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  // This should not be reached due to the redirect above
  return null
}
