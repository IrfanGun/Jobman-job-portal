"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

type JobPosting = {
  id: number;
  title: string;
  status: string;
  posted_at: string | null;
  expires_at: string | null;
  company?: { name?: string | null } | null;
  applications_count?: number;
};

type Candidate = {
  id: number; // job_application id
  job_seeker_id: number;
  status: string;
  created_at: string | null;
  user?: { full_name?: string | null; email?: string | null } | null;
};

const STATUSES = ["DRAFT", "OPEN", "CLOSED"] as const;
const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
};
const STATUS_BADGES: Record<(typeof STATUSES)[number], string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-amber-100 text-amber-700",
  DRAFT: "bg-slate-100 text-slate-700",
};

const ChatRoom = dynamic(() => import("../../chat/[conversationId]/chat-room"), {
  ssr: false,
});

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function RecruiterJobsPage() {
  const { profile, loading: loadingUser } = useCurrentUser();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("OPEN");
  const [expires, setExpires] = useState("");
  const [description, setDescription] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const router = useRouter();
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const isRecruiter = profile?.role === "RECRUITER";

  useEffect(() => {
    const load = async () => {
      if (!profile?.company_id) return;
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabaseClient
        .from("job_postings")
        .select(
          "id, title, status, posted_at, expires_at, company:company_id ( name ), job_applications(count)"
        )
        .eq("company_id", profile.company_id)
        .order("posted_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setJobs(
        (data as JobPosting[] | null | undefined)?.map((job) => {
          const numericId = Number((job as any).id);
          const countField = (job as any)?.job_applications;
          const applications_count = Array.isArray(countField)
            ? countField[0]?.count ?? 0
            : (countField as any)?.count ?? 0;
          return {
            ...job,
            id: Number.isNaN(numericId) ? (job as any).id : numericId,
            company: job.company ?? null,
            applications_count,
          };
        }) ?? []
      );
      setLoading(false);
    };

    if (profile?.role === "RECRUITER") {
      void load();
    }
  }, [profile?.company_id, profile?.role]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile?.id) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/job-postings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        status,
        expires_at: expires || null,
        recruiterId: profile.id,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Create job failed", payload);
      setError(payload?.error ?? "Gagal membuat job posting.");
      setSubmitting(false);
      return;
    }

    const created = payload as JobPosting;
    setTitle("");
    setDescription("");
    setStatus("OPEN");
    setExpires("");
    setSubmitting(false);
    setShowModal(false);
    setJobs((prev) => [created, ...prev]);
  };

  const handleUpdate = async (
    jobId: number,
    updates: Partial<Pick<JobPosting, "title" | "status" | "expires_at">>
  ) => {
    if (!profile?.id) return;
    const numericId = Number(jobId);
    if (Number.isNaN(numericId)) {
      setError("ID tidak valid.");
      return;
    }

    const response = await fetch(`/api/job-postings/${numericId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: numericId,
        ...updates,
        recruiterId: profile.id,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Update job failed", { jobId: numericId, payload });
      setError(payload?.error ?? "Gagal mengubah job posting.");
      return;
    }

    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, ...payload } : job))
    );
    console.log("Updated job", jobId, updates);
  };

  const handleDelete = async (jobId: number) => {
    if (!profile?.id) return;
    const numericId = Number(jobId);
    if (Number.isNaN(numericId)) {
      setError("ID tidak valid.");
      return;
    }
    const response = await fetch(`/api/job-postings/${numericId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiterId: profile.id }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Delete job failed", { jobId: numericId, payload });
      setError(payload?.error ?? "Gagal menghapus job posting.");
      return;
    }

    setJobs((prev) => prev.filter((job) => job.id !== jobId));
    console.log("Deleted job", jobId);
  };

  const recruiterInfo = useMemo(() => {
    if (loadingUser) return "Memuat data pengguna...";
    if (!profile) return "Silakan login.";
    if (!isRecruiter) return "Hanya recruiter yang dapat mengelola job posting.";
    if (!profile.company_id)
      return "Profil recruiter belum terhubung ke perusahaan.";
    return null;
  }, [isRecruiter, loadingUser, profile]);

  const groupedJobs = useMemo(() => {
    const groups: Record<(typeof STATUSES)[number], JobPosting[]> = {
      DRAFT: [],
      OPEN: [],
      CLOSED: [],
    };
    jobs.forEach((job) => {
      if (job.status === "DRAFT") groups.DRAFT.push(job);
      else if (job.status === "CLOSED") groups.CLOSED.push(job);
      else groups.OPEN.push(job);
    });
    return groups;
  }, [jobs]);

  const handleDrop = async (
    column: (typeof STATUSES)[number],
    jobId: number | null
  ) => {
    if (!jobId) return;
    const job = jobs.find((item) => item.id === jobId);
    if (!job || job.status === column) return;

    setJobs((prev) =>
      prev.map((item) =>
        item.id === job.id ? { ...item, status: column } : item
      )
    );
    console.log("Dropped job", job.id, "to", column);
    await handleUpdate(job.id, { status: column });
  };

  const handleEditTitle = (job: JobPosting) => {
    const nextTitle = window.prompt("Edit judul lowongan", job.title);
    if (!nextTitle || nextTitle.trim() === "" || nextTitle === job.title) return;
    setJobs((prev) =>
      prev.map((item) =>
        item.id === job.id ? { ...item, title: nextTitle } : item
      )
    );
    void handleUpdate(job.id, { title: nextTitle });
  };

  const openCandidates = async (job: JobPosting) => {
    setSelectedJob(job);
    setSidebarOpen(true);
    setCandidates([]);
    setCandidatesError(null);
    setCandidatesLoading(true);

    const { data, error: fetchError } = await supabaseClient
      .from("job_applications")
      .select(
        "id, job_seeker_id, status, created_at, users:job_seeker_id ( full_name, email )"
      )
      .eq("job_posting_id", job.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setCandidatesError(fetchError.message);
      setCandidatesLoading(false);
      return;
    }

    setCandidates(
      (data as Candidate[] | null | undefined)?.map((row) => ({
        ...row,
        user: (row as Candidate).user ?? (row as any)?.users ?? null,
      })) ?? []
    );
    setCandidatesLoading(false);
  };

  const openChatWithCandidate = async (cand: Candidate) => {
    if (!profile?.id || !selectedJob) return;
    setCandidatesError(null);
    setActiveConversation(null);
    setChatLoading(true);

    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobPostingId: selectedJob.id,
        jobSeekerId: cand.job_seeker_id,
        recruiterId: profile.id,
        jobApplicationId: cand.id,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.id) {
      setCandidatesError(payload?.error ?? "Gagal membuka chat kandidat.");
      setChatLoading(false);
      return;
    }

    setActiveConversation(payload.id);
    setChatLoading(false);
  };

  const renderAvatar = (name?: string | null) => {
    const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
        {initial}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Recruiter Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Board untuk membuat dan memindahkan job posting.
          </p>
        </div>
        {isRecruiter && profile?.company_id ? (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-inner transition hover:bg-purple-700"
            style={{ cursor: "pointer" }}
          >
            + Tambah Lowongan
          </button>
        ) : null}
      </div>

      {recruiterInfo ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          {recruiterInfo}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isRecruiter && profile?.company_id ? (
        <>
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
              Memuat...
            </div>
          ) : null}

          {!loading && jobs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
              Belum ada job posting. Klik "Tambah Lowongan" untuk memulai.
            </div>
          ) : null}

          {!loading && jobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {STATUSES.map((column) => (
                <div
                  key={column}
                  className="rounded-xl border border-slate-200 bg-white/80 p-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const idString = e.dataTransfer.getData("text/plain");
                    const parsed = Number(idString);
                    const jobId = Number.isNaN(parsed) ? draggingId : parsed;
                    void handleDrop(column, jobId ?? null);
                    setDraggingId(null);
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          column === "OPEN"
                            ? "bg-emerald-500"
                            : column === "CLOSED"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`}
                      />
                      {STATUS_LABELS[column]}
                      <span className="text-xs font-normal text-slate-500">
                        {groupedJobs[column].length} jobs
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {groupedJobs[column].map((job) => (
                      <div
                        key={job.id}
                        onClick={() => openCandidates(job)}
                        draggable
                        onDragStart={(e) => {
                          setDraggingId(job.id);
                          e.dataTransfer.setData("text/plain", String(job.id));
                        }}
                        className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">
                              {job.title}
                            </p>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_BADGES[job.status as (typeof STATUSES)[number]]}`}
                            >
                              {STATUS_LABELS[job.status as (typeof STATUSES)[number]]}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Posted: {formatDate(job.posted_at)} • Expires:{" "}
                            {job.expires_at ? formatDate(job.expires_at) : "-"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Applicants: {job.applications_count ?? 0}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTitle(job);
                            }}
                            className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            ✎ Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {showModal ? (
            <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lowongan Baru
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Tambah Lowongan
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreate} className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">
                      Judul
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: UI/UX Designer"
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-800">
                      Job Description (opsional)
                    </label>
                    <div className="rounded-xl border border-slate-200">
                      <div className="flex gap-2 border-b border-slate-200 px-3 py-2 text-sm">
                        <button
                          type="button"
                          onClick={() => document.execCommand("bold")}
                          className="rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand("italic")}
                          className="rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => document.execCommand("insertUnorderedList")}
                          className="rounded-md px-2 py-1 text-slate-700 hover:bg-slate-100"
                        >
                          • List
                        </button>
                      </div>
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) =>
                          setDescription((e.target as HTMLDivElement).innerHTML)
                        }
                        className="min-h-[120px] rounded-b-xl px-3 py-2 text-sm focus:outline-none"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">
                        Status
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setModalStatusOpen((prev) => !prev)}
                          className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                        >
                          <span>{STATUS_LABELS[status]}</span>
                          <span className="text-slate-500">▾</span>
                        </button>
                        {modalStatusOpen ? (
                          <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white">
                            {STATUSES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setStatus(s);
                                  setModalStatusOpen(false);
                                }}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-purple-50"
                              >
                                <span>{STATUS_LABELS[s]}</span>
                                {s === status ? (
                                  <span className="text-purple-600">●</span>
                                ) : (
                                  <span className="text-transparent">●</span>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">
                        Tanggal Berakhir (opsional)
                      </label>
                      <input
                        type="date"
                        value={expires}
                        onChange={(e) => setExpires(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-inner transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ cursor: submitting ? "not-allowed" : "pointer" }}
                    >
                      {submitting ? "Menyimpan..." : "Tambah"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div
        className={`fixed right-0 top-0 z-30 h-full w-full max-w-sm transform bg-white shadow-xl transition-transform duration-300 ${
          sidebarOpen && selectedJob ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedJob ? (
          <div className="flex h-full flex-col border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Kandidat
                </p>
                <h4 className="text-base font-semibold text-slate-900">
                  {selectedJob.title}
                </h4>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-2 text-[11px] text-slate-500">
              Status: {STATUS_LABELS[selectedJob.status as (typeof STATUSES)[number]]}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
            {chatLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              </div>
            ) : activeConversation ? (
              <div className="flex h-full flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Chat
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedJob?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveConversation(null);
                      setChatLoading(false);
                    }}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    ← Back
                  </button>
                </div>
                <ChatRoom
                  conversationId={activeConversation}
                  sendDisabledReason={
                    selectedJob?.status === "CLOSED"
                      ? "Percakapan tidak tersedia karena lowongan telah ditutup."
                      : null
                  }
                />
              </div>
            ) : candidatesLoading ? (
                <p className="text-sm text-slate-600">Memuat kandidat...</p>
              ) : candidatesError ? (
                <p className="text-sm text-red-600">{candidatesError}</p>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-slate-600">Belum ada pelamar.</p>
              ) : (
                <div className="space-y-2">
                  {candidates.map((cand) => (
                    <button
                      key={cand.id}
                      onClick={() => openChatWithCandidate(cand)}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-slate-300 hover:bg-white"
                    >
                      {renderAvatar(cand.user?.full_name)}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {cand.user?.full_name ?? "Pelamar"}
                        </p>
                        <p className="text-xs text-slate-600">
                          {cand.user?.email ?? "Email tidak tersedia"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Status: {cand.status} •{" "}
                          {cand.created_at ? formatDate(cand.created_at) : "-"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
