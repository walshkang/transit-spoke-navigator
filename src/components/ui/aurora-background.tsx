import * as React from "react"
import { cn } from "@/lib/utils"

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "radial"
}

const AuroraBackground = React.forwardRef<HTMLDivElement, AuroraBackgroundProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "subtle":
          return "gradient-aero-subtle"
        case "radial":
          return "bg-gradient-radial"
        default:
          return "gradient-aero"
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          getVariantClasses(),
          className
        )}
        {...props}
      >
        {/* Aurora glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-tertiary-aqua/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent/10 rounded-full blur-[90px] animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

AuroraBackground.displayName = "AuroraBackground"

export { AuroraBackground }
