"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface PieChartData {
  name: string
  value: number
  percentage: string
  color?: string
}

interface PieChartProps {
  data: PieChartData[]
  className?: string
  colors?: string[]
  onHover?: (data: PieChartData | null) => void
}

export function PieChart({ data, className, colors, onHover }: PieChartProps) {
  const [hoveredSegment, setHoveredSegment] = React.useState<string | null>(null)
  
  const defaultColors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
  ]
  
  const chartColors = colors || defaultColors
  
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0
  
  const segments = data.map((item, index) => {
    const percentage = item.value / total
    let angle = percentage * 360
    
    // Special handling for single item (100%) - use 359.99 degrees to avoid path issues
    if (data.length === 1) {
      angle = 359.99
    }
    
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle += angle
    
    const color = item.color || chartColors[index % chartColors.length]
    
    // Convert angles to radians
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    // SVG path coordinates
    const radius = 80
    const centerX = 100
    const centerY = 100
    
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)
    
    const largeArcFlag = angle > 180 ? 1 : 0
    
    let pathData
    if (data.length === 1) {
      // For single item, draw a full circle using two arc commands
      pathData = [
        `M ${centerX} ${centerY}`,
        `L ${centerX + radius} ${centerY}`,
        `A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY}`,
        `A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY}`,
        "Z"
      ].join(" ")
    } else {
      pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z"
      ].join(" ")
    }
    
    return {
      ...item,
      color,
      pathData,
      percentage: item.percentage
    }
  })
  
  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {segments.map((segment) => (
            <path
              key={segment.name}
              d={segment.pathData}
              fill={segment.color}
              stroke="#1f2937"
              strokeWidth="2"
              className={cn(
                "transition-all duration-200 cursor-pointer",
                hoveredSegment === segment.name ? "opacity-80 scale-105" : "opacity-100"
              )}
              style={{
                transformOrigin: "100px 100px"
              }}
              onMouseEnter={() => {
                setHoveredSegment(segment.name)
                onHover?.(segment)
              }}
              onMouseLeave={() => {
                setHoveredSegment(null)
                onHover?.(null)
              }}
            />
          ))}
        </svg>
        
        
        {/* Hover tooltip */}
        {hoveredSegment && (
          <div className="absolute top-2 left-2 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-lg pointer-events-none">
            {(() => {
              const segment = segments.find(s => s.name === hoveredSegment)
              if (!segment) return null
              return (
                <div className="text-xs">
                  <div className="font-medium text-white">{segment.name}</div>
                  <div className="text-gray-400">${segment.value.toLocaleString()}</div>
                  <div className="text-gray-400">{segment.percentage}%</div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
      
      {/* Simple color legend without values */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {segments.map((segment) => (
          <div
            key={segment.name}
            className={cn(
              "flex items-center space-x-2 p-1 rounded cursor-pointer transition-colors",
              hoveredSegment === segment.name ? "bg-gray-700" : "hover:bg-gray-800"
            )}
            onMouseEnter={() => {
              setHoveredSegment(segment.name)
              onHover?.(segment)
            }}
            onMouseLeave={() => {
              setHoveredSegment(null)
              onHover?.(null)
            }}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <div className="text-xs font-medium text-white truncate">
              {segment.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}