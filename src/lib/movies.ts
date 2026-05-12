// Backend-backed catalog. Falls back to bundled posters when DB rows lack imagery.
import { supabase } from "@/integrations/supabase/client";
import poster1 from "@/assets/poster-1.jpg";
import poster2 from "@/assets/poster-2.jpg";
import poster3 from "@/assets/poster-3.jpg";
import poster4 from "@/assets/poster-4.jpg";
import poster5 from "@/assets/poster-5.jpg";
import poster6 from "@/assets/poster-6.jpg";
import hero1 from "@/assets/hero-1.jpg";

const POSTERS = [poster1, poster2, poster3, poster4, poster5, poster6];

export type Movie = {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  year: number;
  duration: string;
  rating: string;
  genre: string[];
  description: string;
  price: number;
  type: "movie" | "series";
  featured?: boolean;
  videoUrl?: string;
  teaserUrl?: string;
};

export const SAMPLE_VIDEO = "https://drive.google.com/file/d/1vpnBvMffAeIDbyTY_s0-qYc8LwJOl2b2/view?usp=drivesdk";
export const TEASER_VIDEO = "https://drive.google.com/file/d/1vpnBvMffAeIDbyTY_s0-qYc8LwJOl2b2/view?usp=drivesdk";

function mapRow(r: any, idx: number): Movie {
  return {
    id: r.id,
    title: r.title,
    poster: r.poster_url || POSTERS[idx % POSTERS.length],
    backdrop: r.backdrop_url || (r.featured ? hero1 : undefined),
    year: r.year || new Date().getFullYear(),
    duration: r.duration || "",
    rating: r.rating || "PG",
    genre: r.genre || [],
    description: r.description || "",
    price: r.price || 0,
    type: r.type === "series" ? "series" : "movie",
    featured: !!r.featured,
    videoUrl: r.video_url || SAMPLE_VIDEO,
    teaserUrl: r.teaser_url || TEASER_VIDEO,
  };
}

export async function fetchMovies(): Promise<Movie[]> {
  const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: true });
  return (data || []).map(mapRow);
}

export async function fetchMovie(id: string): Promise<Movie | null> {
  const { data } = await supabase.from("movies").select("*").eq("id", id).maybeSingle();
  return data ? mapRow(data, 0) : null;
}

export function buildRows(movies: Movie[]) {
  return [
    { title: "Trending Now", items: movies },
    { title: "New Releases", items: movies.slice(0, 4) },
    { title: "Top Series", items: movies.filter(m => m.type === "series") },
    { title: "Continue Watching", items: movies.slice(0, 2) },
  ];
}
