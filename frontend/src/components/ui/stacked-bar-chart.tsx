"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface StackedBarData {
  name: string
  total: number
  stocks: Array<{
    name: string
    value: number
    color: string
  }>
}

interface StackedBarChartProps {
  data: StackedBarData[]
  className?: string
  onHover?: (data: { stock: string; value: number; month: string } | null) => void
}

export function StackedBarChart({ data, className, onHover }: StackedBarChartProps) {
  const [hoveredBar, setHoveredBar] = React.useState<{ month: string; stock: string } | null>(null)
  
  const maxValue = Math.max(...data.map(item => item.total))
  const minValue = 0
  const range = maxValue - minValue
  
  // Generate nice y-axis labels
  const getYAxisLabels = () => {
    const step = range / 4
    return [
      minValue,
      minValue + step,
      minValue + step * 2,
      minValue + step * 3,
      maxValue
    ].map(val => Math.round(val))
  }
  
  const yAxisLabels = getYAxisLabels()
  const reversedYAxisLabels = [...yAxisLabels].reverse()
  
  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <div className="flex-1 flex">
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
          
          {/* Stacked Bars */}
          <div className="absolute inset-0 flex items-end justify-around px-2 pb-2">
            {data.map((monthData) => {
              const totalHeight = range > 0 ? ((monthData.total - minValue) / range) * 100 : 0
              
              return (
                <div
                  key={monthData.name}
                  className="flex flex-col items-center flex-1 max-w-16"
                >
                  {/* Tooltip */}
                  {hoveredBar && hoveredBar.month === monthData.name && (
                    <div className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white whitespace-nowrap mb-2">
                      {(() => {
                        const stock = monthData.stocks.find(s => s.name === hoveredBar.stock)
                        return stock ? `${stock.name}: $${stock.value.toFixed(2)}` : ''
                      })()}
                    </div>
                  )}
                  
                  {/* Stacked Bar */}
                  <div
                    className="w-8 relative flex flex-col-reverse rounded"
                    style={{
                      height: `${totalHeight}%`,
                      backgroundColor: '#374151'
                    }}
                  >
                    {monthData.stocks.map((stock, stockIndex) => {
                      const stockHeight = (stock.value / monthData.total) * 100
                      const isHovered = hoveredBar?.month === monthData.name && hoveredBar?.stock === stock.name
                      
                      return (
                        <div
                          key={stock.name}
                          className={cn(
                            "w-full transition-all duration-200 cursor-pointer",
                            stockIndex === monthData.stocks.length - 1 ? "rounded-t" : "",
                            stockIndex === 0 ? "rounded-b" : "",
                            isHovered ? "opacity-80 z-10 relative shadow-lg" : "opacity-100"
                          )}
                          style={{
                            height: `${Math.max(stockHeight, 2)}%`,
                            backgroundColor: stock.color,
                            transform: isHovered ? "scaleX(1.1)" : "scaleX(1)",
                            transformOrigin: "center",
                            minHeight: '2px'
                          }}
                          onMouseEnter={() => {
                            setHoveredBar({ month: monthData.name, stock: stock.name })
                            onHover?.({ stock: stock.name, value: stock.value, month: monthData.name })
                          }}
                          onMouseLeave={() => {
                            setHoveredBar(null)
                            onHover?.(null)
                          }}
                        />
                      )
                    })}
                  </div>
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