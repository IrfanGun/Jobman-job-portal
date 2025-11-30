"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

const navItems = [
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/chat", label: "Chat" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useCurrentUser();
  const isRecruiter = profile?.role === "RECRUITER";
  const isRecruiterRoute = pathname?.startsWith("/recruiter");

  // Avoid double sidebar when nested recruiter layout is used
  if (isRecruiterRoute) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white p-6 shadow-sm lg:block lg:flex lg:flex-col">
        <Link
          href={isRecruiter ? "/recruiter/jobs" : "/jobs"}
          className="text-xl font-semibold text-slate-900"
        >
          {isRecruiter ? "MyPortal Recruiter" : "MyPortal"}
        </Link>
        {isRecruiter ? (
          <p className="text-xs text-slate-500">Kelola lowongan dan chat</p>
        ) : null}
        <nav className="mt-6 space-y-1 text-sm font-medium text-slate-700">
          {isRecruiter ? (
            <Link
              href="/recruiter/jobs"
              className={`block rounded-lg px-3 py-2 ${
                pathname === "/recruiter/jobs"
                  ? "bg-slate-900 text-white"
                  : "hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Recruiter
            </Link>
          ) : (
            <>
              <Link
                href="/jobs"
                className={`block rounded-lg px-3 py-2 ${
                  pathname === "/jobs"
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Jobs
              </Link>
              <Link
                href="/applications"
                className={`block rounded-lg px-3 py-2 ${
                  pathname === "/applications"
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Applications
              </Link>
              <Link
                href="/chat"
                className={`block rounded-lg px-3 py-2 ${
                  pathname === "/chat"
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Chat
              </Link>
            </>
          )}
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-4 text-xs">
          <Link
            href="/logout"
            className="font-semibold text-purple-700 hover:underline"
          >
            Logout
          </Link>
        </div>
      </aside>
      <main className="flex-1 px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
