import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { fetchMovies, type Movie } from "@/lib/movies";
import { supabase } from "@/integrations/supabase/client";
import { npr } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

const Content = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [genre, setGenre] = useState("");
  const [desc, setDesc] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [duration, setDuration] = useState("");
  const [rating, setRating] = useState("PG-13");
  const [type, setType] = useState<"movie" | "series">("movie");
  const [poster, setPoster] = useState("");
  const [video, setVideo] = useState("");
  const [teaser, setTeaser] = useState("");

  const refresh = () => fetchMovies().then(setMovies);
  useEffect(() => { refresh(); }, []);

  const publish = async () => {
    if (!title.trim() || !price) {
      toast({ title: "Title and price required", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("movies").insert({
      title: title.trim(),
      description: desc,
      price: parseInt(price) || 0,
      genre: genre.split(",").map(g => g.trim()).filter(Boolean),
      year, duration, rating, type,
      poster_url: poster || null,
      backdrop_url: poster || null,
      video_url: video || null,
      teaser_url: teaser || null,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Published", description: `${title} added.` });
    setTitle(""); setPrice(""); setGenre(""); setDesc(""); setPoster(""); setVideo(""); setTeaser(""); setDuration("");
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this title?")) return;
    await supabase.from("movies").delete().eq("id", id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add new title</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Price (NPR)" type="number" value={price} onChange={e => setPrice(e.target.value)} />
          <Input placeholder="Year" type="number" value={year} onChange={e => setYear(parseInt(e.target.value || "0"))} />
          <Input placeholder="Duration (e.g. 2h 14m)" value={duration} onChange={e => setDuration(e.target.value)} />
          <Input placeholder="Rating (e.g. PG-13)" value={rating} onChange={e => setRating(e.target.value)} />
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="bg-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="movie">Movie</option>
            <option value="series">Series</option>
          </select>
          <Input placeholder="Genres (comma separated)" value={genre} onChange={e => setGenre(e.target.value)} className="md:col-span-2" />
          <textarea placeholder="Description" rows={3} value={desc} onChange={e => setDesc(e.target.value)}
            className="bg-input rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-ring md:col-span-2 text-sm" />
          <Input placeholder="Poster image URL" value={poster} onChange={e => setPoster(e.target.value)} className="md:col-span-2" />
          <Input placeholder="Full video URL" value={video} onChange={e => setVideo(e.target.value)} />
          <Input placeholder="Teaser video URL" value={teaser} onChange={e => setTeaser(e.target.value)} />
        </div>
        <Button className="mt-4 gradient-primary text-primary-foreground" onClick={publish}>Publish</Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
        <h3 className="font-semibold mb-4">All titles</h3>
        <ul className="divide-y divide-border">
          {movies.map(m => (
            <li key={m.id} className="py-3 flex items-center gap-4">
              <img src={m.poster} alt="" className="w-10 h-14 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{m.title}</div>
                <div className="text-xs text-muted-foreground">{m.type} • {npr(m.price)}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => remove(m.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Content;
