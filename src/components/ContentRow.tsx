import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { Movie } from "@/lib/movies";

export const ContentRow = ({ title, items, compact = false }: { title: string; items: Movie[]; compact?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.85), behavior: "smooth" });
  };
  if (!items.length) return null;
  return (
    <section className={compact ? "py-2 md:py-3" : "py-4 md:py-6"}>
      <div className="container flex items-center justify-between mb-3">
        <h2 className={compact ? "text-base md:text-lg font-semibold tracking-tight text-muted-foreground" : "text-lg md:text-2xl font-semibold tracking-tight"}>{title}</h2>
        <div className="hidden md:flex gap-1">
          <button onClick={() => scroll(-1)} className="p-2 rounded-full bg-secondary/60 hover:bg-secondary transition-smooth" aria-label="Scroll left">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => scroll(1)} className="p-2 rounded-full bg-secondary/60 hover:bg-secondary transition-smooth" aria-label="Scroll right">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-[max(1rem,calc((100vw-1400px)/2+1rem))] pb-2 snap-x">
        {items.map((m, i) => (
          <div key={`${m.id}-${i}`} className="snap-start animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}>
            <MovieCard movie={m} compact={compact} />
          </div>
        ))}
      </div>
    </section>
  );
};
