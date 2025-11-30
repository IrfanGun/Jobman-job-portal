"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type Props = {
  jobId: number;
  recruiterId: number | null;
};

type ApplicationResponse = {
  id: number;
  job_posting_id: number;
  status: string;
};

export default function JobActions({ jobId, recruiterId }: Props) {
  const router = useRouter();
  const { profile, loading: loadingUser } = useCurrentUser();
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!profile?.id) {
      setError("Silakan login terlebih dahulu.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobPostingId: jobId,
        jobSeekerId: profile.id,
      }),
    });

    const body: ApplicationResponse | { error?: string } | null =
      await response.json().catch(() => null);

    if (!response.ok) {
      setError((body as { error?: string })?.error ?? "Gagal melamar.");
      setSubmitting(false);
      return;
    }

    setApplicationId((body as ApplicationResponse)?.id ?? null);
    setSubmitting(false);
  };

  const handleChat = async () => {
    if (!profile?.id) {
      setError("Silakan login terlebih dahulu.");
      return;
    }
    if (!recruiterId) {
      setError("Recruiter tidak ditemukan untuk lowongan ini.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobPostingId: jobId,
        jobSeekerId: profile.id,
        recruiterId,
        jobApplicationId: applicationId,
      }),
    });

    const body: { id?: number; error?: string } | null = await response
      .json()
      .catch(() => null);

    if (!response.ok || !body?.id) {
      setError(body?.error ?? "Gagal membuka percakapan.");
      setSubmitting(false);
      return;
    }

    router.push(`/chat/${body.id}`);
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-700">
        {loadingUser
          ? "Memuat data user..."
          : profile
            ? `Masuk sebagai ${profile.full_name ?? profile.email} (${profile.role})`
            : "Belum login"}
      </p>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleApply}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Lamar Sekarang
        </button>
        <button
          onClick={handleChat}
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Chat Recruiter
        </button>
      </div>

      {applicationId ? (
        <p className="text-xs text-slate-600">
          Lamaran dibuat dengan ID #{applicationId}
        </p>
      ) : null}
    </div>
  );
}
