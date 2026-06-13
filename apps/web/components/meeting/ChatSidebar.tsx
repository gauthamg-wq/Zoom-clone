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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <aside className="fixed inset-x-0 bottom-0 h-80 sm:relative sm:inset-auto sm:bottom-auto sm:h-auto sm:w-72 lg:w-80 bg-[#1c1c1c] border-t sm:border-t-0 sm:border-l border-[#2a2a2a] flex flex-col shrink-0 z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#2a2a2a] shrink-0">
        <h2 className="text-sm font-semibold text-white">In-meeting chat</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/10 transition"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-12 gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#2d2d2d] flex items-center justify-center">
              <Send className="w-5 h-5 text-[#555]" />
            </div>
            <p className="text-[#666] text-sm">
              Messages can only be seen by people in the call.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-0.5 max-w-[88%]",
                msg.isOwn ? "ml-auto items-end" : "items-start",
              )}
            >
              {!msg.isOwn && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-5 h-5 rounded-full bg-linear-to-br from-[#0b5cff] to-[#0d4bcf] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                    {msg.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-[#888] font-medium">
                    {msg.displayName}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "px-3 py-2 rounded-2xl text-sm wrap-break-word",
                  msg.isOwn
                    ? "bg-[#0b5cff] text-white rounded-tr-sm"
                    : "bg-[#2d2d2d] text-gray-100 rounded-tl-sm",
                )}
              >
                {msg.text}
              </div>
              <span className="text-[11px] text-[#555] px-1">
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
      <div className="px-3 py-3 border-t border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-2 bg-[#2d2d2d] border border-[#3a3a3a] rounded-xl px-3 py-2 focus-within:border-[#555] transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message everyone…"
            className="flex-1 bg-transparent text-sm text-white placeholder-[#555] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            title="Send (Enter)"
            className="text-[#0b5cff] hover:text-[#2d7aff] disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
