"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type Props = {
  jobId: number;
};

export default function ApplyButton({ jobId }: Props) {
  const { profile, loading: loadingUser } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (loadingUser) return;
    if (!profile?.id) {
      setError("Silakan login sebagai pencari kerja.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobPostingId: jobId,
        jobSeekerId: profile.id,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload?.error ?? "Gagal melamar.");
      setLoading(false);
      return;
    }

    setMessage("Lamaran terkirim.");
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleApply}
        disabled={loading || loadingUser}
        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Mengirim..." : "Lamar Cepat"}
      </button>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : message ? (
        <p className="text-xs text-emerald-600">{message}</p>
      ) : null}
    </div>
  );
}
