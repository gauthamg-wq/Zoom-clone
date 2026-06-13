"use client";

import { useEffect, useState } from "react";
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
import { ZoomSkeleton } from "@/components/ui/zoom-skeleton";
import { api } from "@/lib/api";
import { DEFAULT_DISPLAY_NAME } from "@/lib/constants";
import { formatMeetingCode, parseMeetingCode } from "@/lib/meeting-code";
import type { Meeting } from "@/lib/types";

const codeSchema = z.object({
  code: z.string().min(1, "Meeting ID or invite link is required"),
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
  const [step, setStep] = useState<"code" | "name">("code");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [meetingCode, setMeetingCode] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [validating, setValidating] = useState(!!initialCode);

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: initialCode ?? "" },
  });

  const nameForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { display_name: DEFAULT_DISPLAY_NAME },
  });

  async function validateAndAdvance(rawInput: string) {
    setApiError(null);
    const parsed = parseMeetingCode(rawInput);
    if (!parsed) {
      setApiError("Enter a valid 9-digit meeting ID or invite link");
      return false;
    }
    try {
      const found = await api.getMeeting(parsed);
      setMeeting(found);
      setMeetingCode(parsed);
      setStep("name");
      return true;
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Meeting not found");
      return false;
    }
  }

  useEffect(() => {
    if (!initialCode) return;
    let cancelled = false;
    void (async () => {
      setValidating(true);
      const ok = await validateAndAdvance(initialCode);
      if (!cancelled && !ok) {
        setStep("code");
        codeForm.setValue("code", initialCode);
      }
      if (!cancelled) setValidating(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function onCodeSubmit(data: CodeForm) {
    setValidating(true);
    await validateAndAdvance(data.code);
    setValidating(false);
  }

  function onNameSubmit(data: NameForm) {
    router.push(
      `/meeting/${meetingCode}?name=${encodeURIComponent(data.display_name)}`,
    );
  }

  if (validating && step === "code") {
    return (
      <ZoomCard className="w-full max-w-md mx-auto">
        <ZoomCardHeader>
          <ZoomCardTitle>Join a Meeting</ZoomCardTitle>
        </ZoomCardHeader>
        <ZoomCardContent className="space-y-3">
          <ZoomSkeleton className="h-10 w-full" />
          <ZoomSkeleton className="h-10 w-full" />
        </ZoomCardContent>
      </ZoomCard>
    );
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
                Meeting ID or invite link
              </label>
              <input
                {...codeForm.register("code")}
                placeholder="123-456-789 or https://…/meeting/123456789"
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
              disabled={codeForm.formState.isSubmitting || validating}
            >
              {codeForm.formState.isSubmitting || validating
                ? "Checking…"
                : "Continue"}
            </ZoomButton>
          </form>
        ) : (
          <form
            onSubmit={nameForm.handleSubmit(onNameSubmit)}
            className="space-y-4"
          >
            <div className="text-sm text-muted-foreground">
              Meeting ID:{" "}
              <span className="font-mono font-medium text-foreground">
                {formatMeetingCode(meetingCode)}
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
              <ZoomButton type="submit" className="flex-1">
                Join Now
              </ZoomButton>
            </div>
          </form>
        )}
      </ZoomCardContent>
    </ZoomCard>
  );
}
