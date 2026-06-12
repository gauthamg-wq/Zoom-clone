"use client";

import { useSearchParams } from "next/navigation";
import { JoinMeetingForm } from "@/components/dashboard/JoinMeetingForm";

export function JoinMeetingFormWrapper() {
  const params = useSearchParams();
  const code = params.get("code") ?? undefined;
  return <JoinMeetingForm initialCode={code} />;
}
