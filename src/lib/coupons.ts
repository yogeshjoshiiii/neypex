import { supabase } from "@/integrations/supabase/client";

export type Coupon = {
  id?: string;
  code: string;
  movieId: string | "all"; // "all" => null in db
  percent: number;
  expiresAt?: number | null;
  createdAt?: number;
};

export async function listCoupons(): Promise<Coupon[]> {
  const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  return (data || []).map(r => ({
    id: r.id,
    code: r.code,
    movieId: r.movie_id || "all",
    percent: r.percent,
    expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : null,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function addCoupon(c: Coupon) {
  await supabase.from("coupons").insert({
    code: c.code.toUpperCase(),
    percent: c.percent,
    movie_id: c.movieId === "all" ? null : c.movieId,
    expires_at: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
  });
}

export async function removeCoupon(code: string) {
  await supabase.from("coupons").delete().eq("code", code.toUpperCase());
}

export async function findValidCoupon(code: string, movieId: string): Promise<Coupon | null> {
  const { data } = await supabase.from("coupons").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
  if (!data) return null;
  if (data.expires_at && Date.now() > new Date(data.expires_at).getTime()) return null;
  if (data.movie_id && data.movie_id !== movieId) return null;
  return {
    id: data.id, code: data.code, percent: data.percent,
    movieId: data.movie_id || "all",
    expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : null,
  };
}
