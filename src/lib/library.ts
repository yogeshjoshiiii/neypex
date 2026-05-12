// Backend-backed purchase + analytics layer. Purchases are bound to (clerk_user_id, device_id).
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getDeviceLabel } from "./device";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export type PurchaseRow = {
  id: string;
  movie_id: string;
  email: string;
  clerk_user_id: string;
  device_id: string;
  device_label: string | null;
  price_paid: number;
  expected_price: number | null;
  coupon_code: string | null;
  tx_id: string | null;
  method: string | null;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  purchased_at: string;
};

export async function isOwned(movieId: string, clerkUserId: string | undefined): Promise<boolean> {
  if (!clerkUserId) return false;
  const did = getDeviceId();
  const since = new Date(Date.now() - NINETY_DAYS_MS).toISOString();
  const { data } = await supabase.from("purchases")
    .select("id")
    .eq("movie_id", movieId)
    .eq("clerk_user_id", clerkUserId)
    .eq("device_id", did)
    .eq("status", "approved")
    .gt("purchased_at", since)
    .limit(1);
  return !!data && data.length > 0;
}

export async function pendingPurchase(movieId: string, clerkUserId: string | undefined) {
  if (!clerkUserId) return null;
  const did = getDeviceId();
  const { data } = await supabase.from("purchases")
    .select("*")
    .eq("movie_id", movieId)
    .eq("clerk_user_id", clerkUserId)
    .eq("device_id", did)
    .in("status", ["pending", "rejected"])
    .order("purchased_at", { ascending: false })
    .limit(1);
  return (data?.[0] || null) as PurchaseRow | null;
}

export async function daysRemaining(movieId: string, clerkUserId: string | undefined): Promise<number> {
  if (!clerkUserId) return 0;
  const did = getDeviceId();
  const { data } = await supabase.from("purchases")
    .select("purchased_at")
    .eq("movie_id", movieId)
    .eq("clerk_user_id", clerkUserId)
    .eq("device_id", did)
    .order("purchased_at", { ascending: false })
    .limit(1);
  const row = data?.[0];
  if (!row) return 0;
  const left = NINETY_DAYS_MS - (Date.now() - new Date(row.purchased_at).getTime());
  return Math.max(0, Math.ceil(left / 86400000));
}

export async function purchase(opts: {
  movieId: string;
  clerkUserId: string;
  email: string;
  pricePaid: number;
  expectedPrice: number;
  couponCode?: string;
  txId?: string;
  method?: "esewa" | "khalti";
}) {
  const { data, error } = await supabase.from("purchases").insert({
    movie_id: opts.movieId,
    clerk_user_id: opts.clerkUserId,
    email: opts.email,
    device_id: getDeviceId(),
    device_label: getDeviceLabel(),
    price_paid: opts.pricePaid,
    expected_price: opts.expectedPrice,
    coupon_code: opts.couponCode || null,
    tx_id: opts.txId || null,
    method: opts.method || null,
    status: "pending",
  }).select().single();
  if (error) throw error;
  return data as PurchaseRow;
}

export async function reviewPurchase(id: string, action: "approve" | "reject", reviewer: string, reason?: string) {
  const patch: any = {
    status: action === "approve" ? "approved" : "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewer,
  };
  if (action === "approve") {
    // reset purchased_at so 90-day window starts from approval
    patch.purchased_at = new Date().toISOString();
    patch.reject_reason = null;
  } else {
    patch.reject_reason = reason || "Payment could not be verified.";
  }
  const { error } = await supabase.from("purchases").update(patch).eq("id", id);
  if (error) throw error;
}

export async function myPurchases(clerkUserId: string): Promise<PurchaseRow[]> {
  const did = getDeviceId();
  const { data } = await supabase.from("purchases")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .eq("device_id", did)
    .order("purchased_at", { ascending: false });
  return (data || []) as PurchaseRow[];
}

export async function allPurchases(): Promise<PurchaseRow[]> {
  const { data } = await supabase.from("purchases").select("*").order("purchased_at", { ascending: false });
  return (data || []) as PurchaseRow[];
}

export async function allUsers() {
  const list = await allPurchases();
  const map = new Map<string, { email: string; clerk_user_id: string; purchases: number; spent: number; lastSeen: number; devices: Set<string> }>();
  for (const p of list) {
    const cur = map.get(p.clerk_user_id) || { email: p.email, clerk_user_id: p.clerk_user_id, purchases: 0, spent: 0, lastSeen: 0, devices: new Set<string>() };
    cur.purchases += 1;
    cur.spent += p.price_paid;
    cur.lastSeen = Math.max(cur.lastSeen, new Date(p.purchased_at).getTime());
    cur.devices.add(p.device_id);
    map.set(p.clerk_user_id, cur);
  }
  return [...map.values()].map(v => ({ ...v, devices: v.devices.size }));
}

export async function logTeaserView(movieId: string, clerkUserId?: string) {
  await supabase.from("teaser_views").insert({ movie_id: movieId, clerk_user_id: clerkUserId || null });
}

export async function teaserViews(): Promise<Record<string, number>> {
  const { data } = await supabase.from("teaser_views").select("movie_id");
  const map: Record<string, number> = {};
  for (const r of data || []) map[r.movie_id] = (map[r.movie_id] || 0) + 1;
  return map;
}

// Watch progress: still local (per device) — small data, no need to round-trip.
const PROGRESS_KEY = "neypex_progress_v1";
export function getProgress(id: string): number {
  try { const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); return all[id] || 0; } catch { return 0; }
}
export function setProgress(id: string, seconds: number) {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    all[id] = seconds;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch { /* noop */ }
}
