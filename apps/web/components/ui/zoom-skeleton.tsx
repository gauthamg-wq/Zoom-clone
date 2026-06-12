import { cn } from "@/lib/utils"

function ZoomSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shimmer rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { ZoomSkeleton }
