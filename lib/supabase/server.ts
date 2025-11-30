import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

// Admin client for server-only usage (route handlers / server actions).
// Never import this in client components.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
