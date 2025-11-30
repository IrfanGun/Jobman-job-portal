import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { full_name, email, role, is_active = true } = body as {
    full_name?: string;
    email?: string;
    role?: string;
    is_active?: boolean;
  };

  if (!email || !role) {
    return NextResponse.json(
      { error: "Email dan role wajib diisi." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      full_name: full_name ?? null,
      email,
      role,
      is_active,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("user insert failed", error);
    return NextResponse.json(
      { error: "Gagal menyimpan profil user." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
