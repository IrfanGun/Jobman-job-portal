"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, BriefcaseBusiness, MessageSquare, ClipboardList } from "lucide-react";

const navItems = [{ href: "/recruiter/jobs", label: "Lowongan", icon: "work" }];

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white p-6 shadow-sm lg:block">
        <div className="mb-8">
          <Link href="/recruiter/jobs" className="text-xl font-semibold text-slate-900">
            <span className="mr-2 inline-flex items-center text-purple-700">
              <Crown size={18} />
            </span>
            MyPortal Recruiter
          </Link>
          <p className="text-xs text-slate-500">Kelola lowongan dan chat</p>
        </div>
        <div className="space-y-1">
          <Link
            href="/recruiter/jobs"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === "/recruiter/jobs"
                ? "bg-purple-50 text-purple-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <BriefcaseBusiness size={16} />
            Lowongan
          </Link>
          <Link
            href="/recruiter/chat"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === "/recruiter/chat"
                ? "bg-purple-50 text-purple-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <MessageSquare size={16} />
            Chat
          </Link>
          <Link
            href="/recruiter/applications"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === "/recruiter/applications"
                ? "bg-purple-50 text-purple-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <ClipboardList size={16} />
            Applications
          </Link>
        </div>
      </aside>
      <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
