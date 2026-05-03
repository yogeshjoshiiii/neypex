import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMovies, type Movie } from "@/lib/movies";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const navigate = useNavigate();

  useEffect(() => { fetchMovies().then(setMovies); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [searchOpen]);

  const results = query.trim()
    ? movies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()) || m.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))).slice(0, 10)
    : [];

  const go = (id: string) => { setSearchOpen(false); setQuery(""); navigate(`/title/${id}`); };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-smooth ${scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-gradient-to-b from-background/80 to-transparent"}`}>
        <div className="container flex items-center justify-between h-16 md:h-20 gap-2">
          <div className="flex items-center gap-6 md:gap-8 min-w-0">
            <Link to="/" className="font-display text-2xl md:text-3xl tracking-wider no-select shrink-0">
              NEY<span className="text-gradient">PEX</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {[
                { to: "/", label: "Home" },
                { to: "/browse?type=movie", label: "Movies" },
                { to: "/browse?type=series", label: "Series" },
                { to: "/library", label: "My Library" },
              ].map(l => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => `transition-smooth hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden md:block relative flex-1 max-w-xs ml-auto mr-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search…"
              className="w-full bg-secondary/60 hover:bg-secondary rounded-full pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring transition-smooth"
            />
            {searchOpen && results.length > 0 && (
              <div className="absolute right-0 left-0 top-12 bg-popover border border-border rounded-lg shadow-card p-2 animate-scale-in origin-top max-h-80 overflow-y-auto">
                {results.map(r => (
                  <button key={r.id} onClick={() => go(r.id)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-smooth text-left">
                    <img src={r.poster} alt="" className="w-9 h-12 object-cover rounded" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.year} • {r.genre.join(", ")}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="md:hidden p-2 rounded-full hover:bg-secondary transition-smooth" aria-label="Search">
              <Search className="w-5 h-5" />
            </button>

            <SignedIn>
              <Link to="/profile" className="p-1 rounded-full hover:bg-secondary transition-smooth hidden sm:block" aria-label="Profile">
                <UserButton afterSignOutUrl="/" />
              </Link>
              <Link to="/profile" className="p-2 rounded-full hover:bg-secondary transition-smooth sm:hidden" aria-label="Profile">
                <User className="w-5 h-5" />
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 rounded-full text-sm bg-primary text-primary-foreground hover:opacity-90 transition-smooth">Sign in</button>
              </SignInButton>
            </SignedOut>

            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 rounded-full hover:bg-secondary transition-smooth" aria-label="Menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-md animate-fade-in">
            <div className="container py-3 flex flex-col gap-1">
              {[
                { to: "/", label: "Home" },
                { to: "/browse?type=movie", label: "Movies" },
                { to: "/browse?type=series", label: "Series" },
                { to: "/library", label: "My Library" },
                { to: "/profile", label: "Profile" },
              ].map(l => (
                <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `px-3 py-3 rounded-md ${isActive ? "bg-secondary" : ""}`}>
                  {l.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {searchOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background animate-fade-in flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <button onClick={() => { setSearchOpen(false); setQuery(""); }} className="p-2 rounded-full hover:bg-secondary" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search movies, series, genres..."
                className="w-full bg-secondary rounded-full pl-9 pr-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!query && <p className="text-sm text-muted-foreground p-3">Type to search the catalog…</p>}
            {query && results.length === 0 && <p className="text-sm text-muted-foreground p-3">No results.</p>}
            <ul className="space-y-1">
              {results.map(r => (
                <li key={r.id}>
                  <button onClick={() => go(r.id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-smooth text-left">
                    <img src={r.poster} alt="" className="w-12 h-16 object-cover rounded" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.year} • {r.genre.join(", ")}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
