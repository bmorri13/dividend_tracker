"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PieChart } from "@/components/ui/pie-chart"
import { DividendBarChart } from "@/components/ui/dividend-bar-chart"
import { TrendingUp, DollarSign, PieChart as PieChartIcon, BarChart3, Trash2, Edit3 } from "lucide-react"
import { useEffect, useState } from "react"
import { ApiService, DividendSummary, PortfolioHolding } from "../../lib/api"
import { ConfirmModal, AlertModal } from "@/components/ui/modal"
import { EditSharesDialog } from "@/components/ui/edit-shares-dialog"
import { AddStockDialog } from "@/components/ui/add-stock-dialog"
import { LoadingPage } from "@/components/ui/loading-spinner"

// Colors for charts
const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
]


// Generate monthly dividend data based on actual portfolio
const generateMonthlyDividendData = (monthlyTotal: number) => [
  { name: "Jan", value: monthlyTotal * 0.52 }, // Lower month - fewer companies pay
  { name: "Feb", value: monthlyTotal * 0.79 }, // Some quarterly payments
  { name: "Mar", value: monthlyTotal * 1.05 }, // Quarter end payments
  { name: "Apr", value: monthlyTotal * 0.75 }, // Mid-quarter month
  { name: "May", value: monthlyTotal * 0.98 }, // Some payments
  { name: "Jun", value: monthlyTotal * 1.22 }, // Quarter end payments
  { name: "Jul", value: monthlyTotal * 0.67 }, // Lower summer month
  { name: "Aug", value: monthlyTotal * 0.89 }, // Some payments
  { name: "Sep", value: monthlyTotal * 1.12 }, // Quarter end payments
  { name: "Oct", value: monthlyTotal * 0.82 }, // Moderate month
  { name: "Nov", value: monthlyTotal * 1.01 }, // Some payments
  { name: "Dec", value: monthlyTotal * 1.33 }, // Highest month - quarter end + year-end
]

// Default portfolio holdings
const DEFAULT_HOLDINGS = [
  { symbol: 'AAPL', shares: 100 },
  { symbol: 'MSFT', shares: 50 },
  { symbol: 'JNJ', shares: 75 }
]

interface Holding {
  symbol: string
  shares: number
}

