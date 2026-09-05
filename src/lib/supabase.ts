import { createClient } from "@supabase/supabase-js";
import requireEnv from '@/lib/env';

export const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function verifyConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
