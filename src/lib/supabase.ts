import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] ?? "";
export const SUPABASE_ANON_KEY = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function verifyConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
