"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ZoomButton } from "@/components/ui/zoom-button";
import {
  ZoomCard,
  ZoomCardContent,
  ZoomCardHeader,
  ZoomCardTitle,
} from "@/components/ui/zoom-card";
import { toast } from "sonner";
import { api } from "@/lib/api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration_minutes: z.coerce.number().min(15, "Minimum 15 minutes"),
});

type FormValues = z.infer<typeof schema>;

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export function ScheduleMeetingForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { duration_minutes: 30 },
  });

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
    try {
      // Combine date + time into ISO 8601
      const scheduled_start_time = new Date(
        `${data.date}T${data.time}:00`,
      ).toISOString();

      await api.scheduleMeeting({
        title: data.title,
        description: data.description || undefined,
        scheduled_start_time,
        duration_minutes: data.duration_minutes,
      });

      setSuccess(true);
      toast.success("Meeting scheduled successfully!");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to schedule meeting",
      );
    }
  }

  return (
    <ZoomCard className="w-full max-w-lg mx-auto">
      <ZoomCardHeader>
        <ZoomCardTitle>Schedule a Meeting</ZoomCardTitle>
      </ZoomCardHeader>
      <ZoomCardContent>
        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-foreground">Meeting scheduled!</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                {...register("title")}
                placeholder="Weekly Team Sync"
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Optional agenda or notes"
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date <span className="text-destructive">*</span>
                </label>
                <input
                  {...register("date")}
                  type="date"
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                {errors.date && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Time <span className="text-destructive">*</span>
                </label>
                <input
                  {...register("time")}
                  type="time"
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                {errors.time && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.time.message}
                  </p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Duration
              </label>
              <select
                {...register("duration_minutes")}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
                ))}
              </select>
              {errors.duration_minutes && (
                <p className="text-xs text-destructive mt-1">
                  {errors.duration_minutes.message}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-xs text-destructive">{submitError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <ZoomButton
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </ZoomButton>
              <ZoomButton
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Scheduling…" : "Schedule"}
              </ZoomButton>
            </div>
          </form>
        )}
      </ZoomCardContent>
    </ZoomCard>
  );
}
