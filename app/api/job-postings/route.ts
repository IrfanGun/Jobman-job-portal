import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const VALID_STATUSES = ["OPEN", "CLOSED", "DRAFT"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { title, status = "OPEN", expires_at, recruiterId } = body as {
    title?: string;
    status?: string;
    expires_at?: string | null;
    recruiterId?: number;
  };

  if (!title || !recruiterId) {
    return NextResponse.json(
      { error: "title dan recruiterId wajib diisi." },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const { data: recruiter, error: recruiterError } = await supabaseAdmin
    .from("users")
    .select("id, role, company_id")
    .eq("id", recruiterId)
    .maybeSingle();

  if (recruiterError || !recruiter) {
    return NextResponse.json(
      { error: "Recruiter tidak ditemukan." },
      { status: 404 }
    );
  }

  if (recruiter.role !== "RECRUITER") {
    return NextResponse.json(
      { error: "Hanya recruiter yang dapat membuat job posting." },
      { status: 403 }
    );
  }

  if (!recruiter.company_id) {
    return NextResponse.json(
      { error: "Recruiter belum terhubung ke perusahaan." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("job_postings")
    .insert({
      title,
      status,
      posted_at: new Date().toISOString(),
      expires_at: expires_at ?? null,
      company_id: recruiter.company_id,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("job posting create failed", error);
    return NextResponse.json(
      { error: "Gagal membuat job posting." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
