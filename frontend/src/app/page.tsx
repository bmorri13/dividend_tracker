'use client'

import { useAuth } from "@/lib/auth-context"
import DividendTracker from "../components/dividend-tracker"
import { AuthPage } from "../components/auth/auth-page"
import { LoadingSpinner } from "../components/ui/loading-spinner"

export default function Page() {
  const { user, loading } = useAuth()

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

  return <DividendTracker />
}
