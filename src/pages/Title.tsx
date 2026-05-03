import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Play, Lock, Check, Loader2, MessageCircle, X } from "lucide-react";
import { fetchMovie, SAMPLE_VIDEO, TEASER_VIDEO, type Movie } from "@/lib/movies";
import { isOwned, daysRemaining, logTeaserView, pendingPurchase } from "@/lib/library";
import { VideoPlayer } from "@/components/VideoPlayer";
import { toast } from "@/hooks/use-toast";
import { Checkout } from "@/components/Checkout";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { npr } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { SafeImage } from "@/components/SafeImage";

const SUPPORT_WHATSAPP = "9762662816";

const Title = () => {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { user, isSignedIn } = useUser();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [owned, setOwned] = useState(false);
  const [days, setDays] = useState(0);
  const [playing, setPlaying] = useState<"teaser" | "full" | null>(params.get("teaser") === "1" ? "teaser" : null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [signInTrigger, setSignInTrigger] = useState(0);
  const [pending, setPending] = useState<{ id: string; status: "pending" | "rejected"; reason?: string | null } | null>(null);

  useEffect(() => { fetchMovie(id).then(setMovie); }, [id]);

  const refreshState = async () => {
    if (!movie) return;
    const o = await isOwned(movie.id, user?.id);
    setOwned(o);
    if (o) { setDays(await daysRemaining(movie.id, user?.id)); setPending(null); return; }
    const p = await pendingPurchase(movie.id, user?.id);
    if (p) setPending({ id: p.id, status: p.status as any, reason: p.reject_reason });
    else setPending(null);
  };

  useEffect(() => { refreshState(); }, [movie, user?.id]);

  // Realtime: listen for status changes on this user's purchases
  useEffect(() => {
    if (!user?.id || !movie) return;
    const ch = supabase.channel(`purchase-${user.id}-${movie.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "purchases", filter: `clerk_user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new?.movie_id !== movie.id) return;
          if (payload.new?.status === "approved") {
            toast({ title: "Payment verified!", description: `${movie.title} is unlocked for 90 days.` });
          } else if (payload.new?.status === "rejected") {
            toast({ title: "Payment could not be verified", description: payload.new?.reject_reason || "Please contact support.", variant: "destructive" });
          }
          refreshState();
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, movie?.id]);

  if (!movie) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-32 text-center">
        <h1 className="text-3xl font-bold mb-2">Loading…</h1>
        <Link to="/" className="text-primary">← Back home</Link>
      </main>
      <Footer />
    </div>
  );

  const openBuy = () => {
    if (!isSignedIn) { setSignInTrigger(t => t + 1); return; }
    setCheckoutOpen(true);
  };

  const onTeaser = () => { logTeaserView(movie.id, user?.id); setPlaying("teaser"); };

  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      <Navbar />

      {playing && (
        <div className="fixed inset-0 z-[90] bg-black animate-fade-in">
          <VideoPlayer
            src={playing === "teaser" ? (movie.teaserUrl || TEASER_VIDEO) : (movie.videoUrl || SAMPLE_VIDEO)}
            movieId={movie.id + (playing === "teaser" ? "-teaser" : "")}
            title={`${movie.title}${playing === "teaser" ? " — Teaser" : ""}`}
            onClose={() => setPlaying(null)}
            resume={playing === "full"}
          />
        </div>
      )}

      {/* Pending verification overlay */}
      {pending?.status === "pending" && (
        <div className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-sm grid place-items-center px-4 animate-fade-in">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-elegant">
            <div className="w-16 h-16 rounded-full gradient-primary grid place-items-center mx-auto mb-5 glow">
              <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
            </div>
            <h2 className="font-display text-2xl mb-2">Verifying your payment…</h2>
            <p className="text-sm text-muted-foreground mb-5">We're confirming your transaction. <span className="text-foreground">{movie.title}</span> will unlock automatically — usually within a few minutes.</p>
            <div className="text-xs text-muted-foreground mb-5 p-3 rounded-lg bg-secondary/40 border border-border">
              Sent the wrong amount by mistake? Message us on WhatsApp and we'll fix it.
            </div>
            <a href={`https://wa.me/977${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hi, I just paid for "${movie.title}" — payment ID ${pending.id}`)}`} target="_blank" rel="noreferrer">
              <Button className="w-full gradient-primary text-primary-foreground"><MessageCircle className="w-4 h-4" /> Contact support</Button>
            </a>
            <button onClick={() => setPending(null)} className="mt-3 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <X className="w-3 h-3" /> Continue browsing
            </button>
          </div>
        </div>
      )}

      <main className="pt-16 md:pt-20">
        <section className="relative h-[60vh] md:h-[70vh] min-h-[420px] overflow-hidden">
          <SafeImage src={movie.backdrop || movie.poster} alt={movie.title} size={1920} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
          <div className="container relative h-full flex items-end pb-10">
            <div className="max-w-2xl animate-slide-up">
              <h1 className="font-display text-5xl md:text-7xl mb-3">{movie.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="text-primary font-semibold">{movie.rating}</span>
                <span>{movie.year}</span><span>{movie.duration}</span><span>{movie.genre.join(" • ")}</span>
              </div>
              <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-xl">{movie.description}</p>

              <div className="flex flex-wrap items-center gap-3">
                {owned ? (
                  <Button size="lg" className="gradient-primary text-primary-foreground shadow-elegant" onClick={() => setPlaying("full")}>
                    <Play className="w-5 h-5 fill-current" /> Resume Watching
                  </Button>
                ) : pending?.status === "pending" ? (
                  <Button size="lg" disabled className="bg-secondary text-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" /> Verifying payment…
                  </Button>
                ) : (
                  <Button size="lg" className="gradient-primary text-primary-foreground shadow-elegant glow" onClick={openBuy}>
                    <Lock className="w-5 h-5" /> Buy {npr(movie.price)} • 90 days
                  </Button>
                )}
                <Button size="lg" variant="secondary" onClick={onTeaser}>
                  <Play className="w-5 h-5 fill-current" /> Watch Teaser
                </Button>
                {owned && (
                  <span className="inline-flex items-center gap-1 text-sm text-primary"><Check className="w-4 h-4" /> Owned • {days} days left</span>
                )}
              </div>

              {pending?.status === "rejected" && (
                <div className="mt-4 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-sm max-w-xl">
                  <strong className="text-destructive">Payment rejected:</strong> {pending.reason || "Could not verify."} Please try again or contact support.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="container py-10 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">About this {movie.type}</h2>
            <p className="text-muted-foreground leading-relaxed">{movie.description} An immersive experience from NEYPEX Originals — buy once, watch on this device for 90 days. After that, repurchase to continue.</p>
          </div>
          <aside className="bg-card border border-border rounded-xl p-5 h-fit">
            <h3 className="font-semibold mb-3">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Watch the teaser free</li>
              <li>• Buy once for {npr(movie.price)}</li>
              <li>• Pay via eSewa or Khalti — verified manually in minutes</li>
              <li>• Stream for 90 days on <em>this</em> device</li>
              <li>• Payment goes directly to the content creator</li>
            </ul>
          </aside>
        </section>
      </main>

      <Checkout
        movie={movie}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onPending={(pid) => { setPending({ id: pid, status: "pending" }); toast({ title: "Submitted for verification", description: "We'll unlock the movie as soon as your payment is confirmed." }); }}
        onNeedSignIn={() => setSignInTrigger(t => t + 1)}
      />

      {signInTrigger > 0 && (
        <SignInButton key={signInTrigger} mode="modal">
          <button ref={(b) => b?.click()} className="hidden" />
        </SignInButton>
      )}

      <Footer />
    </div>
  );
};

export default Title;
