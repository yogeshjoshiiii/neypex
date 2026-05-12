import { useEffect, useState } from "react";
import { fetchMovies, type Movie } from "@/lib/movies";
import { allPurchases, teaserViews, type PurchaseRow } from "@/lib/library";
import { Eye, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { npr } from "@/lib/format";

const Card = ({ label, value, Icon, accent }: { label: string; value: string; Icon: any; accent?: string }) => (
  <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-smooth animate-fade-in">
    <div className="flex items-center justify-between text-muted-foreground text-sm">
      <span>{label}</span><Icon className="w-4 h-4" />
    </div>
    <div className="mt-2 flex items-end justify-between">
      <span className="text-3xl font-bold">{value}</span>
      {accent && <span className="text-primary text-sm">{accent}</span>}
    </div>
  </div>
);

const Analytics = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [views, setViews] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchMovies().then(setMovies);
    allPurchases().then(setPurchases);
    teaserViews().then(setViews);
  }, []);

  const totalViews = Object.values(views).reduce((s, n) => s + n, 0);
  const revenue = purchases.reduce((s, p) => s + p.price_paid, 0);
  const userCount = new Set(purchases.map(p => p.clerk_user_id)).size;

  const ranked = movies.map(m => ({
    movie: m,
    views: views[m.id] || 0,
    buys: purchases.filter(p => p.movie_id === m.id).length,
    revenue: purchases.filter(p => p.movie_id === m.id).reduce((s, p) => s + p.price_paid, 0),
  })).sort((a, b) => (b.views + b.buys * 5) - (a.views + a.buys * 5)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Teaser views" value={totalViews.toLocaleString("en-IN")} Icon={Eye} accent={totalViews ? "live" : "—"} />
        <Card label="Purchases" value={purchases.length.toLocaleString("en-IN")} Icon={ShoppingCart} />
        <Card label="Revenue" value={npr(revenue)} Icon={TrendingUp} />
        <Card label="Users" value={userCount.toLocaleString("en-IN")} Icon={Users} />
      </div>

      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
        <h3 className="font-semibold mb-4">Top titles</h3>
        <ul className="divide-y divide-border">
          {ranked.map((r, i) => (
            <li key={r.movie.id} className="py-3 flex items-center gap-4">
              <span className="text-muted-foreground w-5">{i + 1}</span>
              <img src={r.movie.poster} alt="" className="w-10 h-14 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.movie.title}</div>
                <div className="text-xs text-muted-foreground">{r.movie.type}</div>
              </div>
              <span className="text-sm text-muted-foreground hidden sm:inline">{r.views} views</span>
              <span className="text-sm text-primary">{r.buys} buys</span>
              <span className="text-sm hidden md:inline">{npr(r.revenue)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
        <h3 className="font-semibold mb-4">Recent purchases</h3>
        {purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No purchases yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {purchases.slice(0, 12).map((p) => {
              const m = movies.find(x => x.id === p.movie_id);
              return (
                <li key={p.id} className="py-3 flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{new Date(p.purchased_at).toLocaleString()}</span>
                  <span className="font-medium">{m?.title || p.movie_id}</span>
                  <span className="text-muted-foreground">{p.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{p.method || "wallet"}</span>
                  <span className="ml-auto text-primary font-medium">{npr(p.price_paid)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Analytics;
