import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reviewPurchase } from "@/lib/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Loader2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { npr } from "@/lib/format";
import { useUser } from "@clerk/clerk-react";
import { toast } from "@/hooks/use-toast";

type Row = {
  id: string;
  movie_id: string;
  email: string;
  clerk_user_id: string;
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

const Payments = () => {
  const { user } = useUser();
  const [rows, setRows] = useState<Row[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("purchases").select("*").order("purchased_at", { ascending: false }).limit(500);
    const list = (data || []) as Row[];
    setRows(list);
    const ids = [...new Set(list.map(r => r.movie_id))];
    if (ids.length) {
      const { data: m } = await supabase.from("movies").select("id,title").in("id", ids);
      const map: Record<string, string> = {};
      for (const x of m || []) map[(x as any).id] = (x as any).title;
      setTitles(map);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const reviewer = user?.primaryEmailAddress?.emailAddress || "admin";

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      await reviewPurchase(id, action, reviewer, action === "reject" ? (reasons[id] || "Could not verify transaction.") : undefined);
      toast({ title: action === "approve" ? "Payment approved" : "Payment rejected", description: action === "approve" ? "User unlocked instantly." : "User notified." });
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const filtered = rows.filter(r => r.status === tab);
  const counts = {
    pending: rows.filter(r => r.status === "pending").length,
    approved: rows.filter(r => r.status === "approved").length,
    rejected: rows.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Payments</h1>
          <p className="text-sm text-muted-foreground">Verify eSewa / Khalti transactions and unlock content for buyers.</p>
        </div>
        <Button variant="secondary" onClick={load}><RefreshCw className="w-4 h-4" /> Refresh</Button>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["pending", "approved", "rejected"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition-smooth ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t} <span className="ml-1 text-xs opacity-60">({counts[t]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">No {tab} payments.</div>
      )}

      <div className="grid gap-3">
        {filtered.map(r => {
          const expected = r.expected_price ?? r.price_paid;
          const mismatch = r.price_paid !== expected;
          return (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold">{titles[r.movie_id] || "Unknown title"}</div>
                  <div className="text-xs text-muted-foreground">{r.email} · {r.device_label || "device"}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(r.purchased_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-display ${mismatch ? "text-destructive" : "text-primary"}`}>{npr(r.price_paid)}</div>
                  {mismatch && <div className="text-[11px] text-destructive flex items-center gap-1 justify-end"><AlertTriangle className="w-3 h-3" /> Expected {npr(expected)}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div><span className="text-muted-foreground">Method</span><div className="font-medium capitalize">{r.method || "—"}</div></div>
                <div><span className="text-muted-foreground">TX ID</span><div className="font-mono break-all">{r.tx_id || "—"}</div></div>
                <div><span className="text-muted-foreground">Coupon</span><div className="font-mono">{r.coupon_code || "—"}</div></div>
                <div><span className="text-muted-foreground">Status</span><div className="capitalize">{r.status}</div></div>
              </div>

              {r.status === "rejected" && r.reject_reason && (
                <div className="text-xs p-2 rounded bg-destructive/10 border border-destructive/30 text-destructive">{r.reject_reason}</div>
              )}

              {r.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                  <Input
                    value={reasons[r.id] || ""}
                    onChange={e => setReasons(s => ({ ...s, [r.id]: e.target.value }))}
                    placeholder="Reason (only if rejecting)"
                    className="flex-1 h-9 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => act(r.id, "reject")} disabled={busy === r.id}>
                      <X className="w-4 h-4" /> Reject
                    </Button>
                    <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => act(r.id, "approve")} disabled={busy === r.id}>
                      {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve & Unlock
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Payments;
