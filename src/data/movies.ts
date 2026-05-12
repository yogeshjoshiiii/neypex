// Type-only shim. The catalog now lives in the backend; use fetchMovies() from "@/lib/movies".
export type { Movie } from "@/lib/movies";
export { SAMPLE_VIDEO, TEASER_VIDEO } from "@/lib/movies";
