"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface SimpleBarData {
  name: string
  value: number
}

interface SimpleBarChartProps {
  data: SimpleBarData[]
  className?: string
  onHover?: (data: { month: string; value: number } | null) => void
}

export function SimpleBarChart({ data, className, onHover }: SimpleBarChartProps) {
  const [hoveredBar, setHoveredBar] = React.useState<string | null>(null)
  
  const maxValue = Math.max(...data.map(item => item.value))
  const minValue = 0
  const range = maxValue - minValue
  
  // Generate nice y-axis labels with round numbers
  const getYAxisLabels = () => {
    // Create 5 evenly spaced labels from 0 to maxValue
    const step = Math.ceil(maxValue / 4 / 50) * 50 // Round to nearest 50
    const adjustedMax = Math.ceil(maxValue / step) * step
    
    return [
      0,
      step,
      step * 2,
      step * 3,
      adjustedMax
    ]
  }
  
  const yAxisLabels = getYAxisLabels()
  const reversedYAxisLabels = [...yAxisLabels].reverse()
  const adjustedMaxValue = yAxisLabels[yAxisLabels.length - 1]
  
  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <div className="flex-1 flex min-h-0">
        {/* Y-axis */}
        <div className="flex flex-col justify-between py-2 pr-2 text-xs text-gray-400">
          {reversedYAxisLabels.map((label, index) => (
            <div key={index} className="h-0 flex items-center">
              ${label}
            </div>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2">
            {reversedYAxisLabels.map((_, index) => (
              <div key={index} className="h-0 border-t border-gray-700 border-dashed" />
            ))}
          </div>
          
          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-2 pb-2 min-h-0">
            {data.map((monthData) => {
              const barHeight = adjustedMaxValue > 0 ? Math.max((monthData.value / adjustedMaxValue) * 100, 2) : 2
              const isHovered = hoveredBar === monthData.name
              
              return (
                <div
                  key={monthData.name}
                  className="flex flex-col items-center flex-1 max-w-16"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white whitespace-nowrap mb-2">
                      ${monthData.value.toFixed(2)}
                    </div>
                  )}
                  
                  {/* Bar */}
                  <div
                    className={cn(
                      "w-8 bg-blue-500 rounded cursor-pointer transition-all duration-200",
                      isHovered ? "bg-blue-400 transform scale-x-110" : ""
                    )}
                    style={{
                      height: `${barHeight}%`,
                      minHeight: '12px'
                    }}
                    onMouseEnter={() => {
                      setHoveredBar(monthData.name)
                      onHover?.({ month: monthData.name, value: monthData.value })
                    }}
                    onMouseLeave={() => {
                      setHoveredBar(null)
                      onHover?.(null)
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-around px-2 pt-2 ml-8">
        {data.map((item) => (
          <div
            key={item.name}
            className="text-xs text-gray-400 text-center flex-1 max-w-16"
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
}