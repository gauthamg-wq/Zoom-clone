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
import { api } from "@/lib/api";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import type { Meeting } from "@/lib/types";

const codeSchema = z.object({
  code: z
    .string()
    .min(9, "Meeting code must be at least 9 characters")
    .max(11, "Meeting code too long"),
});

const nameSchema = z.object({
  display_name: z.string().min(1, "Name is required"),
});

type CodeForm = z.infer<typeof codeSchema>;
type NameForm = z.infer<typeof nameSchema>;

interface JoinMeetingFormProps {
  initialCode?: string;
}

export function JoinMeetingForm({ initialCode }: JoinMeetingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"code" | "name">(
    initialCode ? "name" : "code",
  );
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [meetingCode, setMeetingCode] = useState(initialCode ?? "");
  const [apiError, setApiError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: initialCode ?? "" },
  });

  const nameForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { display_name: DEFAULT_DISPLAY_NAME },
  });

  async function onCodeSubmit(data: CodeForm) {
    setApiError(null);
    const cleanCode = data.code.replace(/-/g, "");
    try {
      const found = await api.getMeeting(cleanCode);
      setMeeting(found);
      setMeetingCode(cleanCode);
      setStep("name");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Meeting not found");
    }
  }

  async function onNameSubmit(data: NameForm) {
    setApiError(null);
    setJoining(true);
    try {
      const { participant } = await api.joinMeeting(
        meetingCode,
        data.display_name,
      );
      router.push(
        `/meeting/${meetingCode}?name=${encodeURIComponent(data.display_name)}&participantId=${participant.id}`,
      );
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : "Failed to join meeting",
      );
      setJoining(false);
    }
  }

  return (
    <ZoomCard className="w-full max-w-md mx-auto">
      <ZoomCardHeader>
        <ZoomCardTitle>
          {step === "code"
            ? "Join a Meeting"
            : (meeting?.title ?? "Join Meeting")}
        </ZoomCardTitle>
      </ZoomCardHeader>
      <ZoomCardContent>
        {step === "code" ? (
          <form
            onSubmit={codeForm.handleSubmit(onCodeSubmit)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Meeting ID
              </label>
              <input
                {...codeForm.register("code")}
                placeholder="123-456-789"
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              {codeForm.formState.errors.code && (
                <p className="text-xs text-destructive mt-1">
                  {codeForm.formState.errors.code.message}
                </p>
              )}
            </div>
            {apiError && <p className="text-xs text-destructive">{apiError}</p>}
            <ZoomButton
              type="submit"
              className="w-full"
              disabled={codeForm.formState.isSubmitting}
            >
              {codeForm.formState.isSubmitting ? "Checking…" : "Continue"}
            </ZoomButton>
          </form>
        ) : (
          <form
            onSubmit={nameForm.handleSubmit(onNameSubmit)}
            className="space-y-4"
          >
            <div className="text-sm text-muted-foreground">
              Meeting code:{" "}
              <span className="font-mono font-medium text-foreground">
                {meetingCode}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Your name
              </label>
              <input
                {...nameForm.register("display_name")}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              {nameForm.formState.errors.display_name && (
                <p className="text-xs text-destructive mt-1">
                  {nameForm.formState.errors.display_name.message}
                </p>
              )}
            </div>
            {apiError && <p className="text-xs text-destructive">{apiError}</p>}
            <div className="flex gap-2">
              <ZoomButton
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep("code");
                  setApiError(null);
                }}
              >
                Back
              </ZoomButton>
              <ZoomButton type="submit" className="flex-1" disabled={joining}>
                {joining ? "Joining…" : "Join Now"}
              </ZoomButton>
            </div>
          </form>
        )}
      </ZoomCardContent>
    </ZoomCard>
  );
}
