"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface DividendBarChartProps {
  data: Array<{ name: string; value: number }>
}

const chartConfig = {
  value: {
    label: "Dividend",
    color: "#10b981",
  },
} satisfies ChartConfig

export function DividendBarChart({ data }: DividendBarChartProps) {
  // Convert data format for Recharts
  const chartData = data.map(item => ({
    month: item.name,
    dividend: item.value
  }))

  // Calculate trending percentage (comparing last vs first month)
  const firstMonth = data[0]?.value || 0
  const lastMonth = data[data.length - 1]?.value || 0
  const trendPercentage = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth * 100) : 0
  const isTrendingUp = trendPercentage > 0

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Monthly Dividend Income</CardTitle>
        <CardDescription className="text-gray-400">
          Dividend payments received each month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, "Dividend"]}
            />
            <Bar dataKey="dividend" fill="var(--color-value)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `$${value.toFixed(0)}`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}