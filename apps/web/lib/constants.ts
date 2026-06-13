export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
export const DEFAULT_DISPLAY_NAME = "Demo User";

if (
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  WS_URL.startsWith("ws://")
) {
  console.warn(
    "[Config] WS_URL uses ws:// on an https:// page — WebSocket connections will be blocked by the browser's mixed-content policy. Set NEXT_PUBLIC_WS_URL=wss://your-backend.",
  );
}
