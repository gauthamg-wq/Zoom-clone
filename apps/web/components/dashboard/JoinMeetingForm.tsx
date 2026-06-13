"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Video, ArrowLeft, Users } from "lucide-react";
import { ZoomButton } from "@/components/ui/zoom-button";
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

const inputClass =
  "w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

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

  return (
    <div className="w-full max-w-sm">
      {step === "code" ? (
        <>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Join a Meeting</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Enter the meeting ID or paste an invite link
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={codeForm.handleSubmit(onCodeSubmit)}
            className="space-y-4"
          >
            <div>
              <input
                {...codeForm.register("code")}
                placeholder="123-456-789"
                autoFocus
                className={inputClass}
              />
              {codeForm.formState.errors.code && (
                <p className="text-xs text-red-500 mt-1.5">
                  {codeForm.formState.errors.code.message}
                </p>
              )}
              {apiError && (
                <p className="text-xs text-red-500 mt-1.5">{apiError}</p>
              )}
            </div>

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

          <p className="text-xs text-center text-gray-400 mt-6">
            Don&apos;t have a meeting ID?{" "}
            <a href="/dashboard" className="text-primary hover:underline">
              Go back to dashboard
            </a>
          </p>
        </>
      ) : (
        <>
          {/* Back */}
          <button
            onClick={() => {
              setStep("code");
              setApiError(null);
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Meeting card */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {meeting?.title ?? "Meeting"}
              </p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {formatMeetingCode(meetingCode)}
              </p>
            </div>
          </div>

          {/* Name form */}
          <p className="text-sm font-medium text-gray-700 mb-2">
            Your display name
          </p>
          <form
            onSubmit={nameForm.handleSubmit(onNameSubmit)}
            className="space-y-4"
          >
            <div>
              <input
                {...nameForm.register("display_name")}
                autoFocus
                placeholder="Enter your name"
                className={inputClass}
              />
              {nameForm.formState.errors.display_name && (
                <p className="text-xs text-red-500 mt-1.5">
                  {nameForm.formState.errors.display_name.message}
                </p>
              )}
              {apiError && (
                <p className="text-xs text-red-500 mt-1.5">{apiError}</p>
              )}
            </div>

            <ZoomButton type="submit" className="w-full">
              Join Now
            </ZoomButton>
          </form>
        </>
      )}
    </div>
  );
}
