import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
  variant?: 'default' | 'text' | 'image' | 'avatar' | 'button' | 'card';
}

function Skeleton({
  className,
  shimmer = true,
  variant = 'default',
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    text: "rounded h-4",
    image: "rounded-lg",
    avatar: "rounded-full",
    button: "rounded-md h-10",
    card: "rounded-lg"
  };

  return (
    <div
      className={cn(
        "bg-muted relative overflow-hidden",
        variantClasses[variant],
        shimmer ? "animate-pulse-subtle" : "animate-pulse",
        className
      )}
      {...props}
    >
      {shimmer && (
        <div 
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-background/30 to-transparent animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--background)/0.3), transparent)'
          }}
        />
      )}
    </div>
  )
}

function SkeletonText({ 
  className, 
  lines = 1, 
  widths = ['100%'],
  ...props 
}: SkeletonProps & { 
  lines?: number; 
  widths?: string[] 
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn("h-4", className)}
          style={{ width: widths[i % widths.length] }}
          {...props}
        />
      ))}
    </div>
  )
}

function SkeletonImage({ 
  className, 
  aspectRatio = "16/9",
  ...props 
}: SkeletonProps & { 
  aspectRatio?: string 
}) {
  return (
    <Skeleton
      variant="image"
      className={cn("w-full", className)}
      style={{ aspectRatio }}
      {...props}
    />
  )
}

function SkeletonAvatar({ 
  className, 
  size = "md",
  ...props 
}: SkeletonProps & { 
  size?: "sm" | "md" | "lg" 
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  return (
    <Skeleton
      variant="avatar"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  )
}

function SkeletonButton({ 
  className,
  size = "md",
  ...props 
}: SkeletonProps & { 
  size?: "sm" | "md" | "lg" 
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-28"
  };

  return (
    <Skeleton
      variant="button"
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonImage, 
  SkeletonAvatar, 
  SkeletonButton 
}