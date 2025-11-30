import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const VALID_STATUSES = ["OPEN", "CLOSED", "DRAFT"];

async function validateRecruiter(recruiterId?: number) {
  if (!recruiterId) {
    return { error: "recruiterId wajib diisi." };
  }

  const { data: recruiter, error } = await supabaseAdmin
    .from("users")
    .select("id, role, company_id")
    .eq("id", recruiterId)
    .maybeSingle();

  if (error || !recruiter) {
    return { error: "Recruiter tidak ditemukan." };
  }

  if (recruiter.role !== "RECRUITER") {
    return { error: "Hanya recruiter yang dapat mengubah job posting." };
  }

  if (!recruiter.company_id) {
    return { error: "Recruiter belum terhubung ke perusahaan." };
  }

  return { recruiter };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const idFromParams = Number(params.id);
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const idFromBody = typeof (body as any)?.id === "number" ? (body as any).id : Number((body as any)?.id);
  const id = Number.isNaN(idFromParams) ? idFromBody : idFromParams;

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const { title, status, expires_at, recruiterId } = body as {
    title?: string;
    status?: string;
    expires_at?: string | null;
    recruiterId?: number;
  };

  const { recruiter, error } = await validateRecruiter(recruiterId);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const { data: posting } = await supabaseAdmin
    .from("job_postings")
    .select("id, company_id")
    .eq("id", id)
    .maybeSingle();

  if (!posting) {
    return NextResponse.json(
      { error: "Job posting tidak ditemukan." },
      { status: 404 }
    );
  }

  if (posting.company_id !== recruiter!.company_id) {
    return NextResponse.json(
      { error: "Tidak memiliki akses ke job posting ini." },
      { status: 403 }
    );
  }

  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (status !== undefined) updates.status = status;
  if (expires_at !== undefined) updates.expires_at = expires_at;

  const { data, error: updateError } = await supabaseAdmin
    .from("job_postings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !data) {
    console.error("job posting update failed", updateError);
    return NextResponse.json(
      { error: "Gagal mengubah job posting." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const idFromParams = Number(params.id);
  const body = await req.json().catch(() => null);
  const recruiterId = body?.recruiterId as number | undefined;
  const idFromBody =
    typeof (body as any)?.id === "number" ? (body as any).id : Number((body as any)?.id);
  const id = Number.isNaN(idFromParams) ? idFromBody : idFromParams;
  console.log("DELETE job-postings id param:", params.id, "body id:", idFromBody);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const { recruiter, error } = await validateRecruiter(recruiterId);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const { data: posting } = await supabaseAdmin
    .from("job_postings")
    .select("id, company_id")
    .eq("id", id)
    .maybeSingle();

  if (!posting) {
    return NextResponse.json(
      { error: "Job posting tidak ditemukan." },
      { status: 404 }
    );
  }

  if (posting.company_id !== recruiter!.company_id) {
    return NextResponse.json(
      { error: "Tidak memiliki akses ke job posting ini." },
      { status: 403 }
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("job_postings")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("job posting delete failed", deleteError);
    return NextResponse.json(
      { error: "Gagal menghapus job posting." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
