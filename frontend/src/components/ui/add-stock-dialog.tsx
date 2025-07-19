"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface Holding {
  symbol: string
  shares: number
}

interface AddStockDialogProps {
  holdings: Holding[]
  onAdd: (symbol: string, shares: number) => Promise<void>
  children?: React.ReactNode
}

export function AddStockDialog({ holdings, onAdd, children }: AddStockDialogProps) {
  const [symbol, setSymbol] = useState('')
  const [shares, setShares] = useState('')
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!symbol.trim() || !shares.trim()) {
      setError('Please enter both symbol and shares')
      return
    }

    const numShares = Number(shares)
    if (isNaN(numShares) || numShares <= 0) {
      setError('Please enter a valid positive number of shares')
      return
    }

    const upperSymbol = symbol.toUpperCase().trim()
    
    // Check for duplicates
    if (holdings.some(h => h.symbol === upperSymbol)) {
      setError('Stock already exists in portfolio')
      return
    }

    setIsLoading(true)
    
    try {
      await onAdd(upperSymbol, numShares)
      // Reset form and close dialog on success
      setSymbol('')
      setShares('')
      setError('')
      setOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add stock')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setSymbol('')
      setShares('')
      setError('')
    }
  }

  const isFormValid = symbol.trim() && shares.trim() && 
                     !isNaN(Number(shares)) && Number(shares) > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Add a new stock to your portfolio. Enter the ticker symbol and number of shares.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. AAPL"
                autoFocus
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="shares">Number of Shares</Label>
              <Input
                id="shares"
                type="number"
                min="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
              />
            </div>
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}