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

export { Skeleton }