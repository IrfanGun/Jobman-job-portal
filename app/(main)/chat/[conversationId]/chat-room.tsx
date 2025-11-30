"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import type { Database } from "@/lib/supabase/types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type Props = {
  conversationId: number;
  sendDisabledReason?: string | null;
};

const formatTimestamp = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ChatRoom({ conversationId, sendDisabledReason }: Props) {
  const { profile } = useCurrentUser();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimestamps = useRef<Record<number, number>>({});
  const lastTypingSent = useRef<number>(0);

  useEffect(() => {
    const loadMessages = async () => {
      const { data, error: fetchError } = await supabaseClient
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setMessages(data ?? []);
    };

    void loadMessages();

    const channel = supabaseClient
      .channel(`messages:conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((item) => item.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const senderId = (payload?.payload as any)?.senderId as number | undefined;
        if (!senderId || senderId === profile?.id) return;
        typingTimestamps.current = {
          ...typingTimestamps.current,
          [senderId]: Date.now(),
        };
        setTypingUsers(Object.keys(typingTimestamps.current).map(Number));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabaseClient.removeChannel(channel);
    };
  }, [conversationId, profile?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const next = Object.entries(typingTimestamps.current).reduce<
        Record<number, number>
      >((acc, [id, ts]) => {
        if (now - ts < 3000) acc[Number(id)] = ts;
        return acc;
      }, {});
      typingTimestamps.current = next;
      setTypingUsers(Object.keys(next).map(Number));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const signalTyping = () => {
    if (!profile?.id || !channelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 1000) return;
    lastTypingSent.current = now;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { senderId: profile.id },
    });
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendDisabledReason) {
      setError(sendDisabledReason);
      return;
    }
    const body = text.trim();
    if (!body) {
      setError("Pesan tidak boleh kosong.");
      return;
    }
    if (!profile?.id) {
      setError("Silakan login untuk mengirim pesan.");
      return;
    }

    setSending(true);
    setError(null);

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        senderId: profile.id,
        text: body,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload?.error ?? "Pesan gagal dikirim. Coba lagi nanti.");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          conversation_id: conversationId,
          sender_id: profile.id,
          body,
          status: "FAILED",
          failed_reason: payload?.error ?? "Send failed",
          created_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          delivered_at: null,
          read_at: null,
        },
      ]);
      setSending(false);
      return;
    }

    const newMessage: MessageRow = await response.json();
    setMessages((prev) => {
      if (prev.some((item) => item.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });
    setText("");
    setSending(false);
  };

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) =>
        (a.created_at ?? "").localeCompare(b.created_at ?? "")
      ),
    [messages]
  );

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-purple-200 bg-white">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {sortedMessages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">Belum ada pesan.</p>
        ) : (
          sortedMessages.map((message) => {
            const isMine = message.sender_id === profile?.id;
            return (
              <div
                key={`${message.id}-${message.created_at}`}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? "bg-purple-600 text-white"
                      : "bg-purple-50 text-slate-900"
                  }`}
                >
                  <p>{message.body ?? ""}</p>
                  <div className="mt-1 text-[10px] text-slate-300">
                    <span>{formatTimestamp(message.created_at)}</span>
                    <span className="ml-1 font-semibold text-purple-200">
                      • {message.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {sendDisabledReason ? (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          {sendDisabledReason}
        </div>
      ) : typingUsers.length > 0 ? (
        <div className="border-t border-purple-100 bg-purple-50 px-4 py-2 text-xs text-purple-700">
          Sedang mengetik...
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSend} className="border-t border-purple-200 p-3">
        <div className="flex items-center gap-3">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              signalTyping();
            }}
            placeholder="Tulis pesan..."
            disabled={!!sendDisabledReason}
            className="flex-1 rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={sending || !!sendDisabledReason}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sending ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </form>
    </div>
  );
}
