import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Trash2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

type Msg = { id: string; clerk_user_id: string; email: string; sender: "user" | "admin"; body: string; created_at: string };

const Support = () => {
  const { user } = useUser();
  const [threads, setThreads] = useState<{ clerk_user_id: string; email: string; last: Msg }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    const { data } = await supabase.from("support_messages").select("*").order("created_at", { ascending: false }).limit(500);
    const map = new Map<string, { clerk_user_id: string; email: string; last: Msg }>();
    for (const m of (data || []) as Msg[]) {
      if (!map.has(m.clerk_user_id)) map.set(m.clerk_user_id, { clerk_user_id: m.clerk_user_id, email: m.email, last: m });
    }
    setThreads([...map.values()]);
  };

  useEffect(() => {
    loadThreads();
    const ch = supabase.channel("admin-support")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, () => {
        loadThreads();
        if (active) loadThread(active);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active]);

  const loadThread = async (uid: string) => {
    const { data } = await supabase.from("support_messages").select("*").eq("clerk_user_id", uid).order("created_at", { ascending: true });
    setThread((data || []) as Msg[]);
    setTimeout(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight }), 50);
  };

  const open = (uid: string) => { setActive(uid); loadThread(uid); };

  const deleteThread = async (uid: string) => {
    if (!confirm("Delete this entire conversation for both admin and user? This cannot be undone.")) return;
    await supabase.from("support_messages").delete().eq("clerk_user_id", uid);
    if (active === uid) { setActive(null); setThread([]); }
    loadThreads();
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("support_messages").delete().eq("id", id);
    setThread(t => t.filter(m => m.id !== id));
    loadThreads();
  };

  const reply = async () => {
    if (!active || !text.trim() || !user) return;
    const t = threads.find(x => x.clerk_user_id === active);
    setText("");
    await supabase.from("support_messages").insert({
      clerk_user_id: active,
      email: t?.email || "",
      sender: "admin",
      body: text.trim(),
    });
  };

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-10rem)]">
      <div className="bg-card border border-border rounded-xl p-3 overflow-y-auto">
        <h3 className="font-semibold px-2 py-2">Conversations</h3>
        {threads.length === 0 && <p className="text-xs text-muted-foreground p-3">No messages yet.</p>}
        <ul className="space-y-1">
          {threads.map(t => (
            <li key={t.clerk_user_id} className="group flex items-center gap-1">
              <button onClick={() => open(t.clerk_user_id)} className={`flex-1 text-left p-2 rounded-md hover:bg-secondary transition-smooth ${active === t.clerk_user_id ? "bg-secondary" : ""}`}>
                <div className="text-sm font-medium truncate">{t.email}</div>
                <div className="text-xs text-muted-foreground truncate">{t.last.body}</div>
              </button>
              <button onClick={() => deleteThread(t.clerk_user_id)} className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-smooth" aria-label="Delete conversation">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        {!active ? (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select a conversation</div>
        ) : (
          <>
            <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/40">
              {thread.map(m => {
                const isImg = m.body.startsWith("[image] ");
                return (
                  <div key={m.id} className={`group/msg flex items-center gap-2 ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    {m.sender === "admin" && (
                      <button onClick={() => deleteMessage(m.id)} className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/msg:opacity-100 transition-smooth" aria-label="Delete message">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      {isImg ? <button onClick={() => setLightbox(m.body.slice(8))}><img src={m.body.slice(8)} alt="" className="rounded-lg max-h-48 hover:opacity-90 transition-smooth cursor-zoom-in" /></button> : <p className="text-sm whitespace-pre-wrap">{m.body}</p>}
                    </div>
                    {m.sender !== "admin" && (
                      <button onClick={() => deleteMessage(m.id)} className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/msg:opacity-100 transition-smooth" aria-label="Delete message">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 p-3 border-t border-border">
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && reply()}
                placeholder="Reply…" className="flex-1 bg-input rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={reply} className="p-2 rounded-full bg-primary text-primary-foreground"><Send className="w-5 h-5" /></button>
            </div>
          </>
        )}
      </div>
      {lightbox && (
        <div onClick={() => setLightbox(null)} className="fixed inset-0 z-[100] bg-black/90 grid place-items-center p-4 cursor-zoom-out">
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default Support;
