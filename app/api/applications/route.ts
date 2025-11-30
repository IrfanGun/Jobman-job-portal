import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { jobPostingId, jobSeekerId } = body as {
    jobPostingId?: number;
    jobSeekerId?: number;
  };

  if (!jobPostingId || !jobSeekerId) {
    return NextResponse.json(
      { error: "jobPostingId dan jobSeekerId wajib diisi." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("job_applications")
    .select("id, status")
    .eq("job_posting_id", jobPostingId)
    .eq("job_seeker_id", jobSeekerId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
  }

  const { data, error } = await supabaseAdmin
    .from("job_applications")
    .insert({
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId,
      status: "SUBMITTED",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.error("application insert failed", error);
    return NextResponse.json(
      { error: "Gagal membuat lamaran." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
