import { supabase } from "@/integrations/supabase/client";

export type PaymentSettings = {
  id: string;
  esewa_number: string;
  khalti_number: string;
  esewa_qr_url: string | null;
  khalti_qr_url: string | null;
  terms: string;
  updated_at: string;
};

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const { data } = await supabase
    .from("payment_settings" as any)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as any) || null;
}

export async function updatePaymentSettings(id: string, patch: Partial<PaymentSettings>) {
  const { error } = await supabase
    .from("payment_settings" as any)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function uploadQr(file: File, kind: "esewa" | "khalti"): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("payment-qr").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("payment-qr").getPublicUrl(path);
  return data.publicUrl;
}
