import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCoupon, listCoupons, removeCoupon, type Coupon } from "@/lib/coupons";
import { fetchMovies, type Movie } from "@/lib/movies";
import { Tag, Trash2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Coupons = () => {
  const [list, setList] = useState<Coupon[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [code, setCode] = useState("");
  const [movieId, setMovieId] = useState<string>("all");
  const [percent, setPercent] = useState(10);
  const [expiry, setExpiry] = useState("");

  const refresh = () => listCoupons().then(setList);
  useEffect(() => { refresh(); fetchMovies().then(setMovies); }, []);

  const create = async () => {
    if (!code.trim() || percent < 1 || percent > 100) {
      toast({ title: "Invalid", description: "Code and 1-100% required.", variant: "destructive" });
      return;
    }
    await addCoupon({
      code: code.trim(),
      movieId,
      percent,
      expiresAt: expiry ? new Date(expiry).getTime() : undefined,
    });
    toast({ title: "Coupon created", description: `${code.toUpperCase()} • ${percent}% off` });
    setCode(""); setPercent(10); setExpiry(""); setMovieId("all");
    refresh();
  };

  const del = async (c: string) => { await removeCoupon(c); refresh(); toast({ title: "Coupon removed" }); };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Create coupon</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-xs text-muted-foreground">
            Code
            <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. NEYPEX20" className="mt-1" />
          </label>
          <label className="text-xs text-muted-foreground">
            Discount %
            <Input type="number" min={1} max={100} value={percent} onChange={e => setPercent(parseInt(e.target.value || "0"))} className="mt-1" />
          </label>
          <label className="text-xs text-muted-foreground">
            Apply to
            <select value={movieId} onChange={e => setMovieId(e.target.value)}
              className="mt-1 w-full bg-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="all">All titles</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Expiry (optional)
            <Input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="mt-1" />
          </label>
        </div>
        <Button className="mt-4 gradient-primary text-primary-foreground" onClick={create}>Create coupon</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
        <h3 className="font-semibold mb-4">Active coupons</h3>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coupons yet. Create one above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map(c => {
              const movie = c.movieId === "all" ? null : movies.find(m => m.id === c.movieId);
              return (
                <li key={c.code} className="py-3 flex items-center gap-3 flex-wrap">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-mono font-semibold">{c.code}</span>
                  <span className="text-primary">{c.percent}%</span>
                  <span className="text-sm text-muted-foreground">{movie ? `for ${movie.title}` : "All titles"}</span>
                  {c.expiresAt && <span className="text-xs text-muted-foreground">exp {new Date(c.expiresAt).toLocaleDateString()}</span>}
                  <button onClick={() => del(c.code)} className="ml-auto p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive transition-smooth">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Coupons;
