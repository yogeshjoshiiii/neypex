import { supabase } from "@/integrations/supabase/client";

export async function isAdminEmail(email: string | undefined | null): Promise<boolean> {
  if (!email) return false;
  const { data } = await supabase.from("admins").select("email").eq("email", email.toLowerCase()).maybeSingle();
  return !!data;
}
