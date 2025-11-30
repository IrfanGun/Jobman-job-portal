"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";

const ROLES = ["JOB_SEEKER", "RECRUITER"] as const;

type PasswordStrength = {
  label: "Low" | "Medium" | "Strong";
  color: string;
  width: string;
};

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;

  if (score >= 3) {
    return { label: "Strong", color: "bg-green-500", width: "w-full" };
  }
  if (score === 2) {
    return { label: "Medium", color: "bg-amber-400", width: "w-2/3" };
  }
  return { label: "Low", color: "bg-red-500", width: "w-1/3" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("JOB_SEEKER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { error: authError } = await supabaseClient.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { full_name: fullName, role } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email: normalizedEmail,
        role,
        is_active: true,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body?.error ?? "Gagal menyimpan profil user.");
      setLoading(false);
      return;
    }

    router.push("/login");
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/60">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="flex flex-col justify-center bg-gradient-to-br from-purple-50 via-white to-slate-50 p-10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-700">
              <div className="grid grid-cols-2 gap-1">
                <span className="h-4 w-4 rounded-full bg-purple-700" />
                <span className="h-4 w-4 rounded-full bg-purple-500" />
                <span className="h-4 w-4 rounded-full bg-purple-500" />
                <span className="h-4 w-4 rounded-full bg-purple-700" />
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900">Sign up</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter your details below to create your account.
            </p>
          </div>

          <div className="p-10">
            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-800"
                  htmlFor="full_name"
                >
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="enter..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="example@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-800"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="enter password..."
                />
                {password.length > 0 ? (
                  <div className="space-y-1">
                    <div className="h-1 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-1 rounded-full ${getPasswordStrength(password).color} ${getPasswordStrength(password).width} transition-all`}
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-600">
                      Strength: {getPasswordStrength(password).label}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="role">
                  Role
                </label>
                <div className="relative" ref={roleDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setRoleOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  >
                    <span>{role}</span>
                    <span className="text-slate-500">▾</span>
                  </button>
                  {roleOpen ? (
                    <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-md">
                      {ROLES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setRole(option);
                            setRoleOpen(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-purple-50"
                        >
                          <span>{option}</span>
                          {option === role ? (
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

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-inner transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-purple-700">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
