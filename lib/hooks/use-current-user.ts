"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export function useCurrentUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      const { data: authData, error: authError } =
        await supabaseClient.auth.getUser();

      if (!active) return;

      if (authError || !authData.user) {
        setProfile(null);
        setAuthUserId(null);
        setError(authError?.message ?? null);
        setLoading(false);
        return;
      }

      setAuthUserId(authData.user.id);
      const email = authData.user.email;
      if (!email) {
        setError("Email tidak tersedia pada sesi.");
        setLoading(false);
        return;
      }

      const { data: userRow, error: userError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!active) return;

      if (userError) {
        setError(userError.message);
        setProfile(null);
      } else {
        setProfile(userRow ?? null);
        setError(null);
      }
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return { profile, authUserId, loading, error };
}
