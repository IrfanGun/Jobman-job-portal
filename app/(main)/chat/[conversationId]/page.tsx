import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import ChatRoom from "./chat-room";

type ConversationDetail = {
  id: number;
  job_seeker_id: number;
  recruiter_id: number;
  status: string;
  job_postings?: { title?: string | null; status?: string | null } | null;
};

async function getConversation(id: number): Promise<ConversationDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select(
      "id, job_seeker_id, recruiter_id, status, job_postings:job_posting_id ( title, status )"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch conversation", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    job_postings: (data as ConversationDetail).job_postings ?? null,
  };
}

export default async function ConversationPage({
  params = { conversationId: "" },
}: {
  params?: { conversationId?: string };
}) {
  const rawId = typeof params.conversationId === "string" ? params.conversationId : "";
  const id = Number.parseInt(rawId, 10);

  if (!rawId || Number.isNaN(id)) {
    redirect("/chat");
  }

  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const sendDisabledReason =
    conversation.job_postings?.status === "CLOSED" ||
    conversation.status === "JOB_CLOSED"
      ? "Percakapan tidak tersedia karena lowongan telah ditutup."
      : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Percakapan</p>
            <h1 className="text-lg font-semibold text-slate-900">
              {conversation.job_postings?.title ?? "Chat"}
            </h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {conversation.status}
          </span>
        </div>
      </div>

      <ChatRoom
        conversationId={conversation.id}
        sendDisabledReason={sendDisabledReason}
      />
    </div>
  );
}
