import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MovieCard } from "@/components/MovieCard";
import { fetchMovies, type Movie } from "@/lib/movies";
import { myPurchases } from "@/lib/library";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const Library = () => {
  const { user, isSignedIn } = useUser();
  const [items, items_set] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn || !user) { setLoading(false); return; }
    Promise.all([fetchMovies(), myPurchases(user.id)]).then(([all, mine]) => {
      const ids = new Set(mine.map(p => p.movie_id));
      items_set(all.filter(m => ids.has(m.id)));
      setLoading(false);
    });
  }, [isSignedIn, user?.id]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container pt-28 md:pt-32 pb-10">
        <h1 className="font-display text-4xl md:text-5xl mb-2">My Library</h1>
        <p className="text-muted-foreground mb-8">Titles you've purchased on this device. Each unlocks for 90 days.</p>
        {!isSignedIn ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <p className="text-muted-foreground mb-4">Sign in to see your library.</p>
          </div>
        ) : loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center animate-fade-in">
            <p className="text-muted-foreground mb-4">You haven't bought any titles yet.</p>
            <Link to="/" className="text-primary font-medium">Browse the catalog →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 animate-fade-in">
            {items.map(m => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Library;
