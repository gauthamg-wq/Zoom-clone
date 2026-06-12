"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "@/lib/constants";
import type { WSEvent, WSMessage } from "@/lib/types";

interface UseWebSocketOptions {
  meetingCode: string;
  clientId: string;
  onEvent: (event: WSEvent) => void;
}

interface UseWebSocketReturn {
  send: (message: WSMessage) => void;
  isConnected: boolean;
}

export function useWebSocket({
  meetingCode,
  clientId,
  onEvent,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<WSMessage[]>([]);
  const onEventRef = useRef(onEvent);
  const [isConnected, setIsConnected] = useState(false);

  // Keep the callback ref fresh so the effect closure doesn't go stale
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const url = `${WS_URL}/ws/${meetingCode}?client_id=${clientId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Flush any messages queued before the connection was ready
      queueRef.current.forEach((msg) => ws.send(JSON.stringify(msg)));
      queueRef.current = [];
    };

    ws.onmessage = (ev: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(ev.data) as WSEvent;
        onEventRef.current(parsed);
      } catch {
        // Ignore malformed frames
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
    // Only re-connect if the room or clientId changes — not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingCode, clientId]);

  const send = useCallback((message: WSMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      // Buffer until connection opens
      queueRef.current.push(message);
    }
  }, []);

  return { send, isConnected };
}
