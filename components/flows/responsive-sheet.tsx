"use client"

import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { claySurfaceVar, radiusSheet, shadowClay } from "@/lib/ui-styles"

/**
 * A modal that presents as a bottom sheet on mobile and a centered dialog on
 * desktop, sharing the same content. Same business logic, different container.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  mobile,
  clay,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  mobile?: boolean
  clay?: boolean
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          clay && `border-0 ${shadowClay} ${claySurfaceVar}`,
          mobile &&
            `top-auto bottom-0 left-0 max-h-[88dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-b-none ${radiusSheet} p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] data-open:slide-in-from-bottom data-closed:slide-out-to-bottom sm:max-w-none`
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {footer && <DialogFooter className="-m-2 gap-2 p-2 sm:justify-stretch">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
