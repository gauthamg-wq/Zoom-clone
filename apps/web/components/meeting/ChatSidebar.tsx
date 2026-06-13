"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

interface ChatSidebarProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
}

export function ChatSidebar({ messages, onSend, onClose }: ChatSidebarProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 h-80 sm:relative sm:inset-auto sm:bottom-auto sm:h-auto sm:w-72 lg:w-80 bg-gray-900 border-t sm:border-t-0 sm:border-l border-gray-800 flex flex-col shrink-0 z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <h2 className="text-sm font-semibold text-white">Chat</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition rounded p-1"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm pt-8">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-0.5 max-w-[85%]",
                msg.isOwn ? "ml-auto items-end" : "items-start",
              )}
            >
              {!msg.isOwn && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary/70 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {msg.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-400">
                    {msg.displayName}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "px-3 py-2 rounded-2xl text-sm wrap-break-word",
                  msg.isOwn
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-gray-800 text-gray-100 rounded-tl-sm",
                )}
              >
                {msg.text}
              </div>
              <span className="text-xs text-gray-600 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="px-3 py-3 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message everyone…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            title="Send message"
            className="text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </aside>
  );
}
