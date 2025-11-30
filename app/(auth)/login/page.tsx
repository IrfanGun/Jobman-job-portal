"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabaseClient
      .from("users")
      .select("role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const destination =
      profile?.role === "RECRUITER" ? "/recruiter/jobs" : "/jobs";

    router.push(destination);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
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
            <h1 className="text-3xl font-semibold text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Glad to see you again. Login to your account below.
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
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="enter email..."
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-inner transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Processing..." : "Login"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-purple-700">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
