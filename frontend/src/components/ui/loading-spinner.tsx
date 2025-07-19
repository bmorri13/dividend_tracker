"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-600 border-t-blue-500",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-gray-400 text-sm font-medium">{text}</p>
      )}
    </div>
  )
}

interface LoadingPageProps {
  title?: string
  subtitle?: string
  className?: string
}

export function LoadingPage({ 
  title = "Loading...", 
  subtitle = "Please wait while we fetch your data",
  className 
}: LoadingPageProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-900 text-white flex items-center justify-center p-4",
      className
    )}>
      <div className="text-center space-y-6 max-w-md">
        {/* Large spinner */}
        <div className="flex justify-center">
          <div className="w-16 h-16 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-400">{subtitle}</p>
        </div>
        
        {/* Pulsing dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  )
}