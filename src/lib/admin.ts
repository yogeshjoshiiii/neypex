import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "admin" | "co" | null;

export async function isAdminEmail(email: string | undefined | null): Promise<boolean> {
  const r = await getAdminRole(email);
  return r === "admin" || r === "co";
}

export async function getAdminRole(email: string | undefined | null): Promise<AdminRole> {
  if (!email) return null;
  const e = email.toLowerCase();
  const [a, s] = await Promise.all([
    supabase.from("admins").select("email").eq("email", e).maybeSingle(),
    supabase.from("sub_admins").select("email").eq("email", e).maybeSingle(),
  ]);
  if (a.data) return "admin";
  if (s.data) return "co";
  return null;
}
