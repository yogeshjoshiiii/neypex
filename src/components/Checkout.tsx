import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, Wallet, Tag, Check, Loader2, AlertCircle, MessageCircle, QrCode, ShieldCheck } from "lucide-react";
import { npr } from "@/lib/format";
import { findValidCoupon } from "@/lib/coupons";
import { purchase } from "@/lib/library";
import { useUser } from "@clerk/clerk-react";
import type { Movie } from "@/lib/movies";
import { toast } from "@/hooks/use-toast";
import { getPaymentSettings, type PaymentSettings } from "@/lib/paymentSettings";
import { motion, AnimatePresence } from "framer-motion";

const SUPPORT_WHATSAPP = "9762662816";

export const Checkout = ({ movie, open, onOpenChange, onPending, onNeedSignIn }: {
  movie: Movie;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onPending: (purchaseId: string) => void;
  onNeedSignIn: () => void;
}) => {
  const { user } = useUser();
  const [method, setMethod] = useState<"esewa" | "khalti">("esewa");
  const [couponCode, setCouponCode] = useState("");
  const [appliedPct, setAppliedPct] = useState(0);
  const [txId, setTxId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  // Auto-fill paid amount with the final price (after coupon) — keeps it in sync
  useEffect(() => { setPaidAmount(String(Math.max(0, Math.round(movie.price * (1 - appliedPct / 100))))); }, [movie.price, appliedPct]);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);

  useEffect(() => { if (open) getPaymentSettings().then(setSettings); }, [open]);

  const final = Math.max(0, Math.round(movie.price * (1 - appliedPct / 100)));
  const number = method === "esewa" ? settings?.esewa_number : settings?.khalti_number;
  const qr = method === "esewa" ? settings?.esewa_qr_url : settings?.khalti_qr_url;

  const apply = async () => {
    const c = await findValidCoupon(couponCode, movie.id);
    if (!c) { setAppliedPct(0); toast({ title: "Invalid coupon", description: "Code not valid for this title.", variant: "destructive" }); return; }
    setAppliedPct(c.percent);
    toast({ title: "Coupon applied", description: `${c.percent}% off` });
  };

  const submit = async () => {
    if (!user) { onOpenChange(false); onNeedSignIn(); return; }
    if (!txId.trim()) { toast({ title: "Enter transaction ID", description: "Paste the ID from your wallet receipt.", variant: "destructive" }); return; }
    if (!paidAmount || isNaN(Number(paidAmount))) { toast({ title: "Enter amount paid", description: "Type the exact NPR amount you sent.", variant: "destructive" }); return; }
    if (!agreed) { toast({ title: "Please accept the terms", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const row = await purchase({
        movieId: movie.id,
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        pricePaid: Math.round(Number(paidAmount)),
        expectedPrice: final,
        couponCode: appliedPct ? couponCode.toUpperCase() : undefined,
        txId: txId.trim(),
        method,
      });
      onOpenChange(false);
      onPending(row.id);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message || "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Checkout</DialogTitle>
          <DialogDescription>Buy <span className="text-foreground font-medium">{movie.title}</span> — 90 days access on this device.</DialogDescription>
        </DialogHeader>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {([
              { k: "esewa", label: "eSewa", color: "from-green-500 to-emerald-600" },
              { k: "khalti", label: "Khalti", color: "from-purple-500 to-fuchsia-600" },
            ] as const).map(p => (
              <button
                key={p.k}
                onClick={() => { setMethod(p.k); setShowQr(false); }}
                className={`p-4 rounded-xl border transition-smooth text-left ${method === p.k ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"}`}
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center mb-2`}>
                  {p.k === "esewa" ? <Wallet className="w-5 h-5 text-white" /> : <Smartphone className="w-5 h-5 text-white" />}
                </div>
                <div className="font-semibold">{p.label}</div>
                <div className="text-xs text-muted-foreground">Send to merchant</div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border p-4 bg-card space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm text-muted-foreground">Send {method === "esewa" ? "eSewa" : "Khalti"} payment to</div>
                <div className="font-mono text-lg font-semibold tracking-wide">{number || "—"}</div>
              </div>
              {qr && (
                <Button size="sm" variant="secondary" onClick={() => setShowQr(s => !s)}>
                  <QrCode className="w-4 h-4" /> {showQr ? "Hide" : "QR"}
                </Button>
              )}
            </div>

            <AnimatePresence>
              {showQr && qr && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-lg p-3 grid place-items-center">
                    <img src={qr} alt={`${method} QR`} className="w-48 h-48 object-contain" />
                  </div>
                  <div className="text-[11px] text-muted-foreground text-center mt-2">Scan in your {method === "esewa" ? "eSewa" : "Khalti"} app</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-display text-2xl text-primary">{npr(final)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code (optional)" className="pl-9" />
            </div>
            <Button variant="secondary" onClick={apply}>Apply</Button>
          </div>
          {appliedPct > 0 && <div className="text-xs text-primary flex items-center gap-1"><Check className="w-3 h-3" /> {appliedPct}% off applied</div>}

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Transaction ID (from wallet receipt)</label>
            <Input value={txId} onChange={e => setTxId(e.target.value)} placeholder="e.g. 0001ABCD" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Amount (auto-set from movie price)</label>
            <Input type="number" value={paidAmount} readOnly className="bg-muted/40 cursor-not-allowed" />
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-[11px] leading-relaxed">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1.5">
                <strong className="text-foreground block">Terms &amp; Conditions</strong>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Your payment goes <span className="text-foreground">directly to the content creator</span>.</li>
                  <li>Access is granted for <span className="text-foreground">90 days</span> from approval, on this device only.</li>
                  <li>Once a purchase is approved, it is <span className="text-foreground">non-refundable</span>.</li>
                  <li>Verification is manual and usually completes within minutes — content unlocks automatically.</li>
                  <li>If you sent the wrong amount, contact{" "}
                    <a href={`https://wa.me/977${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer" className="text-primary underline">WhatsApp +977 {SUPPORT_WHATSAPP}</a>.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-primary" />
            <span>I have sent the payment and agree to the terms above.</span>
          </label>

          <Button onClick={submit} disabled={busy} className="w-full gradient-primary text-primary-foreground h-11">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Submit for Verification</>}
          </Button>

          <a href={`https://wa.me/977${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hi, I need help with payment for "${movie.title}".`)}`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary transition-smooth">
            <MessageCircle className="w-3.5 h-3.5" /> Need help? Chat on WhatsApp
          </a>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-primary" /> Secure manual verification • TLS encrypted
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
