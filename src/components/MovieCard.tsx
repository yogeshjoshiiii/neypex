import { Link } from "react-router-dom";
import { Play, Plus } from "lucide-react";
import type { Movie } from "@/lib/movies";
import { useEffect, useState } from "react";
import { isOwned } from "@/lib/library";
import { useUser } from "@clerk/clerk-react";
import { npr } from "@/lib/format";
import { SafeImage } from "@/components/SafeImage";

export const MovieCard = ({ movie, compact = false, fluid = false }: { movie: Movie; compact?: boolean; fluid?: boolean }) => {
  const { user } = useUser();
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isOwned(movie.id, user?.id).then(o => { if (!cancelled) setOwned(o); });
    return () => { cancelled = true; };
  }, [movie.id, user?.id]);

  const sizeCls = fluid
    ? "w-full"
    : compact
      ? "w-[24vw] sm:w-28 md:w-32 lg:w-36"
      : "w-[34vw] sm:w-40 md:w-44 lg:w-48";
  return (
    <Link
      to={`/title/${movie.id}`}
      className={`group relative shrink-0 ${sizeCls} aspect-[2/3] rounded-lg overflow-hidden bg-secondary transition-spring hover:scale-[1.04] hover:z-10 hover:shadow-elegant`}
      draggable={false}
    >
      <SafeImage
        src={movie.poster}
        alt={movie.title}
        size={600}
        className="w-full h-full transition-smooth group-hover:scale-110"
      />
      <div className="absolute inset-0 gradient-card opacity-0 group-hover:opacity-100 transition-smooth" />
      <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-smooth">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2">{movie.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{movie.year}</span>
          <span>•</span>
          <span>{movie.rating}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
            <Play className="w-4 h-4 fill-current" />
          </span>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary/80 border border-border">
            <Plus className="w-4 h-4" />
          </span>
          <span className="ml-auto text-xs font-medium">
            {owned ? <span className="text-primary">Owned</span> : npr(movie.price)}
          </span>
        </div>
      </div>
    </Link>
  );
};
