import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import ApplyButton from "./apply-button";

type JobRow = {
  id: number;
  title: string;
  status: string;
  posted_at: string | null;
  company?: { name?: string | null } | null;
};

async function getOpenJobs(): Promise<JobRow[]> {
  const { data, error } = await supabaseAdmin
    .from("job_postings")
    .select("id, title, status, posted_at, company:company_id(name)")
    .eq("status", "OPEN")
    .order("posted_at", { ascending: false });

  if (error) {
    console.error("Failed to load jobs", error);
    return [];
  }

  return (
    data?.map((job) => ({
      ...job,
      company: (job as JobRow).company,
    })) ?? []
  );
}

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default async function JobsPage() {
  const jobs = await getOpenJobs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Lowongan</h1>
        <p className="text-sm text-slate-600">
          Daftar lowongan yang sedang open.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {jobs.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            Belum ada lowongan tersedia.
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {job.title}
                </h2>
                <p className="text-sm text-slate-600">
                  {job.company?.name ?? "Perusahaan"}
                </p>
                <p className="text-xs text-slate-500">
                  Diposting: {formatDate(job.posted_at)}
                </p>
              </div>
              <Link
                href={`/jobs/${job.id}`}
                className="mt-4 inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Detail
              </Link>
              <div className="mt-2">
                <ApplyButton jobId={job.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
