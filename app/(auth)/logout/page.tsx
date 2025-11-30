"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      await supabaseClient.auth.signOut();
      router.replace("/login");
    };
    void signOut();
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-slate-600">Signing out...</p>
    </div>
  );
}
