import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { jobPostingId, jobSeekerId, recruiterId, jobApplicationId } = body as {
    jobPostingId?: number;
    jobSeekerId?: number;
    recruiterId?: number;
    jobApplicationId?: number | null;
  };

  if (!jobPostingId || !jobSeekerId || !recruiterId) {
    return NextResponse.json(
      { error: "jobPostingId, jobSeekerId, dan recruiterId wajib diisi." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("job_posting_id", jobPostingId)
    .eq("job_seeker_id", jobSeekerId)
    .eq("recruiter_id", recruiterId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(existing);
  }

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      job_posting_id: jobPostingId,
      job_seeker_id: jobSeekerId,
      recruiter_id: recruiterId,
      job_application_id: jobApplicationId ?? null,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error || !data) {
    console.error("conversation create failed", error);
    return NextResponse.json(
      { error: "Gagal membuat percakapan." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
