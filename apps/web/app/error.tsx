"use client";

import { useEffect } from "react";
import { ZoomButton } from "@/components/ui/zoom-button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <ZoomButton onClick={reset}>Try again</ZoomButton>
          <ZoomButton variant="outline" asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </ZoomButton>
        </div>
      </div>
    </div>
  );
}
