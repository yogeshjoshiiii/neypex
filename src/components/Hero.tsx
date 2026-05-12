import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/lib/movies";
import { npr } from "@/lib/format";

export const Hero = ({ movie }: { movie: Movie }) => {
  return (
    <section className="relative w-full h-[88vh] md:h-[92vh] min-h-[520px] overflow-hidden">
      <img
        src={movie.backdrop || movie.poster}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />

      <div className="container relative z-10 h-full flex items-end md:items-center pb-16 md:pb-0">
        <div className="max-w-2xl animate-slide-up">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold tracking-widest uppercase mb-4">
            NEYPEX Original
          </span>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95] mb-4">
            {movie.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="text-primary font-semibold">{movie.rating}</span>
            <span>{movie.year}</span>
            <span>{movie.duration}</span>
            <span>{movie.genre.join(" • ")}</span>
          </div>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-6 line-clamp-3">
            {movie.description}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant">
              <Link to={`/title/${movie.id}?teaser=1`}>
                <Play className="w-5 h-5 fill-current" /> Watch Teaser
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="bg-secondary/80 backdrop-blur">
              <Link to={`/title/${movie.id}`}>
                <Info className="w-5 h-5" /> More Info
              </Link>
            </Button>
            <span className="ml-1 text-sm text-muted-foreground">From <span className="text-foreground font-semibold">{npr(movie.price)}</span> • 90-day access</span>
          </div>
        </div>
      </div>
    </section>
  );
};
