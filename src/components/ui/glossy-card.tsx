import * as React from "react"
import { cn } from "@/lib/utils"

const GlossyCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass rounded-2xl shadow-aero backdrop-blur-aero transition-aero",
      "hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
      "border border-glass-border/30",
      className
    )}
    {...props}
  />
))
GlossyCard.displayName = "GlossyCard"

const GlossyCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
GlossyCardHeader.displayName = "GlossyCardHeader"

const GlossyCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
GlossyCardTitle.displayName = "GlossyCardTitle"

const GlossyCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
GlossyCardDescription.displayName = "GlossyCardDescription"

const GlossyCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
GlossyCardContent.displayName = "GlossyCardContent"

const GlossyCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
GlossyCardFooter.displayName = "GlossyCardFooter"

export { GlossyCard, GlossyCardHeader, GlossyCardFooter, GlossyCardTitle, GlossyCardDescription, GlossyCardContent }
