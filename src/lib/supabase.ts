import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://kbzxizcismxewequcrkt.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtienhpemNpc214ZXdlcXVjcmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTA5MzAsImV4cCI6MjEwMjU2NjkzMH0.157W4soYmLXZgE_EFJWMhbkonibzJ0k_6_pPVLN8j8g";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function verifyConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
