import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { conversationId, senderId, text } = body as {
    conversationId?: number;
    senderId?: number;
    text?: string;
  };

  const trimmed = text?.trim() ?? "";
  if (!trimmed) {
    return NextResponse.json(
      { error: "Pesan tidak boleh kosong." },
      { status: 400 }
    );
  }
  if (!conversationId || !senderId) {
    return NextResponse.json(
      { error: "conversationId dan senderId wajib diisi." },
      { status: 400 }
    );
  }

  const { data: conversation, error: convoError } = await supabaseAdmin
    .from("conversations")
    .select(
      "*, job_postings:job_posting_id ( status ), job_applications:job_application_id ( status )"
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (convoError) {
    console.error("conversation fetch error", convoError);
    return NextResponse.json(
      { error: "Gagal memuat percakapan." },
      { status: 500 }
    );
  }

  if (!conversation) {
    return NextResponse.json(
      { error: "Percakapan tidak ditemukan." },
      { status: 404 }
    );
  }

  if (
    conversation.status === "JOB_CLOSED" ||
    conversation.status === "APPLICATION_EXPIRED" ||
    conversation.status === "BLOCKED"
  ) {
    return NextResponse.json(
      { error: "Percakapan tidak tersedia untuk pesan baru." },
      { status: 400 }
    );
  }

  const jobStatus = (conversation as any)?.job_postings?.status;
  if (jobStatus === "CLOSED") {
    return NextResponse.json(
      { error: "Percakapan tidak tersedia karena lowongan telah ditutup." },
      { status: 400 }
    );
  }

  const applicationStatus = (conversation as any)?.job_applications?.status;
  if (applicationStatus === "EXPIRED") {
    return NextResponse.json(
      { error: "Percakapan tidak tersedia karena lamaran telah kedaluwarsa." },
      { status: 400 }
    );
  }

  const counterpartId =
    senderId === conversation.job_seeker_id
      ? conversation.recruiter_id
      : conversation.job_seeker_id;

  const { data: block } = await supabaseAdmin
    .from("contact_blocks")
    .select("id")
    .eq("is_active", true)
    .or(
      `and(blocker_id.eq.${senderId},blocked_id.eq.${counterpartId}),and(blocker_id.eq.${counterpartId},blocked_id.eq.${senderId})`
    )
    .maybeSingle();

  if (block) {
    return NextResponse.json(
      { error: "Anda tidak dapat mengirim pesan ke kontak ini." },
      { status: 400 }
    );
  }

  const { data: message, error: insertError } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: trimmed,
      status: "SENT",
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !message) {
    console.error("message insert failed", insertError);
    return NextResponse.json(
      { error: "Pesan gagal dikirim. Coba lagi nanti." },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("conversations")
    .update({
      last_message_id: message.id,
      last_message_at: message.created_at ?? new Date().toISOString(),
    })
    .eq("id", conversationId);

  return NextResponse.json(message);
}
