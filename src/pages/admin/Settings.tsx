import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, QrCode, Save, UserPlus, Trash2, ShieldCheck, Check } from "lucide-react";
import { getPaymentSettings, updatePaymentSettings, uploadQr, type PaymentSettings } from "@/lib/paymentSettings";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type SubAdmin = { id: string; email: string; created_at: string };
type Title = { id: string; title: string; type: "movie" | "series" };
type Assignment = { id: string; sub_admin_email: string; title_type: string; title_id: string };

const Settings = () => {
  const [s, setS] = useState<PaymentSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"esewa" | "khalti" | null>(null);
  const esewaRef = useRef<HTMLInputElement>(null);
  const khaltiRef = useRef<HTMLInputElement>(null);

  // Co-admins state
  const [coAdmins, setCoAdmins] = useState<SubAdmin[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [addingCo, setAddingCo] = useState(false);
  const [titles, setTitles] = useState<Title[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const loadCo = async () => {
    const [{ data: subs }, { data: assigns }, { data: mv }, { data: sr }] = await Promise.all([
      supabase.from("sub_admins").select("*").order("created_at", { ascending: false }),
      supabase.from("sub_admin_titles").select("*"),
      supabase.from("movies").select("id,title").order("title"),
      supabase.from("series").select("id,title").order("title"),
    ]);
    setCoAdmins((subs as any) || []);
    setAssignments((assigns as any) || []);
    setTitles([
      ...((mv as any[]) || []).map(m => ({ ...m, type: "movie" as const })),
      ...((sr as any[]) || []).map(s => ({ ...s, type: "series" as const })),
    ]);
  };

  useEffect(() => { getPaymentSettings().then(setS); loadCo(); }, []);

  const addCoAdmin = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) { toast({ title: "Enter a valid email", variant: "destructive" }); return; }
    if (coAdmins.some(c => c.email.toLowerCase() === email)) { toast({ title: "Already a co-admin" }); return; }
    setAddingCo(true);
    const { error } = await supabase.from("sub_admins").insert({ email });
    setAddingCo(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setNewEmail("");
    toast({ title: "Co-admin added", description: email });
    loadCo();
  };

  const removeCoAdmin = async (email: string, id: string) => {
    if (!confirm(`Remove ${email} as co-admin?`)) return;
    await supabase.from("sub_admin_titles").delete().eq("sub_admin_email", email);
    await supabase.from("sub_admins").delete().eq("id", id);
    toast({ title: "Removed", description: email });
    loadCo();
  };

  const toggleAssignment = async (email: string, t: Title) => {
    const existing = assignments.find(a => a.sub_admin_email === email && a.title_id === t.id && a.title_type === t.type);
    if (existing) {
      await supabase.from("sub_admin_titles").delete().eq("id", existing.id);
    } else {
      await supabase.from("sub_admin_titles").insert({ sub_admin_email: email, title_id: t.id, title_type: t.type });
    }
    loadCo();
  };

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

      {/* Co-Admins */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-display text-xl">Co-Admins</h2>
              <p className="text-xs text-muted-foreground">Grant limited admin access and assign which titles they can manage.</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              placeholder="email@example.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCoAdmin()}
              className="sm:w-64"
            />
            <Button onClick={addCoAdmin} disabled={addingCo} className="gradient-primary text-primary-foreground shrink-0">
              {addingCo ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add
            </Button>
          </div>
        </div>

        {coAdmins.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">No co-admins yet.</p>
        ) : (
          <div className="space-y-2">
            {coAdmins.map(c => {
              const mine = assignments.filter(a => a.sub_admin_email === c.email);
              const isOpen = openFor === c.email;
              return (
                <div key={c.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-mono text-sm truncate">{c.email}</div>
                      <div className="text-[11px] text-muted-foreground">{mine.length} title{mine.length === 1 ? "" : "s"} assigned</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setOpenFor(isOpen ? null : c.email)}>
                        {isOpen ? "Close" : "Assign titles"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeCoAdmin(c.email, c.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border bg-secondary/30 overflow-hidden">
                        <div className="p-3 space-y-3">
                          <Input placeholder="Search titles..." value={filter} onChange={e => setFilter(e.target.value)} />
                          <div className="max-h-72 overflow-y-auto grid sm:grid-cols-2 gap-1.5">
                            {titles
                              .filter(t => t.title.toLowerCase().includes(filter.toLowerCase()))
                              .map(t => {
                                const checked = !!mine.find(a => a.title_id === t.id && a.title_type === t.type);
                                return (
                                  <button
                                    key={`${t.type}-${t.id}`}
                                    onClick={() => toggleAssignment(c.email, t)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-smooth border ${checked ? "bg-primary/15 border-primary/40 text-foreground" : "bg-card border-border hover:bg-secondary"}`}
                                  >
                                    <span className={`w-4 h-4 rounded grid place-items-center shrink-0 ${checked ? "bg-primary text-primary-foreground" : "border border-border"}`}>
                                      {checked && <Check className="w-3 h-3" />}
                                    </span>
                                    <span className="truncate flex-1">{t.title}</span>
                                    <span className="text-[10px] uppercase text-muted-foreground">{t.type}</span>
                                  </button>
                                );
                              })}
                            {titles.length === 0 && <p className="text-xs text-muted-foreground col-span-full text-center py-4">No titles in catalog yet.</p>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
