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
import { Edit3 } from "lucide-react"

interface EditSharesDialogProps {
  symbol: string
  currentShares: number
  onSave: (symbol: string, newShares: number) => void
  children?: React.ReactNode
}

export function EditSharesDialog({ symbol, currentShares, onSave, children }: EditSharesDialogProps) {
  const [shares, setShares] = useState(currentShares.toString())
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newShares = Number(shares)
    if (!shares.trim() || isNaN(newShares) || newShares <= 0) {
      return
    }
    
    onSave(symbol, newShares)
    setOpen(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      // Reset to current shares when opening
      setShares(currentShares.toString())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Shares</DialogTitle>
            <DialogDescription>
              Update the number of shares for {symbol}. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input 
                id="symbol" 
                value={symbol} 
                disabled
                className="bg-gray-600 text-gray-300"
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
                placeholder="Enter number of shares"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit"
              disabled={!shares.trim() || isNaN(Number(shares)) || Number(shares) <= 0}
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}