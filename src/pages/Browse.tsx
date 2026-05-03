import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MovieCard } from "@/components/MovieCard";
import { fetchMovies, type Movie } from "@/lib/movies";
import { motion } from "framer-motion";

const Browse = () => {
  const [params] = useSearchParams();
  const type = params.get("type");
  const [movies, setMovies] = useState<Movie[]>([]);
  useEffect(() => { fetchMovies().then(setMovies); }, []);
  const list = type ? movies.filter(m => m.type === type) : movies;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container pt-28 md:pt-32 pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl mb-2 capitalize"
        >
          {type || "All Titles"}
        </motion.h1>
        <p className="text-sm text-muted-foreground mb-6">{list.length} {list.length === 1 ? "title" : "titles"} available</p>
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4"
        >
          {list.map(m => (
            <motion.div
              key={m.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="flex"
            >
              <MovieCard movie={m} fluid />
            </motion.div>
          ))}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Browse;
