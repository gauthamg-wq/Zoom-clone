/** Parse a meeting code from raw input or a full invite URL. */
export function parseMeetingCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let candidate = trimmed;

  if (trimmed.includes("://") || trimmed.includes("/meeting/")) {
    try {
      const url = trimmed.includes("://")
        ? new URL(trimmed)
        : new URL(trimmed, "http://placeholder");
      const match = url.pathname.match(/\/meeting\/([^/?#]+)/);
      if (match?.[1]) candidate = match[1];
    } catch {
      // Not a URL — fall through to digit extraction.
    }
  }

  const digits = candidate.replace(/[\s-]/g, "");
  if (!/^\d{9,11}$/.test(digits)) return null;
  return digits.slice(0, 9);
}

/** Zoom-style display: `123 456 789` */
export function formatMeetingCode(code: string): string {
  const digits = code.replace(/\D/g, "");
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}
