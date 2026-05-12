import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="mt-24 border-t border-border bg-background/60">
      <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl tracking-wider text-foreground">NEY<span className="text-gradient">PEX</span></span>
          <span className="opacity-50">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/profile" className="hover:text-foreground transition-smooth">Support</Link>
          <Link to="/library" className="hover:text-foreground transition-smooth">My Library</Link>
        </div>
        <p className="opacity-70">Powered by <span className="text-foreground font-medium">makeitsoft</span></p>
      </div>
    </footer>
  );
};
