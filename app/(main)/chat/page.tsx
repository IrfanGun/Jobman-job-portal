"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { supabaseClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type ConversationRow = {
  id: number;
  job_seeker_id: number;
  recruiter_id: number;
  status: string;
  last_message_at: string | null;
  job_postings?: { title?: string | null; status?: string | null; company?: { name?: string | null } | null } | null;
  job_seeker?: { full_name?: string | null } | null;
  recruiter?: { full_name?: string | null } | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ChatRoom = dynamic(() => import("./[conversationId]/chat-room"), {
  ssr: false,
});

export default function ChatListPage() {
  const { profile, loading: loadingUser } = useCurrentUser();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;
      setLoading(true);
      setError(null);

      const field = profile.role === "RECRUITER" ? "recruiter_id" : "job_seeker_id";
      const { data, error: convError } = await supabaseClient
        .from("conversations")
        .select(
          "id, job_seeker_id, recruiter_id, status, last_message_at, job_posting_id, job_postings:job_posting_id ( title, status, company:company_id ( name ) ), job_seeker:job_seeker_id ( full_name ), recruiter:recruiter_id ( full_name )"
        )
        .eq(field, profile.id)
        .order("last_message_at", { ascending: false });

      if (convError) {
        setError(convError.message);
        setLoading(false);
        return;
      }

      setConversations(
        (data as ConversationRow[] | null | undefined)?.map((conv) => ({
          ...conv,
          job_postings: conv.job_postings ?? null,
          job_seeker: conv.job_seeker ?? null,
          recruiter: conv.recruiter ?? null,
        })) ?? []
      );
      setLoading(false);
    };

    void load();
  }, [profile?.id, profile?.role]);

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const sendDisabledReason =
    selectedConversation?.job_postings?.status === "CLOSED" ||
    selectedConversation?.status === "JOB_CLOSED"
      ? "Percakapan tidak tersedia karena lowongan telah ditutup."
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Percakapan</h1>
          <p className="text-xs text-slate-600">
            Chat antara job seeker dan recruiter.
          </p>
        </div>

        {loadingUser || loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Memuat percakapan...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!profile && !loadingUser ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Silakan login untuk melihat percakapan.
          </div>
        ) : null}

        {profile && !loading && conversations.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Belum ada percakapan.
          </div>
        ) : null}

        <div className="space-y-2">
          {conversations.map((conversation) => {
            const counterpart =
              profile?.role === "RECRUITER"
                ? conversation.job_seeker?.full_name ?? "Job seeker"
                : conversation.recruiter?.full_name ?? "Recruiter";
            const active = conversation.id === selectedId;
            return (
              <button
                key={conversation.id}
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  active
                    ? "border-slate-300 bg-slate-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{counterpart}</p>
                    <p className="text-xs text-slate-600">
                      {conversation.job_postings?.title ?? "Job"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {conversation.job_postings?.company?.name ?? "Perusahaan"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-700">
                    {conversation.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Update terakhir: {formatDate(conversation.last_message_at)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[70vh] rounded-xl border border-slate-200 bg-white p-2">
        {selectedConversation ? (
          <ChatRoom
            key={selectedConversation.id}
            conversationId={selectedConversation.id}
            sendDisabledReason={sendDisabledReason}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-600">
            Pilih percakapan untuk membuka chat.
          </div>
        )}
      </div>
    </div>
  );
}
