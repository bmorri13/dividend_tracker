"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

const useDialog = () => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog")
  }
  return context
}

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Dialog = ({ children, open: openProp, onOpenChange }: DialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const open = openProp !== undefined ? openProp : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, setOpen])

  return (
    <DialogContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const DialogTrigger = ({ children, asChild = false }: DialogTriggerProps) => {
  const { onOpenChange } = useDialog()
  
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => onOpenChange(true)
    } as Record<string, unknown>)
  }

  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  )
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

const DialogContent = ({ children, className }: DialogContentProps) => {
  const { open, onOpenChange } = useDialog()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Content */}
      <div className={cn(
        "relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6",
        className
      )}>
        {children}
        
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

const DialogHeader = ({ children, className }: DialogHeaderProps) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
    {children}
  </div>
)

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

const DialogTitle = ({ children, className }: DialogTitleProps) => (
  <h2 className={cn("text-lg font-semibold text-white", className)}>
    {children}
  </h2>
)

interface DialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

const DialogDescription = ({ children, className }: DialogDescriptionProps) => (
  <p className={cn("text-sm text-gray-400", className)}>
    {children}
  </p>
)

interface DialogFooterProps {
  children: React.ReactNode
  className?: string
}

const DialogFooter = ({ children, className }: DialogFooterProps) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}>
    {children}
  </div>
)

interface DialogCloseProps {
  children: React.ReactNode
  asChild?: boolean
}

const DialogClose = ({ children, asChild = false }: DialogCloseProps) => {
  const { onOpenChange } = useDialog()
  
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => onOpenChange(false)
    } as Record<string, unknown>)
  }

  return (
    <button onClick={() => onOpenChange(false)}>
      {children}
    </button>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}