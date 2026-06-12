import { ZoomButton } from "@/components/ui/zoom-button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-7xl font-bold text-primary">404</p>
        <h1 className="text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <ZoomButton asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </ZoomButton>
      </div>
    </div>
  );
}
