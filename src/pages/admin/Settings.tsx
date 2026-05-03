import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, QrCode, Save } from "lucide-react";
import { getPaymentSettings, updatePaymentSettings, uploadQr, type PaymentSettings } from "@/lib/paymentSettings";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const Settings = () => {
  const [s, setS] = useState<PaymentSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"esewa" | "khalti" | null>(null);
  const esewaRef = useRef<HTMLInputElement>(null);
  const khaltiRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getPaymentSettings().then(setS); }, []);

  if (!s) return <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const save = async () => {
    setBusy(true);
    try {
      await updatePaymentSettings(s.id, {
        esewa_number: s.esewa_number,
        khalti_number: s.khalti_number,
        esewa_qr_url: s.esewa_qr_url,
        khalti_qr_url: s.khalti_qr_url,
        terms: s.terms,
      });
      toast({ title: "Saved", description: "Payment settings updated." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const onUpload = async (kind: "esewa" | "khalti", file: File) => {
    setUploading(kind);
    try {
      const url = await uploadQr(file, kind);
      const next = { ...s, [kind === "esewa" ? "esewa_qr_url" : "khalti_qr_url"]: url } as PaymentSettings;
      setS(next);
      await updatePaymentSettings(s.id, { [kind === "esewa" ? "esewa_qr_url" : "khalti_qr_url"]: url } as any);
      toast({ title: "QR uploaded", description: `${kind} QR code is live.` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally { setUploading(null); }
  };

  const card = (kind: "esewa" | "khalti") => {
    const url = kind === "esewa" ? s.esewa_qr_url : s.khalti_qr_url;
    const num = kind === "esewa" ? s.esewa_number : s.khalti_number;
    const ref = kind === "esewa" ? esewaRef : khaltiRef;
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold capitalize">{kind} payment</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${url ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
            {url ? "QR live" : "no QR"}
          </span>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{kind} number</label>
          <Input value={num} onChange={e => setS({ ...s, [kind === "esewa" ? "esewa_number" : "khalti_number"]: e.target.value } as any)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">QR code image</label>
          <div className="flex items-start gap-3">
            <div className="w-32 h-32 rounded-lg bg-secondary border border-border grid place-items-center overflow-hidden shrink-0">
              {url ? <img src={url} alt={`${kind} QR`} className="w-full h-full object-contain bg-white" /> : <QrCode className="w-8 h-8 text-muted-foreground" />}
            </div>
            <div className="flex-1 space-y-2">
              <input ref={ref} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(kind, f); }} />
              <Button variant="secondary" size="sm" onClick={() => ref.current?.click()} disabled={uploading === kind}>
                {uploading === kind ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {url ? "Replace QR" : "Upload QR"}
              </Button>
              <p className="text-[11px] text-muted-foreground">PNG/JPG. Square works best. Shown to buyers in checkout.</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl">Payment Settings</h1>
        <p className="text-sm text-muted-foreground">Numbers and QR codes shown to buyers at checkout.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {card("esewa")}
        {card("khalti")}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <label className="text-sm font-semibold">Public terms text</label>
        <textarea
          value={s.terms}
          onChange={e => setS({ ...s, terms: e.target.value })}
          rows={4}
          className="w-full bg-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground">Reserved for future display. Checkout shows the standard terms (90 days, non-refundable, creator payout).</p>
      </div>

      <Button onClick={save} disabled={busy} className="gradient-primary text-primary-foreground">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
      </Button>
    </div>
  );
};

export default Settings;
