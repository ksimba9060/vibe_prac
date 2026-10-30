import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

// Only the public browser key is exposed by Vite; member access is enforced by RLS.
export const supabase =
  url && publishableKey ? createClient(url, publishableKey) : null;
