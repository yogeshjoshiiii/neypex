import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Shield, BarChart3, Film, MessageSquare, Tag, Users as UsersIcon, LogOut, Menu, X, Loader2, Wallet, Settings as SettingsIcon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useClerk, SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { to: "/admin", label: "Analytics", icon: BarChart3, end: true, key: "analytics" },
  { to: "/admin/payments", label: "Payments", icon: Wallet, key: "payments" },
  { to: "/admin/content", label: "Content", icon: Film, key: "content" },
  { to: "/admin/coupons", label: "Coupons", icon: Tag, key: "coupons" },
  { to: "/admin/users", label: "Users", icon: UsersIcon, key: "users" },
  { to: "/admin/support", label: "Support", icon: MessageSquare, key: "support" },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon, key: "settings" },
] as const;

const Gate = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setAllowed(false); return; }
    isAdminEmail(email).then(setAllowed);
  }, [isLoaded, isSignedIn, email]);

  if (!isLoaded || allowed === null) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (allowed) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[radial-gradient(ellipse_at_top,_hsl(0_84%_30%/0.25),_transparent_60%)]">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-card animate-scale-in text-center">
        <div className="w-14 h-14 rounded-xl gradient-primary grid place-items-center glow mx-auto mb-4"><Shield className="w-7 h-7 text-primary-foreground" /></div>
        <h1 className="font-display text-2xl mb-1">NEYPEX Admin</h1>
        <p className="text-sm text-muted-foreground mb-6">Restricted access. Sign in with an admin account.</p>
        <SignedOut>
          <SignInButton mode="modal">
            <Button className="w-full gradient-primary text-primary-foreground">Sign in</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <p className="text-sm text-destructive">Signed in as <span className="font-mono">{email}</span> — not an admin.</p>
        </SignedIn>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [supportCount, setSupportCount] = useState(0);
  const [seenSupportAt, setSeenSupportAt] = useState<number>(() => Number(localStorage.getItem("admin_seen_support") || 0));

  const totalAlerts = pendingPayments + supportCount;

  const refreshCounts = async () => {
    const [{ count: pc }, { data: sm }] = await Promise.all([
      supabase.from("purchases").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("support_messages").select("id, created_at, sender").eq("sender", "user").order("created_at", { ascending: false }).limit(100),
    ]);
    setPendingPayments(pc || 0);
    const newer = (sm || []).filter((m: any) => new Date(m.created_at).getTime() > seenSupportAt).length;
    setSupportCount(newer);
  };

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    refreshCounts();
    const ch = supabase.channel("admin-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "purchases" }, (p: any) => {
        if (p.new?.status === "pending") {
          toast({ title: "💸 New payment request", description: `${p.new?.email || "A user"} submitted a payment.` });
        }
        refreshCounts();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "purchases" }, refreshCounts)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (p: any) => {
        if (p.new?.sender === "user") {
          toast({ title: "💬 New support message", description: p.new?.body?.slice(0, 80) || "" });
        }
        refreshCounts();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); document.documentElement.style.scrollBehavior = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markSupportSeen = () => {
    const now = Date.now();
    localStorage.setItem("admin_seen_support", String(now));
    setSeenSupportAt(now);
    setSupportCount(0);
  };

  const badge = (key: string) => {
    const n = key === "payments" ? pendingPayments : key === "support" ? supportCount : 0;
    if (!n) return null;
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground"
      >
        {n > 99 ? "99+" : n}
      </motion.span>
    );
  };

  return (
    <Gate>
      <div className="min-h-screen bg-background text-foreground flex">
        <aside className={`fixed md:static z-40 inset-y-0 left-0 w-64 bg-card border-r border-border transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <div className="h-16 px-5 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary grid place-items-center"><Shield className="w-4 h-4 text-primary-foreground" /></div>
              <span className="font-display tracking-wider text-lg">NEYPEX <span className="text-primary">ADMIN</span></span>
            </div>
            <button className="md:hidden p-1.5 rounded-md hover:bg-secondary" onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
          </div>
          <nav className="p-3 space-y-1">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={(n as any).end}
                onClick={() => { setOpen(false); if (n.key === "support") markSupportSeen(); }}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-smooth ${isActive ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                <n.icon className="w-4 h-4" /> <span>{n.label}</span> {badge(n.key)}
              </NavLink>
            ))}
          </nav>
          <div className="absolute bottom-0 inset-x-0 p-3 border-t border-border">
            <button onClick={() => { signOut(); navigate("/"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-secondary transition-smooth">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 md:ml-0">
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 rounded-md hover:bg-secondary" onClick={() => setOpen(true)}><Menu className="w-5 h-5" /></button>
              <h2 className="font-display text-xl md:text-2xl tracking-wide">Dashboard</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className={`w-5 h-5 ${totalAlerts ? "text-primary" : "text-muted-foreground"}`} />
                <AnimatePresence>
                  {totalAlerts > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 text-[9px] font-bold grid place-items-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      {totalAlerts > 9 ? "9+" : totalAlerts}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">Logged in as <span className="text-foreground font-medium">{user?.primaryEmailAddress?.emailAddress}</span></div>
            </div>
          </header>
          <motion.main
            key={loc.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 md:p-8"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </Gate>
  );
};

export default AdminLayout;
