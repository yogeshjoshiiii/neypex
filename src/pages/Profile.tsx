import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SupportChat } from "@/components/SupportChat";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, User as UserIcon } from "lucide-react";
import { useUser, SignedIn, SignedOut, SignInButton, useClerk } from "@clerk/clerk-react";
import { getDeviceId, getDeviceLabel } from "@/lib/device";
import { myPurchases, type PurchaseRow } from "@/lib/library";
import { fetchMovies, type Movie } from "@/lib/movies";
import { npr } from "@/lib/format";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const deviceLabel = getDeviceLabel();
  const deviceId = getDeviceId();

  useEffect(() => {
    if (!user) return;
    fetchMovies().then(setMovies);
    myPurchases(user.id).then(setPurchases);
  }, [user?.id]);

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="container pt-28 md:pt-32 pb-10 max-w-md">
          <h1 className="font-display text-4xl mb-6">Sign in</h1>
          <div className="bg-card border border-border rounded-xl p-6 space-y-3 animate-fade-in">
            <p className="text-sm text-muted-foreground">Sign in with email or Google to track purchases. Each purchase is locked to this device.</p>
            <SignInButton mode="modal">
              <Button className="w-full gradient-primary text-primary-foreground">Continue</Button>
            </SignInButton>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress || "";
  const name = user.fullName || user.firstName || "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container pt-28 md:pt-32 pb-10 max-w-5xl">
        <h1 className="font-display text-4xl md:text-5xl mb-8">Profile</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <section className="md:col-span-2 bg-card border border-border rounded-xl p-6 animate-fade-in">
            <h2 className="font-semibold mb-4">Your details</h2>
            <div className="flex items-center gap-4 mb-6">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="" className="w-20 h-20 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-secondary grid place-items-center border border-border">
                  <UserIcon className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="font-medium">{name || "—"}</div>
                <div className="text-sm text-muted-foreground">{email}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Manage your account, password, or connected providers from the avatar menu in the top bar.</p>
          </section>

          <section className="bg-card border border-border rounded-xl p-6 animate-fade-in">
            <h2 className="font-semibold mb-2">Account</h2>
            <p className="text-sm text-muted-foreground mb-1">Signed in as</p>
            <p className="text-foreground mb-4 break-all">{email}</p>
            <div className="flex items-center gap-2 text-sm mb-4">
              {/Phone|Android/i.test(deviceLabel) ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span>{deviceLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Device ID: <span className="font-mono">{deviceId.slice(0, 14)}…</span></p>
            <Button variant="secondary" className="w-full" onClick={() => signOut()}>Sign out</Button>
          </section>
        </div>

        <section className="mt-6 bg-card border border-border rounded-xl p-6 animate-fade-in">
          <h2 className="font-semibold mb-4">My purchases</h2>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't bought any titles on this device yet. <Link className="text-primary" to="/">Browse →</Link></p>
          ) : (
            <ul className="divide-y divide-border">
              {purchases.map((p, i) => {
                const m = movies.find(x => x.id === p.movie_id);
                if (!m) return null;
                const ts = new Date(p.purchased_at).getTime();
                const daysLeft = Math.max(0, Math.ceil((90 * 86400000 - (Date.now() - ts)) / 86400000));
                return (
                  <li key={i} className="py-3 flex items-center gap-4">
                    <img src={m.poster} alt="" className="w-12 h-16 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/title/${m.id}`} className="font-medium hover:text-primary">{m.title}</Link>
                      <div className="text-xs text-muted-foreground">{new Date(p.purchased_at).toLocaleDateString()} • {p.method || "wallet"} {p.coupon_code && <>• <span className="text-primary">{p.coupon_code}</span></>}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-primary">{npr(p.price_paid)}</div>
                      <div className="text-xs text-muted-foreground">{daysLeft} days left</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-6">
          <SupportChat />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
