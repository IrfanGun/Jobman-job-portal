"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type ApplicationRow = {
  id: number;
  status: string;
  created_at: string | null;
  job_posting_id: number;
  job_postings?: {
    title?: string | null;
    status?: string | null;
    company?: { name?: string | null } | null;
  } | null;
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusColor: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  REVIEWING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
  OFFERED: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-slate-100 text-slate-700",
};

export default function ApplicationsPage() {
  const { profile, loading: loadingUser } = useCurrentUser();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [conversationMap, setConversationMap] = useState<
    Record<number, number>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;
      setLoading(true);
      setError(null);

      const { data, error: appsError } = await supabaseClient
        .from("job_applications")
        .select(
          "id, status, created_at, job_posting_id, job_postings:job_posting_id ( title, status, company:company_id ( name ) )"
        )
        .eq("job_seeker_id", profile.id)
        .order("created_at", { ascending: false });

      if (appsError) {
        setError(appsError.message);
        setLoading(false);
        return;
      }

      setApplications(
        (data as ApplicationRow[] | null | undefined)?.map((app) => ({
          ...app,
          job_postings: app.job_postings ?? null,
        })) ?? []
      );

      const ids = (data ?? []).map((item) => item.id).filter(Boolean);
      if (ids.length > 0) {
        const { data: conversations } = await supabaseClient
          .from("conversations")
          .select("id, job_application_id")
          .in("job_application_id", ids);

        const map: Record<number, number> = {};
        conversations?.forEach((conv) => {
          if (conv.job_application_id) {
            map[conv.job_application_id] = conv.id;
          }
        });
        setConversationMap(map);
      } else {
        setConversationMap({});
      }

      setLoading(false);
    };

    void load();
  }, [profile?.id]);

  const content = useMemo(() => {
    if (loadingUser || loading) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Memuat data...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          Silakan login untuk melihat status lamaran.
        </div>
      );
    }

    if (applications.length === 0) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          Belum ada lamaran.
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {applications.map((app) => (
          <div
            key={app.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  {app.job_postings?.title ?? "Job"}
                </h3>
                <p className="text-sm text-slate-600">
                  {app.job_postings?.company?.name ?? "Perusahaan"}
                </p>
                <p className="text-xs text-slate-500">
                  Dibuat: {formatDate(app.created_at)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[app.status] ?? "bg-slate-100 text-slate-700"}`}
              >
                {app.status}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <div>
                <p>
                  Lowongan:{" "}
                  <span className="font-semibold">
                    {app.job_postings?.title ?? "Job"}
                  </span>
                </p>
              </div>
              {conversationMap[app.id] ? (
                <Link
                  href={`/chat/${conversationMap[app.id]}`}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
                >
                  Buka Chat
                </Link>
              ) : (
                <span className="text-xs text-slate-500">Belum ada chat</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }, [applications, conversationMap, error, loading, loadingUser, profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Status Lamaran
        </h1>
        <p className="text-sm text-slate-600">
          Pantau proses lamaran kamu dalam satu tempat.
        </p>
      </div>

      {content}
    </div>
  );
}
