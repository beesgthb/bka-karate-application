import { createClient } from "@supabase/supabase-js";

// Safe to expose in frontend code — these are public, RLS-protected keys,
// NOT the service-role secret key.
const SUPABASE_URL = "https://qukenziqodkdhnsjylit.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hc0PeRO_bCJ5Lvf_9_pwOg_5n9JczFV";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// URL of the admin-manage-user Edge Function (creates/resets passwords for
// Coach / Senior Student / Student accounts). Only callable by a signed-in
// Admin — the function itself re-checks the caller's role server-side.
export const ADMIN_MANAGE_USER_URL =
  "https://qukenziqodkdhnsjylit.supabase.co/functions/v1/admin-manage-user";