export default function DividendTracker() {
  const [portfolioData, setPortfolioData] = useState<PortfolioHolding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })
  
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'info' | 'error' | 'warning' | 'success'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  // Load portfolio data from database on mount
  useEffect(() => {
    async function fetchPortfolioData() {
      try {
        setError(null)
        setLoading(true)
        console.log('Fetching portfolio data from database...')
        
        const data = await ApiService.getPortfolioHoldings()
        
        console.log('Fetched data:', data)
        setPortfolioData(data)
      } catch (error) {
        console.error('Error fetching portfolio data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch portfolio data')
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [])

  // Modal helper functions
  const showAlert = (title: string, message: string, type: 'info' | 'error' | 'warning' | 'success' = 'info') => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type
    })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    })
  }

  const closeAlert = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }))
  }

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }

  // Portfolio management functions
  const addStock = async (symbol: string, shares: number) => {
    try {
      // Create holding in database
      const newHolding = await ApiService.createPortfolioHolding({
        ticker: symbol,
        shares: shares
      })
      
      // Add to local state
      setPortfolioData(prev => [...prev, newHolding])
    } catch (error) {
      console.error('Error adding stock:', error)
      throw new Error(`Failed to add ${symbol}. Please check the symbol is valid.`)
    }
  }

  const removeStock = (id: string, symbol: string) => {
    showConfirm(
      'Remove Stock',
      `Are you sure you want to remove ${symbol} from your portfolio?`,
      async () => {
        try {
          await ApiService.deletePortfolioHolding(id)
          // Remove from local state
          setPortfolioData(prev => prev.filter(h => h.id !== id))
        } catch (error) {
          console.error('Error removing stock:', error)
          showAlert('Error', 'Failed to remove stock from portfolio', 'error')
        }
      }
    )
  }

  const updateShares = async (id: string, newShares: number) => {
    try {
      const updatedHolding = await ApiService.updatePortfolioHolding(id, { shares: newShares })
      // Update local state
      setPortfolioData(prev => prev.map(h => h.id === id ? updatedHolding : h))
    } catch (error) {
      console.error('Error updating shares:', error)
      showAlert('Error', 'Failed to update shares', 'error')
    }
  }

  if (loading) {
    return (
      <LoadingPage 
        title="Dividend Tracker"
        subtitle="Loading your portfolio data and latest market information..."
      />
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xl text-red-400">Error loading portfolio data</div>
          <div className="text-gray-400">{error}</div>
          <div className="text-sm text-gray-500">Make sure the Go backend is running on port 8080</div>
        </div>
      </div>
    )
  }

  // Calculate totals and averages
  const totalPortfolioValue = portfolioData.reduce((sum, stock) => sum + stock.total_value, 0)
  const totalMonthlyDividends = portfolioData.reduce((sum, stock) => sum + stock.monthly_dividend, 0)
  const averageDividendYield = portfolioData.length > 0 
    ? portfolioData.reduce((sum, stock) => sum + stock.dividend_yield, 0) / portfolioData.length 
    : 0

  // Prepare pie chart data
  const pieChartData = portfolioData.map((stock) => ({
    name: stock.ticker,
    value: stock.total_value,
    percentage: ((stock.total_value / totalPortfolioValue) * 100).toFixed(1),
  }))

  // Generate dynamic monthly dividend data
  const monthlyDividendData = generateMonthlyDividendData(totalMonthlyDividends)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dividend Portfolio Tracker</h1>
          <p className="text-muted-foreground">Track your dividend-paying investments and monthly income</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${totalPortfolioValue.toLocaleString()}</div>
              <p className="text-xs text-gray-400">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Monthly Dividends</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalMonthlyDividends.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Average monthly income</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Annual Dividend Income</CardTitle>
              <PieChartIcon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalMonthlyDividends * 12).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Projected yearly dividends</p>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Management */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Portfolio Management</CardTitle>
                <CardDescription className="text-gray-400">Add or remove stocks from your portfolio</CardDescription>
              </div>
              <AddStockDialog 
                holdings={portfolioData.map(h => ({symbol: h.ticker, shares: h.shares}))} 
                onAdd={addStock} 
              />
            </div>
          </CardHeader>
          <CardContent>

            {portfolioData.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No stocks in your portfolio yet.</p>
                <p className="text-sm mt-2">Click &quot;Add Stock&quot; to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioData.map((holding) => (
                  <div key={holding.ticker} className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="border-gray-500 text-gray-200">
                        {holding.ticker}
                      </Badge>
                      <button
                        onClick={() => removeStock(holding.id, holding.ticker)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Remove stock"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Shares: {holding.shares}</span>
                        <EditSharesDialog
                          symbol={holding.ticker}
                          currentShares={holding.shares}
                          onSave={(_, shares) => updateShares(holding.id, shares)}
                        >
                          <button
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit shares"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </EditSharesDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Breakdown Pie Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Portfolio Breakdown</CardTitle>
              <CardDescription className="text-gray-400">Distribution of investments by value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <PieChart 
                  data={pieChartData}
                  colors={COLORS}
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Monthly Dividends Bar Chart */}
          <DividendBarChart data={monthlyDividendData} />
        </div>

        {/* Stock Holdings Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Stock Holdings</CardTitle>
            <CardDescription className="text-gray-400">
              Detailed breakdown of your dividend-paying stocks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="text-gray-200">
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Ticker</TableHead>
                    <TableHead className="text-gray-300">Company</TableHead>
                    <TableHead className="text-right text-gray-300">Shares</TableHead>
                    <TableHead className="text-right text-gray-300">Current Price</TableHead>
                    <TableHead className="text-right text-gray-300">Total Value</TableHead>
                    <TableHead className="text-right text-gray-300">Dividend Yield</TableHead>
                    <TableHead className="text-right text-gray-300">Monthly Dividend</TableHead>
                    <TableHead className="text-center text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioData.map((stock) => (
                    <TableRow key={stock.ticker} className="border-gray-700 hover:bg-gray-750">
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="border-gray-600 text-gray-200">
                          {stock.ticker}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-200">{stock.company}</TableCell>
                      <TableCell className="text-right text-gray-200">{stock.shares}</TableCell>
                      <TableCell className="text-right text-gray-200">${stock.current_price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-gray-200">
                        ${stock.total_value.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={stock.dividend_yield >= 3 ? "default" : "secondary"}
                          className={
                            stock.dividend_yield >= 3
                              ? "bg-green-700 text-green-100 border-green-600"
                              : "bg-gray-700 text-gray-200 border-gray-600"
                          }
                        >
                          {stock.dividend_yield.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-400">
                        ${stock.monthly_dividend.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <EditSharesDialog
                            symbol={stock.ticker}
                            currentShares={stock.shares}
                            onSave={(_, shares) => updateShares(stock.id, shares)}
                          >
                            <button
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Edit shares"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </EditSharesDialog>
                          <button
                            onClick={() => removeStock(stock.id, stock.ticker)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Remove stock"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="border-gray-700 border-t-2 bg-gray-750">
                    <TableCell className="font-bold text-white">TOTAL</TableCell>
                    <TableCell className="text-gray-400">Portfolio Summary</TableCell>
                    <TableCell className="text-right text-gray-400">-</TableCell>
                    <TableCell className="text-right text-gray-400">-</TableCell>
                    <TableCell className="text-right font-bold text-white">
                      ${totalPortfolioValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-blue-700 text-blue-100 border-blue-600">
                        {averageDividendYield.toFixed(2)}% avg
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-400">
                      ${totalMonthlyDividends.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center text-gray-400">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirm}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="OK"
          cancelText="Cancel"
          confirmVariant="destructive"
        />

        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={closeAlert}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
        />
      </div>
    </div>
  )
}
