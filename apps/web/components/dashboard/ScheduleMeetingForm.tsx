"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  AlignLeft,
  Calendar,
} from "lucide-react";
import { ZoomButton } from "@/components/ui/zoom-button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { CopyInviteLink } from "@/components/meeting/CopyInviteLink";
import type { Meeting } from "@/lib/types";

const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    duration_minutes: z.coerce.number().min(15, "Minimum 15 minutes"),
  })
  .refine(
    (data) => {
      const scheduled = new Date(`${data.date}T${data.time}:00`);
      return scheduled > new Date();
    },
    { message: "Meeting must be scheduled in the future", path: ["date"] },
  );

type FormValues = z.infer<typeof schema>;

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
  { value: 90, label: "1.5 hr" },
  { value: 120, label: "2 hr" },
];

const inputClass =
  "w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {children}
      </span>
    </div>
  );
}

export function ScheduleMeetingForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [scheduledMeeting, setScheduledMeeting] = useState<Meeting | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { duration_minutes: 30 },
  });

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
    try {
      const scheduled_start_time = new Date(
        `${data.date}T${data.time}:00`,
      ).toISOString();

      const meeting = await api.scheduleMeeting({
        title: data.title,
        description: data.description || undefined,
        scheduled_start_time,
        duration_minutes: data.duration_minutes,
      });

      setScheduledMeeting(meeting);
      setSuccess(true);
      toast.success("Meeting scheduled!");
      setTimeout(() => router.push("/dashboard"), 4000);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to schedule meeting",
      );
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (success && scheduledMeeting) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Meeting scheduled!
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Share the invite link with your participants.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left">
            <p className="font-semibold text-gray-900 mb-0.5">
              {scheduledMeeting.title}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {scheduledMeeting.meeting_code}
            </p>
          </div>
          <CopyInviteLink meeting={scheduledMeeting} variant="inline" />
          <p className="text-xs text-gray-400">
            Redirecting to dashboard in a moment…
          </p>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <CalendarPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Schedule a Meeting
          </h1>
          <p className="text-sm text-gray-500">
            Set up a future meeting and share the invite
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ── Meeting Details ── */}
        <section>
          <SectionLabel icon={AlignLeft}>Meeting details</SectionLabel>
          <div className="space-y-3">
            <div>
              <input
                {...register("title")}
                placeholder="Meeting title"
                autoFocus
                className={inputClass}
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Description (optional)"
                className={cn(inputClass, "resize-none")}
              />
            </div>
          </div>
        </section>

        {/* ── Date & Time ── */}
        <section>
          <SectionLabel icon={Calendar}>Date &amp; time</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input {...register("date")} type="date" className={inputClass} />
              {errors.date && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <input {...register("time")} type="time" className={inputClass} />
              {errors.time && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.time.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Duration ── */}
        <section>
          <SectionLabel icon={Clock}>Duration</SectionLabel>
          <Controller
            name="duration_minutes"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium border transition",
                      field.value === value
                        ? "bg-primary text-white border-primary shadow-sm shadow-primary/30"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.duration_minutes && (
            <p className="text-xs text-red-500 mt-1.5">
              {errors.duration_minutes.message}
            </p>
          )}
        </section>

        {/* ── Error ── */}
        {submitError && (
          <p className="text-sm text-red-500 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            {submitError}
          </p>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-1">
          <ZoomButton
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </ZoomButton>
          <ZoomButton type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Scheduling…" : "Schedule Meeting"}
          </ZoomButton>
        </div>
      </form>
    </div>
  );
}
