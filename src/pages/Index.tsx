import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ContentRow } from "@/components/ContentRow";
import { Footer } from "@/components/Footer";
import { SplashIntro } from "@/components/SplashIntro";
import { fetchMovies, buildRows, type Movie } from "@/lib/movies";

const Index = () => {
  const [introDone, setIntroDone] = useState(() => sessionStorage.getItem("neypex_intro") === "1");
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => { if (introDone) sessionStorage.setItem("neypex_intro", "1"); }, [introDone]);

  useEffect(() => { fetchMovies().then(setMovies); }, []);

  useEffect(() => {
    const onContext = (e: MouseEvent) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!introDone) return <SplashIntro onDone={() => setIntroDone(true)} />;

  const featured = movies.find(m => m.featured) || movies[0];
  const rows = buildRows(movies);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {featured && <Hero movie={featured} />}
        {rows.map(row => (
          <ContentRow key={row.title} title={row.title} items={row.items} compact={row.title === "Continue Watching"} />
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
