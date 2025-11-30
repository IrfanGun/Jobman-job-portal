import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import JobActions from "./job-actions";

type JobDetail = {
  id: number;
  title: string;
  status: string;
  posted_at: string | null;
  expires_at: string | null;
  company: { name?: string | null } | null;
  company_id: number;
};

async function getJobDetail(id: number): Promise<JobDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("job_postings")
    .select(
      "id, title, status, posted_at, expires_at, company_id, company:company_id(name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch job detail", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    company: (data as JobDetail).company ?? null,
  };
}

async function getRecruiterId(companyId: number) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("company_id", companyId)
    .eq("role", "RECRUITER")
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const jobId = Number(params.id);
  if (Number.isNaN(jobId)) notFound();

  const job = await getJobDetail(jobId);
  if (!job) notFound();

  const recruiterId = await getRecruiterId(job.company_id);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {job.title}
            </h1>
            <p className="text-sm text-slate-600">
              {job.company?.name ?? "Perusahaan"}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {job.status}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm text-slate-600 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span>Diposting</span>
            <span className="font-medium">{formatDate(job.posted_at)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span>Berakhir</span>
            <span className="font-medium">{formatDate(job.expires_at)}</span>
          </div>
        </dl>

        <div className="mt-6">
          <JobActions jobId={job.id} recruiterId={recruiterId} />
        </div>
      </div>
    </div>
  );
}
